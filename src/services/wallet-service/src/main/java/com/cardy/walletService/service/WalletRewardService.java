package com.cardy.walletService.service;

import com.cardy.walletService.dto.TransactionReqDTO;
import com.cardy.walletService.enums.TransactionType;
import com.cardy.walletService.event.RewardGrantedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletRewardService {

    private final WalletService walletService;

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
        String desc = "Thưởng học tập: " + (event.getSource() != null ? event.getSource() : "LEARNING");
        walletService.reward(userId, new TransactionReqDTO(amount, desc));
        log.info("Saved reward transaction and published wallet.updated event for user {}", event.getUserId());
    }
}
