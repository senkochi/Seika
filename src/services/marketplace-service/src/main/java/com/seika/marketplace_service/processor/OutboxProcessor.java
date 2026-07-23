package com.seika.marketplace_service.processor;

import com.seika.marketplace_service.config.RabbitMQConfig;
import com.seika.marketplace_service.entity.OutboxEvent;
import com.seika.marketplace_service.enums.OutboxStatus;
import com.seika.marketplace_service.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxProcessor {
    private static final int ERROR_LIMIT = 2000;
    private static final int BATCH_SIZE = 50;
    private static final int MAX_ATTEMPTS = 8;
    private static final int MAX_BACKOFF_SHIFT = 6;
    private static final Duration BASE_BACKOFF = Duration.ofSeconds(30);

    private final OutboxEventRepository outboxEventRepository;
    private final RabbitTemplate rabbitTemplate;

    @Scheduled(fixedDelayString = "${outbox.processor.delay-ms:3000}")
    @Transactional
    public void publishOutboxEvents() {
        Instant now = Instant.now();
        List<OutboxEvent> events = outboxEventRepository.claimNextPendingBatch(BATCH_SIZE, now);
        for (OutboxEvent event : events) {
            event.setStatus(OutboxStatus.CLAIMED);
            event.setClaimedAt(now);
            try {
                rabbitTemplate.convertAndSend(
                        resolveExchange(event.getEventType()),
                        event.getEventType(),
                        event.getPayload());

                event.setStatus(OutboxStatus.SENT);
                event.setPublishedAt(now);
                event.setNextAttemptAt(null);
                event.setLastError(null);
            } catch (Exception exception) {
                int nextAttempt = event.getRetryCount() + 1;
                event.setRetryCount(nextAttempt);
                event.setLastError(truncateError(exception.getMessage()));
                if (nextAttempt >= MAX_ATTEMPTS) {
                    event.setStatus(OutboxStatus.DEAD);
                    event.setNextAttemptAt(null);
                    log.error("Marketplace outbox event id={} exhausted {} attempts",
                            event.getId(), nextAttempt, exception);
                } else {
                    event.setStatus(OutboxStatus.FAILED);
                    int shift = Math.min(nextAttempt, MAX_BACKOFF_SHIFT);
                    event.setNextAttemptAt(now.plus(BASE_BACKOFF.multipliedBy(1L << shift)));
                    log.warn("Marketplace outbox event id={} failed attempt={}, retryAt={}",
                            event.getId(), nextAttempt, event.getNextAttemptAt(), exception);
                }
            }
            outboxEventRepository.save(event);
        }
    }

    private String resolveExchange(String eventType) {
        if (eventType != null && eventType.startsWith("wallet.")) {
            return RabbitMQConfig.WALLET_COMMANDS_EXCHANGE;
        }
        return RabbitMQConfig.MARKETPLACE_EVENTS_EXCHANGE;
    }

    private String truncateError(String message) {
        if (message == null) {
            return null;
        }
        return message.length() <= ERROR_LIMIT ? message : message.substring(0, ERROR_LIMIT);
    }
}
