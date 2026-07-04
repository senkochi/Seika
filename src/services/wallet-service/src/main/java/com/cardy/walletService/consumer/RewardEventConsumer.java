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
    public void handleRewardGrantedEvent(org.springframework.amqp.core.Message message) {
        try {
            String body = new String(message.getBody());
            log.info("Received raw RewardGrantedEvent message: {}", body);
            
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            mapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
            mapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            
            RewardGrantedEvent event = mapper.readValue(body, RewardGrantedEvent.class);
            log.info("Parsed RewardGrantedEvent for user {}, coins: {}", event.getUserId(), event.getCoins());

            walletRewardService.processReward(event);

        } catch (Exception e) {
            log.error("Error processing RewardGrantedEvent", e);
        }
    }
}
