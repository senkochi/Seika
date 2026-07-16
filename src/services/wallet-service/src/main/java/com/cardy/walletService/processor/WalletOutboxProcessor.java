package com.cardy.walletService.processor;

import com.cardy.walletService.config.RabbitMQConfig;
import com.cardy.walletService.domain.WalletOutboxEvent;
import com.cardy.walletService.enums.WalletOutboxStatus;
import com.cardy.walletService.repository.WalletOutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class WalletOutboxProcessor {
    private static final int ERROR_LIMIT = 2000;

    private final WalletOutboxEventRepository walletOutboxEventRepository;
    private final RabbitTemplate rabbitTemplate;

    @Scheduled(fixedDelayString = "${wallet.outbox.processor.delay-ms:3000}")
    public void publishOutboxEvents() {
        List<WalletOutboxEvent> events = walletOutboxEventRepository.findTop50ByStatusInOrderByCreatedAtAsc(
                List.of(WalletOutboxStatus.PENDING, WalletOutboxStatus.FAILED));

        for (WalletOutboxEvent event : events) {
            try {
                rabbitTemplate.convertAndSend(
                        RabbitMQConfig.WALLET_EVENTS_EXCHANGE,
                        event.getEventType(),
                        event.getPayload());
                event.setStatus(WalletOutboxStatus.SENT);
                event.setPublishedAt(Instant.now());
                event.setLastError(null);
                walletOutboxEventRepository.save(event);
            } catch (Exception exception) {
                event.setStatus(WalletOutboxStatus.FAILED);
                event.setRetryCount(event.getRetryCount() + 1);
                event.setLastError(truncateError(exception.getMessage()));
                walletOutboxEventRepository.save(event);
                log.error("Failed to publish wallet outbox event id={}", event.getId(), exception);
            }
        }
    }

    private String truncateError(String message) {
        if (message == null) {
            return null;
        }
        return message.length() <= ERROR_LIMIT ? message : message.substring(0, ERROR_LIMIT);
    }
}