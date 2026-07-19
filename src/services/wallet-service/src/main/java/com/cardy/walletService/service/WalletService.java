package com.cardy.walletService.service;

import com.cardy.walletService.dto.TopUpDTO;
import com.cardy.walletService.dto.TopUpReqDTO;
import com.cardy.walletService.dto.TransactionDTO;
import com.cardy.walletService.dto.TransactionReqDTO;
import com.cardy.walletService.dto.WalletBalanceBreakdownDTO;

import com.cardy.walletService.domain.Transaction;
import com.cardy.walletService.domain.Wallet;
import com.cardy.walletService.domain.WalletIdempotencyKey;
import com.cardy.walletService.domain.WalletLedgerEntry;
import com.cardy.walletService.enums.TransactionType;
import com.cardy.walletService.enums.WalletLedgerSource;
import com.cardy.walletService.enums.WalletLedgerType;
import com.cardy.walletService.repository.TransactionRepository;
import com.cardy.walletService.repository.WalletIdempotencyKeyRepository;
import com.cardy.walletService.repository.WalletLedgerEntryRepository;
import com.cardy.walletService.repository.WalletRepository;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
public class WalletService {
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final WalletLedgerEntryRepository walletLedgerEntryRepository;
    private final WalletIdempotencyKeyRepository walletIdempotencyKeyRepository;
    private final SystemConfigService systemConfigService;
    private final WalletNotificationPublisher walletNotificationPublisher;
    private final WalletHoldService walletHoldService;

    public WalletService(WalletRepository walletRepository,
                         TransactionRepository transactionRepository,
                         WalletLedgerEntryRepository walletLedgerEntryRepository,
                         WalletIdempotencyKeyRepository walletIdempotencyKeyRepository,
                         SystemConfigService systemConfigService,
                         WalletNotificationPublisher walletNotificationPublisher,
                         WalletHoldService walletHoldService){
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
        this.walletLedgerEntryRepository = walletLedgerEntryRepository;
        this.walletIdempotencyKeyRepository = walletIdempotencyKeyRepository;
        this.systemConfigService = systemConfigService;
        this.walletNotificationPublisher = walletNotificationPublisher;
        this.walletHoldService = walletHoldService;
    }

    private Wallet getOrCreateWallet(UUID userId) {
        return walletRepository.findByUserId(userId)
                .map(wallet -> {
                    wallet.recalculateBalance();
                    return wallet;
                })
                .orElseGet(() -> {
                    Wallet wallet = Wallet.builder()
                            .userId(userId)
                            .build();
                    wallet.recalculateBalance();
                    return walletRepository.save(wallet);
                });
    }

    private void creditBalance(UUID userId,
                               BigDecimal amount,
                               WalletLedgerSource source,
                               WalletLedgerType ledgerType,
                               TransactionType transactionType,
                               String description,
                               BigDecimal amountVnd,
                               BigDecimal rateVndPerCoin) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Số coin phải lớn hơn 0");
        }
        Wallet wallet = getOrCreateWallet(userId);
        requireActive(wallet);
        creditSource(wallet, source, amount);
        wallet.recalculateBalance();
        walletRepository.save(wallet);

        Transaction tx = Transaction.builder()
                .wallet(wallet)
                .amount(amount)
                .type(transactionType)
                .description(description)
                .build();
        transactionRepository.save(tx);
        writeLedger(wallet, ledgerType, source, amount, amountVnd, rateVndPerCoin,
                null, null, description);

        walletNotificationPublisher.publishWalletUpdated(userId, amount, transactionType.name(), description);
    }

    private void creditSource(Wallet wallet, WalletLedgerSource source, BigDecimal amount) {
        wallet.recalculateBalance();
        switch (source) {
            case BONUS -> wallet.setBonusBalance(wallet.getBonusBalance().add(amount));
            case REWARD -> wallet.setRewardBalance(wallet.getRewardBalance().add(amount));
            case PAID -> wallet.setPaidBalance(wallet.getPaidBalance().add(amount));
            case EARNED_WITHDRAWABLE -> wallet.setEarnedWithdrawableBalance(wallet.getEarnedWithdrawableBalance().add(amount));
            case EARNED_PROMO -> wallet.setEarnedPromoBalance(wallet.getEarnedPromoBalance().add(amount));
            default -> throw new IllegalArgumentException("Unsupported wallet credit source: " + source);
        }
    }

    private WalletLedgerEntry writeLedger(Wallet wallet,
                                          WalletLedgerType type,
                                          WalletLedgerSource source,
                                          BigDecimal amount,
                                          BigDecimal amountVnd,
                                          BigDecimal rateVndPerCoin,
                                          String orderId,
                                          String idempotencyKey,
                                          String description) {
        return writeLedger(wallet, type, source, amount, amountVnd, rateVndPerCoin,
                orderId, null, null, null, idempotencyKey, description);
    }

    private WalletLedgerEntry writeLedger(Wallet wallet,
                                          WalletLedgerType type,
                                          WalletLedgerSource source,
                                          BigDecimal amount,
                                          BigDecimal amountVnd,
                                          BigDecimal rateVndPerCoin,
                                          String orderId,
                                          String orderItemId,
                                          String escrowId,
                                          UUID counterpartyUserId,
                                          String idempotencyKey,
                                          String description) {
        BigDecimal withdrawable = source == WalletLedgerSource.EARNED_WITHDRAWABLE ? amount : BigDecimal.ZERO;
        BigDecimal nonWithdrawable = source == WalletLedgerSource.EARNED_WITHDRAWABLE ? BigDecimal.ZERO : amount;
        WalletLedgerEntry entry = WalletLedgerEntry.builder()
                .wallet(wallet)
                .userId(wallet.getUserId())
                .type(type)
                .source(source)
                .amount(amount)
                .withdrawableAmount(withdrawable)
                .nonWithdrawableAmount(nonWithdrawable)
                .amountVnd(amountVnd)
                .rateVndPerCoin(rateVndPerCoin)
                .orderId(orderId)
                .orderItemId(orderItemId)
                .escrowId(escrowId)
                .counterpartyUserId(counterpartyUserId)
                .idempotencyKey(idempotencyKey)
                .description(description)
                .build();
        return walletLedgerEntryRepository.save(entry);
    }
    @Transactional
    public void createWallet(UUID userId, boolean isTeacher) {
        String initializationKey = "user:" + userId + ":wallet-initialized";
        if (walletIdempotencyKeyRepository.existsById(initializationKey)) {
            return;
        }

        String legacyLedgerKey = "user:" + userId + ":initial-bonus";
        List<WalletLedgerEntry> legacyEntries = walletLedgerEntryRepository
                .findByIdempotencyKeyAndTypeOrderByCreatedAtAsc(legacyLedgerKey, WalletLedgerType.INITIAL_BONUS);
        if (legacyEntries != null && !legacyEntries.isEmpty()) {
            walletIdempotencyKeyRepository.save(WalletIdempotencyKey.builder()
                    .idempotencyKey(initializationKey)
                    .operation(WalletLedgerType.INITIAL_BONUS.name())
                    .build());
            return;
        }

        BigDecimal teacherInitial = systemConfigService.getBigDecimal(
                SystemConfigService.KEY_TEACHER_INITIAL_COIN, BigDecimal.ZERO);
        BigDecimal studentInitial = systemConfigService.getBigDecimal(
                SystemConfigService.KEY_STUDENT_INITIAL_COIN, new BigDecimal("500"));
        BigDecimal configuredBalance = isTeacher ? teacherInitial : studentInitial;
        BigDecimal defaultBalance = configuredBalance == null ? BigDecimal.ZERO : configuredBalance;

        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseGet(() -> Wallet.builder().userId(userId).build());
        wallet.recalculateBalance();
        if (defaultBalance.compareTo(BigDecimal.ZERO) > 0) {
            wallet.setBonusBalance(wallet.getBonusBalance().add(defaultBalance));
        }
        wallet.recalculateBalance();
        Wallet saved = walletRepository.save(wallet);

        if (defaultBalance.compareTo(BigDecimal.ZERO) > 0) {
            writeLedger(saved, WalletLedgerType.INITIAL_BONUS, WalletLedgerSource.BONUS,
                    defaultBalance, null, null, null, "user:" + userId + ":initial-bonus",
                    isTeacher ? "Initial teacher bonus" : "Initial student bonus");
        }
        walletIdempotencyKeyRepository.save(WalletIdempotencyKey.builder()
                .idempotencyKey(initializationKey)
                .operation(WalletLedgerType.INITIAL_BONUS.name())
                .build());
    }

    @Transactional
    public void deposit(UUID userId, TransactionReqDTO req) {
        creditBalance(userId, req.getAmount(), WalletLedgerSource.PAID, WalletLedgerType.TOP_UP,
                TransactionType.DEPOSIT, req.getDescription(), null, null);
    }

    @Transactional
    public TopUpDTO topUp(UUID userId, TopUpReqDTO req) {
        if (req.getAmountVnd() == null || req.getAmountVnd().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Số tiền nạp phải lớn hơn 0");
        }
        BigDecimal rate = systemConfigService.getBigDecimal(
                SystemConfigService.KEY_TOPUP_VND_PER_COIN, new BigDecimal("100"));
        if (rate == null || rate.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("Tỷ giá nạp tiền không hợp lệ (phải lớn hơn 0). Vui lòng liên hệ Quản trị viên.");
        }
        BigDecimal coins = req.getAmountVnd().divide(rate, 0, java.math.RoundingMode.FLOOR);
        if (coins.compareTo(BigDecimal.ONE) < 0) {
            throw new IllegalArgumentException("Số tiền nạp không đủ để quy đổi tối thiểu 1 Coin (tỷ giá hiện tại: " + rate.toPlainString() + " VNĐ/Coin)");
        }
        String description = "Nạp tiền: " + req.getAmountVnd().toPlainString() + " VNĐ = " + coins.toPlainString() + " Coin";
        creditBalance(userId, coins, WalletLedgerSource.PAID, WalletLedgerType.TOP_UP,
                TransactionType.TOP_UP, description, req.getAmountVnd(), rate);

        return TopUpDTO.builder()
                .coinsReceived(coins)
                .amountVnd(req.getAmountVnd())
                .rate(rate)
                .message("Nạp tiền thành công! Bạn nhận được " + coins.toPlainString() + " Coin.")
                .build();
    }

    @Transactional
    public void reward(UUID userId, TransactionReqDTO req) {
        creditBalance(userId, req.getAmount(), WalletLedgerSource.REWARD, WalletLedgerType.LEARNING_REWARD,
                TransactionType.REWARD, req.getDescription(), null, null);
    }

    @Transactional
    public void spend(UUID userId, TransactionReqDTO req) {
        debitPurchase(userId, req.getAmount(), req.getDescription(), null, null);
    }

    @Transactional
    public WalletDebitResult debitPurchase(UUID userId,
                                           BigDecimal amount,
                                           String description,
                                           String orderId,
                                           String idempotencyKey) {
        Wallet wallet = getOrCreateWallet(userId);
        if (idempotencyKey != null && walletIdempotencyKeyRepository.existsById(idempotencyKey)) {
            return existingDebitResult(idempotencyKey);
        }
        WalletDebitResult result = WalletSourceAllocator.allocatePurchase(wallet, amount);
        walletRepository.save(wallet);

        List<String> ledgerIds = new ArrayList<>();
        result.amounts().forEach((source, debitAmount) -> {
            WalletLedgerEntry entry = writeLedger(wallet, WalletLedgerType.PURCHASE_DEBIT, source,
                    debitAmount.negate(), null, null, orderId, idempotencyKey, description);
            ledgerIds.add(entry.getId().toString());
        });

        Transaction tx = Transaction.builder()
                .wallet(wallet)
                .amount(amount.negate())
                .type(TransactionType.WITHDRAW)
                .description(description)
                .build();
        transactionRepository.save(tx);
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            walletIdempotencyKeyRepository.save(WalletIdempotencyKey.builder()
                    .idempotencyKey(idempotencyKey)
                    .orderId(orderId)
                    .operation(WalletLedgerType.PURCHASE_DEBIT.name())
                    .build());
        }
        return new WalletDebitResult(result.amounts(), ledgerIds);
    }

    private WalletDebitResult existingDebitResult(String idempotencyKey) {
        List<WalletLedgerEntry> entries = walletLedgerEntryRepository.findByIdempotencyKeyAndTypeOrderByCreatedAtAsc(
                idempotencyKey,
                WalletLedgerType.PURCHASE_DEBIT);
        java.util.EnumMap<WalletLedgerSource, BigDecimal> amounts = new java.util.EnumMap<>(WalletLedgerSource.class);
        List<String> ledgerIds = new ArrayList<>();
        for (WalletLedgerEntry entry : entries) {
            if (entry.getSource() != null && entry.getAmount() != null) {
                amounts.merge(entry.getSource(), entry.getAmount().abs(), BigDecimal::add);
            }
            if (entry.getId() != null) {
                ledgerIds.add(entry.getId().toString());
            }
        }
        return new WalletDebitResult(amounts, ledgerIds);
    }

    @Transactional
    public void cashOut(UUID userId, BigDecimal amount, String customDescription) {
        if (walletHoldService != null && !walletHoldService.canCashOut(userId)) {
            throw new IllegalStateException("Cash-out is blocked due to an active account hold (e.g. wash trading review)");
        }
        BigDecimal min = systemConfigService.getBigDecimal(SystemConfigService.KEY_CASH_OUT_MIN_COINS, new BigDecimal("10"));
        BigDecimal multiple = systemConfigService.getBigDecimal(SystemConfigService.KEY_CASH_OUT_MULTIPLE, new BigDecimal("10"));
        if (amount == null || amount.compareTo(min) < 0 || amount.remainder(multiple).compareTo(BigDecimal.ZERO) != 0) {
            throw new IllegalArgumentException("Số tiền rút phải lớn hơn hoặc bằng " + min.toPlainString() + " và là bội số của " + multiple.toPlainString());
        }
        BigDecimal coinToVnd = systemConfigService.getBigDecimal(
                SystemConfigService.KEY_WITHDRAWAL_VND_PER_COIN, new BigDecimal("90"));
        BigDecimal vnd = amount.multiply(coinToVnd);
        String description = "Quy đổi: " + amount.toPlainString() + " Coins = " + vnd.toPlainString() + " VNĐ";
        if (customDescription != null && !customDescription.trim().isEmpty()) {
            description += " (" + customDescription + ")";
        }
        Wallet wallet = getOrCreateWallet(userId);
        WalletSourceAllocator.allocateCashOut(wallet, amount);
        walletRepository.save(wallet);

        Transaction tx = Transaction.builder()
                .wallet(wallet)
                .amount(amount.negate())
                .type(TransactionType.CASH_OUT)
                .description(description)
                .build();
        transactionRepository.save(tx);
        writeLedger(wallet, WalletLedgerType.CASH_OUT, WalletLedgerSource.EARNED_WITHDRAWABLE,
                amount.negate(), vnd, coinToVnd, null, null, description);
        walletNotificationPublisher.publishWalletUpdated(userId, amount.negate(), TransactionType.CASH_OUT.name(), description);
    }

    @Transactional
    public Wallet applyFreeze(UUID userId, String reason, String sourceFlagId, String createdBy) {
        Wallet wallet = getOrCreateWallet(userId);
        if (wallet.isFrozen()) {
            return wallet;
        }
        wallet.setFrozen(true);
        wallet.recalculateBalance();
        Wallet saved = walletRepository.save(wallet);
        String description = controlDescription("Freeze wallet", reason, sourceFlagId, createdBy);
        writeLedger(saved, WalletLedgerType.WALLET_FREEZE, WalletLedgerSource.SYSTEM,
                BigDecimal.ZERO, null, null, null,
                freezeIdempotencyKey("wallet-freeze", userId, sourceFlagId), description);
        walletNotificationPublisher.publishWalletUpdated(userId, BigDecimal.ZERO,
                WalletLedgerType.WALLET_FREEZE.name(), description);
        return saved;
    }

    @Transactional
    public Wallet removeFreeze(UUID userId, String reason, String adminId) {
        Wallet wallet = getOrCreateWallet(userId);
        if (!wallet.isFrozen()) {
            return wallet;
        }
        wallet.setFrozen(false);
        wallet.recalculateBalance();
        Wallet saved = walletRepository.save(wallet);
        String description = controlDescription("Unfreeze wallet", reason, null, adminId);
        writeLedger(saved, WalletLedgerType.WALLET_UNFREEZE, WalletLedgerSource.SYSTEM,
                BigDecimal.ZERO, null, null, null,
                freezeIdempotencyKey("wallet-unfreeze", userId, adminId), description);
        walletNotificationPublisher.publishWalletUpdated(userId, BigDecimal.ZERO,
                WalletLedgerType.WALLET_UNFREEZE.name(), description);
        return saved;
    }

    private String freezeIdempotencyKey(String operation, UUID userId, String source) {
        String suffix = source == null || source.isBlank() ? "manual" : source;
        return operation + ":" + suffix + ":" + userId;
    }

    private String controlDescription(String action, String reason, String sourceFlagId, String actor) {
        StringBuilder description = new StringBuilder(action);
        if (reason != null && !reason.isBlank()) {
            description.append(": ").append(reason);
        }
        if (sourceFlagId != null && !sourceFlagId.isBlank()) {
            description.append(" (flag=").append(sourceFlagId).append(")");
        }
        if (actor != null && !actor.isBlank()) {
            description.append(" by ").append(actor);
        }
        return description.toString();
    }

    @Transactional
    public void creditEscrowRelease(UUID sellerUserId,
                                    UUID buyerUserId,
                                    BigDecimal teacherWithdrawableAmount,
                                    BigDecimal teacherPromoAmount,
                                    BigDecimal platformFeeReal,
                                    BigDecimal platformFeePromoSink,
                                    String orderId,
                                    String orderItemId,
                                    String escrowId,
                                    String idempotencyKey) {
        requireIdempotencyKey(idempotencyKey);
        if (walletIdempotencyKeyRepository.existsById(idempotencyKey)) {
            return;
        }

        Wallet wallet = getOrCreateWallet(sellerUserId);
        requireActive(wallet);
        BigDecimal withdrawable = positiveOrZero(teacherWithdrawableAmount);
        BigDecimal promo = positiveOrZero(teacherPromoAmount);
        BigDecimal realFee = positiveOrZero(platformFeeReal);
        BigDecimal promoSink = positiveOrZero(platformFeePromoSink);
        BigDecimal teacherTotal = withdrawable.add(promo);
        if (teacherTotal.compareTo(BigDecimal.ZERO) <= 0 && realFee.add(promoSink).compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Escrow release amount must be positive");
        }

        if (withdrawable.compareTo(BigDecimal.ZERO) > 0) {
            creditSource(wallet, WalletLedgerSource.EARNED_WITHDRAWABLE, withdrawable);
            writeLedger(wallet, WalletLedgerType.ESCROW_RELEASE_CREDIT, WalletLedgerSource.EARNED_WITHDRAWABLE,
                    withdrawable, null, null, orderId, orderItemId, escrowId, buyerUserId,
                    idempotencyKey, "Escrow release withdrawable earning");
        }
        if (promo.compareTo(BigDecimal.ZERO) > 0) {
            creditSource(wallet, WalletLedgerSource.EARNED_PROMO, promo);
            writeLedger(wallet, WalletLedgerType.ESCROW_RELEASE_CREDIT, WalletLedgerSource.EARNED_PROMO,
                    promo, null, null, orderId, orderItemId, escrowId, buyerUserId,
                    idempotencyKey, "Escrow release app-only earning");
        }
        if (realFee.compareTo(BigDecimal.ZERO) > 0) {
            writeLedger(wallet, WalletLedgerType.PLATFORM_FEE_REAL, WalletLedgerSource.PLATFORM_FEE_REAL,
                    realFee, null, null, orderId, orderItemId, escrowId, buyerUserId,
                    idempotencyKey, "Paid-backed platform fee");
        }
        if (promoSink.compareTo(BigDecimal.ZERO) > 0) {
            writeLedger(wallet, WalletLedgerType.PLATFORM_FEE_PROMO_SINK, WalletLedgerSource.PLATFORM_FEE_PROMO_SINK,
                    promoSink, null, null, orderId, orderItemId, escrowId, buyerUserId,
                    idempotencyKey, "Promo-backed platform fee sink");
        }

        wallet.recalculateBalance();
        walletRepository.save(wallet);
        walletIdempotencyKeyRepository.save(WalletIdempotencyKey.builder()
                .idempotencyKey(idempotencyKey)
                .orderId(orderId)
                .operation(WalletLedgerType.ESCROW_RELEASE_CREDIT.name())
                .build());

        if (teacherTotal.compareTo(BigDecimal.ZERO) > 0) {
            Transaction tx = Transaction.builder()
                    .wallet(wallet)
                    .amount(teacherTotal)
                    .type(TransactionType.REWARD)
                    .description("Escrow release for order " + orderId)
                    .build();
            transactionRepository.save(tx);
            walletNotificationPublisher.publishWalletUpdated(sellerUserId, teacherTotal,
                    TransactionType.REWARD.name(), "Escrow release for order " + orderId);
        }
    }

    @Transactional
    public void refundEscrowPurchase(UUID buyerUserId,
                                     BigDecimal bonusAmount,
                                     BigDecimal rewardAmount,
                                     BigDecimal paidAmount,
                                     BigDecimal earnedPromoAmount,
                                     String orderId,
                                     String orderItemId,
                                     String escrowId,
                                     String idempotencyKey) {
        requireIdempotencyKey(idempotencyKey);
        if (walletIdempotencyKeyRepository.existsById(idempotencyKey)) {
            return;
        }

        Wallet wallet = getOrCreateWallet(buyerUserId);
        requireActive(wallet);
        BigDecimal bonus = positiveOrZero(bonusAmount);
        BigDecimal reward = positiveOrZero(rewardAmount);
        BigDecimal paid = positiveOrZero(paidAmount);
        BigDecimal earnedPromo = positiveOrZero(earnedPromoAmount);
        BigDecimal total = bonus.add(reward).add(paid).add(earnedPromo);
        if (total.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Refund amount must be positive");
        }

        creditRefundSource(wallet, WalletLedgerSource.BONUS, bonus, orderId, orderItemId, escrowId, idempotencyKey);
        creditRefundSource(wallet, WalletLedgerSource.REWARD, reward, orderId, orderItemId, escrowId, idempotencyKey);
        creditRefundSource(wallet, WalletLedgerSource.PAID, paid, orderId, orderItemId, escrowId, idempotencyKey);
        creditRefundSource(wallet, WalletLedgerSource.EARNED_PROMO, earnedPromo, orderId, orderItemId, escrowId, idempotencyKey);

        wallet.recalculateBalance();
        walletRepository.save(wallet);
        walletIdempotencyKeyRepository.save(WalletIdempotencyKey.builder()
                .idempotencyKey(idempotencyKey)
                .orderId(orderId)
                .operation(WalletLedgerType.ESCROW_REFUND_CREDIT.name())
                .build());

        Transaction tx = Transaction.builder()
                .wallet(wallet)
                .amount(total)
                .type(TransactionType.DEPOSIT)
                .description("Escrow refund for order " + orderId)
                .build();
        transactionRepository.save(tx);
        walletNotificationPublisher.publishWalletUpdated(buyerUserId, total,
                TransactionType.DEPOSIT.name(), "Escrow refund for order " + orderId);
    }

    private void creditRefundSource(Wallet wallet,
                                    WalletLedgerSource source,
                                    BigDecimal amount,
                                    String orderId,
                                    String orderItemId,
                                    String escrowId,
                                    String idempotencyKey) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        creditSource(wallet, source, amount);
        writeLedger(wallet, WalletLedgerType.ESCROW_REFUND_CREDIT, source, amount,
                null, null, orderId, orderItemId, escrowId, null, idempotencyKey,
                "Escrow refund to original source");
    }

    private void requireIdempotencyKey(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new IllegalArgumentException("idempotencyKey is required");
        }
    }

    private BigDecimal positiveOrZero(BigDecimal amount) {
        if (amount == null) {
            return BigDecimal.ZERO;
        }
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("amount must not be negative");
        }
        return amount;
    }
    private void requireActive(Wallet wallet) {
        if (wallet != null && wallet.isFrozen()) {
            throw new IllegalStateException("Ví đang bị khóa, không thể thực hiện giao dịch.");
        }
    }

    @Transactional
    public BigDecimal getBalance(UUID userId){
        return walletRepository.findByUserId(userId)
                .map(Wallet::getBalance)
                .orElse(BigDecimal.ZERO);
    }

    @Transactional
    public WalletBalanceBreakdownDTO getBalanceBreakdown(UUID userId) {
        Wallet wallet = getOrCreateWallet(userId);
        return WalletBalanceBreakdownDTO.builder()
                .balance(wallet.getBalance())
                .bonusBalance(wallet.getBonusBalance())
                .rewardBalance(wallet.getRewardBalance())
                .paidBalance(wallet.getPaidBalance())
                .earnedWithdrawableBalance(wallet.getEarnedWithdrawableBalance())
                .earnedPromoBalance(wallet.getEarnedPromoBalance())
                .heldBalance(wallet.getHeldBalance())
                .frozen(wallet.isFrozen())
                .build();
    }

    private TransactionDTO toDto(Transaction transaction){
        return TransactionDTO.builder()
                .id(transaction.getId().toString())
                .type(transaction.getType().toString())
                .amount(transaction.getAmount())
                .description(transaction.getDescription())
                .createdAt(transaction.getCreatedAt())
                .build();
    }

    @Transactional
    public List<TransactionDTO> getHistory(UUID userId){
        Wallet wallet = walletRepository.findByUserId(userId).orElseThrow(() -> new RuntimeException("Ví không tồn tại"));

        List<Transaction> transactions = transactionRepository.findByWalletIdOrderByCreatedAtDesc(wallet.getId());

        return transactions.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }
}



