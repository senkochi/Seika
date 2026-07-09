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

    public WalletService(WalletRepository walletRepository,
                         TransactionRepository transactionRepository,
                         WalletLedgerEntryRepository walletLedgerEntryRepository,
                         WalletIdempotencyKeyRepository walletIdempotencyKeyRepository,
                         SystemConfigService systemConfigService,
                         WalletNotificationPublisher walletNotificationPublisher){
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
        this.walletLedgerEntryRepository = walletLedgerEntryRepository;
        this.walletIdempotencyKeyRepository = walletIdempotencyKeyRepository;
        this.systemConfigService = systemConfigService;
        this.walletNotificationPublisher = walletNotificationPublisher;
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
                .idempotencyKey(idempotencyKey)
                .description(description)
                .build();
        return walletLedgerEntryRepository.save(entry);
    }

    @Transactional
    public void createWallet(UUID userId, boolean isTeacher) {
        BigDecimal teacherInitial = systemConfigService.getBigDecimal(
                SystemConfigService.KEY_TEACHER_INITIAL_COIN, BigDecimal.ZERO);
        BigDecimal studentInitial = systemConfigService.getBigDecimal(
                SystemConfigService.KEY_STUDENT_INITIAL_COIN, new BigDecimal("500"));
        BigDecimal defaultBalance = isTeacher ? teacherInitial : studentInitial;
        walletRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Wallet wallet = Wallet.builder()
                            .userId(userId)
                            .bonusBalance(defaultBalance)
                            .build();
                    wallet.recalculateBalance();
                    Wallet saved = walletRepository.save(wallet);
                    if (defaultBalance.compareTo(BigDecimal.ZERO) > 0) {
                        writeLedger(saved, WalletLedgerType.INITIAL_BONUS, WalletLedgerSource.BONUS,
                                defaultBalance, null, null, null, "user:" + userId + ":initial-bonus",
                                isTeacher ? "Initial teacher bonus" : "Initial student bonus");
                    }
                    return saved;
                });
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
        walletNotificationPublisher.publishWalletUpdated(userId, amount.negate(), TransactionType.WITHDRAW.name(), description);
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
