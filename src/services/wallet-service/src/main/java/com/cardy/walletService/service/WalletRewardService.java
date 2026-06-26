package com.cardy.walletService.service;

import com.cardy.walletService.domain.Wallet;
import com.cardy.walletService.event.RewardGrantedEvent;
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
        Optional<Wallet> walletOpt = walletRepository.findByUserId(userId);
        if (walletOpt.isPresent()) {
            Wallet wallet = walletOpt.get();
            wallet.setBalance(wallet.getBalance().add(BigDecimal.valueOf(event.getCoins())));
            walletRepository.save(wallet);
            log.info("Added {} coins to wallet of user {}", event.getCoins(), event.getUserId());
        } else {
            log.warn("Wallet not found for user {}, creating one", event.getUserId());
            Wallet newWallet = new Wallet();
            newWallet.setUserId(userId);
            newWallet.setBalance(BigDecimal.valueOf(event.getCoins()));
            walletRepository.save(newWallet);
            log.info("Created new wallet for user {} with balance {}", event.getUserId(), event.getCoins());
        }
    }
}
