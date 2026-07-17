package com.cardy.walletService.processor;

import com.cardy.walletService.config.RabbitMQConfig;
import com.cardy.walletService.domain.WalletOutboxEvent;
import com.cardy.walletService.enums.WalletOutboxStatus;
import com.cardy.walletService.repository.WalletOutboxEventRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Component
@Slf4j
public class WalletOutboxProcessor {
    private static final int ERROR_LIMIT = 2000;
    /** Max shift we apply to backoff (2^6 = 64). Keeps growth bounded. */
    private static final int MAX_BACKOFF_SHIFT = 6;

    private final WalletOutboxEventRepository walletOutboxEventRepository;
    private final RabbitTemplate rabbitTemplate;
    private final int maxAttempts;
    private final long backoffSeconds;
    private final int batchSize;

    public WalletOutboxProcessor(
            WalletOutboxEventRepository walletOutboxEventRepository,
            RabbitTemplate rabbitTemplate,
            @Value("${wallet.outbox.processor.max-attempts:8}") int maxAttempts,
            @Value("${wallet.outbox.processor.backoff-seconds:30}") long backoffSeconds,
            @Value("${wallet.outbox.processor.batch-size:50}") int batchSize) {
        this.walletOutboxEventRepository = walletOutboxEventRepository;
        this.rabbitTemplate = rabbitTemplate;
        this.maxAttempts = maxAttempts;
        this.backoffSeconds = backoffSeconds;
        this.batchSize = batchSize;
    }

    @Scheduled(fixedDelayString = "${wallet.outbox.processor.delay-ms:3000}")
    public void scheduledTick() {
        try {
            publishOutboxEvents(Instant.now());
        } catch (Exception exception) {
            // never let a tick-level failure kill the scheduler
            log.error("Wallet outbox tick failed", exception);
        }
    }

    /**
     * Claim a batch of PENDING rows, mark them CLAIMED, publish to RabbitMQ,
     * and update them to SENT (success), PENDING-with-backoff (transient failure),
     * or DEAD + DLX (max attempts exceeded).
     *
     * The whole tick runs in a single transaction so the FOR UPDATE SKIP LOCKED
     * row locks are held until the row state is finalised.
     */
    @Transactional
    public void publishOutboxEvents(Instant now) {
        List<WalletOutboxEvent> claimed = walletOutboxEventRepository
                .claimNextPendingBatch(batchSize, now);
        if (claimed.isEmpty()) {
            return;
        }

        Duration backoff = Duration.ofSeconds(backoffSeconds);

        for (WalletOutboxEvent event : claimed) {
            event.setStatus(WalletOutboxStatus.CLAIMED);
            event.setClaimedAt(now);

            try {
                rabbitTemplate.convertAndSend(
                        RabbitMQConfig.WALLET_EVENTS_EXCHANGE,
                        event.getEventType(),
                        event.getPayload());

                event.setStatus(WalletOutboxStatus.SENT);
                event.setPublishedAt(now);
                event.setLastError(null);
            } catch (Exception exception) {
                int next = event.getAttemptCount() + 1;
                event.setAttemptCount(next);
                event.setLastError(truncateError(exception.getMessage()));
                if (next >= maxAttempts) {
                    event.setStatus(WalletOutboxStatus.DEAD);
                    try {
                        rabbitTemplate.convertAndSend(
                                RabbitMQConfig.WALLET_EVENTS_DLX,
                                event.getEventType(),
                                event.getPayload());
                    } catch (Exception dlxException) {
                        // if even the DLX publish fails, keep row DEAD; log loudly
                        log.error("Outbox event id={} exhausted retries ({}); DLX publish also failed",
                                event.getId(), next, dlxException);
                    }
                    log.error("Outbox event id={} exhausted retries ({}); routed to DLQ",
                            event.getId(), next, exception);
                } else {
                    event.setStatus(WalletOutboxStatus.PENDING);
                    int shift = Math.min(next, MAX_BACKOFF_SHIFT);
                    event.setNextAttemptAt(now.plus(backoff.multipliedBy(1L << shift)));
                    log.warn("Outbox event id={} failed attempt={}, retry at {}",
                            event.getId(), next, event.getNextAttemptAt(), exception);
                }
            }

            walletOutboxEventRepository.save(event);
        }
    }

    private String truncateError(String message) {
        if (message == null) {
            return null;
        }
        return message.length() <= ERROR_LIMIT ? message : message.substring(0, ERROR_LIMIT);
    }
}
