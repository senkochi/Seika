package com.cardy.walletService.consumer;

import com.cardy.walletService.config.RabbitMQConfig;
import com.cardy.walletService.event.RewardGrantedEvent;
import com.cardy.walletService.service.WalletRewardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class RewardEventConsumer {

    private final WalletRewardService walletRewardService;

    @RabbitListener(queues = RabbitMQConfig.WALLET_REWARD_QUEUE)
    public void handleRewardGrantedEvent(RewardGrantedEvent event) {
        log.info("Received RewardGrantedEvent for user {}, coins: {}", event.getUserId(), event.getCoins());
        walletRewardService.processReward(event);
    }
}
