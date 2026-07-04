package com.cardy.walletService.service;

import com.cardy.walletService.domain.Transaction;
import com.cardy.walletService.domain.Wallet;
import com.cardy.walletService.enums.TransactionType;
import com.cardy.walletService.event.RewardGrantedEvent;
import com.cardy.walletService.repository.TransactionRepository;
import com.cardy.walletService.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletRewardService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final WalletNotificationPublisher walletNotificationPublisher;

    @Transactional
    public void processReward(RewardGrantedEvent event) {
        if (event.getCoins() == null || event.getCoins() <= 0) {
            return;
        }
        UUID userId;
        try {
            userId = UUID.fromString(event.getUserId());
        } catch (IllegalArgumentException e) {
            log.error("Invalid UUID format for userId: {}", event.getUserId(), e);
            return;
        }
        BigDecimal amount = BigDecimal.valueOf(event.getCoins());
        Optional<Wallet> walletOpt = walletRepository.findByUserId(userId);
        Wallet wallet;
        if (walletOpt.isPresent()) {
            wallet = walletOpt.get();
            wallet.setBalance(wallet.getBalance().add(amount));
            walletRepository.save(wallet);
            log.info("Added {} coins to wallet of user {}", event.getCoins(), event.getUserId());
        } else {
            log.warn("Wallet not found for user {}, creating one", event.getUserId());
            wallet = new Wallet();
            wallet.setUserId(userId);
            wallet.setBalance(amount);
            walletRepository.save(wallet);
            log.info("Created new wallet for user {} with balance {}", event.getUserId(), event.getCoins());
        }

        String desc = "Thưởng học tập: " + (event.getSource() != null ? event.getSource() : "LEARNING");
        Transaction tx = Transaction.builder()
                .wallet(wallet)
                .amount(amount)
                .type(TransactionType.REWARD)
                .description(desc)
                .build();
        transactionRepository.save(tx);

        walletNotificationPublisher.publishWalletUpdated(userId, amount, TransactionType.REWARD.name(), desc);
        log.info("Saved reward transaction and published wallet.updated event for user {}", event.getUserId());
    }
}
