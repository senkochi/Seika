package com.cardy.walletService.service;

import com.cardy.walletService.dto.TopUpDTO;
import com.cardy.walletService.dto.TopUpReqDTO;
import com.cardy.walletService.dto.TransactionDTO;
import com.cardy.walletService.dto.TransactionReqDTO;

import com.cardy.walletService.domain.Transaction;
import com.cardy.walletService.domain.Wallet;
import com.cardy.walletService.enums.TransactionType;
import com.cardy.walletService.repository.TransactionRepository;
import com.cardy.walletService.repository.WalletRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class WalletService {
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final SystemConfigService systemConfigService;
    private final WalletNotificationPublisher walletNotificationPublisher;

    public WalletService(WalletRepository walletRepository,
                         TransactionRepository transactionRepository,
                         SystemConfigService systemConfigService,
                         WalletNotificationPublisher walletNotificationPublisher){
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
        this.systemConfigService = systemConfigService;
        this.walletNotificationPublisher = walletNotificationPublisher;
    }

    private void updateBalance(UUID userId, BigDecimal amount, TransactionType type, String description) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseGet(() -> walletRepository.save(
                        Wallet.builder()
                                .userId(userId)
                                .balance(systemConfigService.getBigDecimal(
                                        SystemConfigService.KEY_STUDENT_INITIAL_COIN,
                                        new BigDecimal("500")))
                                .build()
                ));

        BigDecimal newBalance = wallet.getBalance().add(amount);

        if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalStateException("Số dư không đủ để thực hiện giao dịch!");
        }

        wallet.setBalance(newBalance);
        walletRepository.save(wallet);

        Transaction tx = Transaction.builder()
                .wallet(wallet)
                .amount(amount)
                .type(type)
                .description(description)
                .build();
        transactionRepository.save(tx);

        walletNotificationPublisher.publishWalletUpdated(userId, amount, type.name(), description);
    }

    @Transactional
    public void createWallet(UUID userId, boolean isTeacher) {
        BigDecimal teacherInitial = systemConfigService.getBigDecimal(
                SystemConfigService.KEY_TEACHER_INITIAL_COIN, BigDecimal.ZERO);
        BigDecimal studentInitial = systemConfigService.getBigDecimal(
                SystemConfigService.KEY_STUDENT_INITIAL_COIN, new BigDecimal("500"));
        BigDecimal defaultBalance = isTeacher ? teacherInitial : studentInitial;
        walletRepository.findByUserId(userId)
                .orElseGet(() -> walletRepository.save(
                        Wallet.builder().userId(userId).balance(defaultBalance).build()
                ));
    }

    @Transactional
    public void deposit(UUID userId, TransactionReqDTO req) {
        updateBalance(userId, req.getAmount(), TransactionType.DEPOSIT, req.getDescription());
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
        updateBalance(userId, coins, TransactionType.TOP_UP, description);

        return TopUpDTO.builder()
                .coinsReceived(coins)
                .amountVnd(req.getAmountVnd())
                .rate(rate)
                .message("Nạp tiền thành công! Bạn nhận được " + coins.toPlainString() + " Coin.")
                .build();
    }

    @Transactional
    public void reward(UUID userId, TransactionReqDTO req) {
        updateBalance(userId, req.getAmount(), TransactionType.REWARD, req.getDescription());
    }

    @Transactional
    public void spend(UUID userId, TransactionReqDTO req) {
        updateBalance(userId, req.getAmount().negate(), TransactionType.WITHDRAW, req.getDescription());
    }

    @Transactional
    public void cashOut(UUID userId, BigDecimal amount, String customDescription) {
        if (amount == null || amount.compareTo(new BigDecimal("10")) < 0 || amount.remainder(new BigDecimal("10")).compareTo(BigDecimal.ZERO) != 0) {
            throw new IllegalArgumentException("Số tiền rút phải lớn hơn hoặc bằng 10 và là bội số của 10");
        }
        BigDecimal coinToVnd = systemConfigService.getBigDecimal(
                SystemConfigService.KEY_WITHDRAWAL_VND_PER_COIN, new BigDecimal("90"));
        BigDecimal vnd = amount.multiply(coinToVnd);
        String description = "Quy đổi: " + amount.toPlainString() + " Coins = " + vnd.toPlainString() + " VNĐ";
        if (customDescription != null && !customDescription.trim().isEmpty()) {
            description += " (" + customDescription + ")";
        }
        updateBalance(userId, amount.negate(), TransactionType.CASH_OUT, description);
    }

    @Transactional
    public BigDecimal getBalance(UUID userId){
        return walletRepository.findByUserId(userId)
                .map(Wallet::getBalance)
                .orElse(BigDecimal.ZERO);
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
