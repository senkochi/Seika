package com.cardy.walletService.service;

import com.cardy.walletService.config.RabbitMQConfig;
import com.cardy.walletService.event.WalletUpdatedEvent;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletNotificationPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    public void publishWalletUpdated(UUID userId, BigDecimal amount, String transactionType, String description) {
        if (userId == null) return;
        WalletUpdatedEvent event = WalletUpdatedEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .userId(userId.toString())
                .amount(amount != null ? amount : BigDecimal.ZERO)
                .transactionType(transactionType)
                .description(description != null ? description : "")
                .createdAt(Instant.now())
                .build();
        try {
            String message = objectMapper.writeValueAsString(event);
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.WALLET_EVENTS_EXCHANGE,
                    "wallet.updated." + transactionType.toLowerCase(),
                    message);
            log.info("Published wallet.updated event for userId={}, type={}", userId, transactionType);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize wallet.updated event for userId={}", userId, e);
        } catch (Exception e) {
            log.error("Failed to publish wallet.updated event for userId={}", userId, e);
        }
    }
}
