package com.cardy.walletService.service;

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

    public WalletService(WalletRepository walletRepository, TransactionRepository transactionRepository){
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
    }

    private void updateBalance(UUID userId, BigDecimal amount, TransactionType type, String description) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseGet(() -> walletRepository.save(
                        Wallet.builder().userId(userId).balance(BigDecimal.ZERO).build()
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
    }

    @Transactional
    public void deposit(UUID userId, TransactionReqDTO req) {
        updateBalance(userId, req.getAmount(), TransactionType.DEPOSIT, req.getDescription());
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
    public BigDecimal getBalance(UUID userId){
        return walletRepository.findByUserId(userId)
                .map(Wallet::getBalance)
                .orElse(BigDecimal.ZERO);
    }

    private TransactionDTO toDto(Transaction transaction){
        return TransactionDTO.builder()
                .id(transaction.getId().toString())
                .amount(transaction.getAmount())
                .description(transaction.getDescription())
                .createdAt(transaction.getCreatedAt())
                .build();
    }

    @Transactional
    public List<TransactionDTO> getHistory(UUID userId){
        Wallet wallet = walletRepository.findByUserId(userId).orElseThrow(() -> new RuntimeException("Ví không tồn tại"));

        List<Transaction> transactions = transactionRepository.findByWalletId(wallet.getId());

        return transactions.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }
}
