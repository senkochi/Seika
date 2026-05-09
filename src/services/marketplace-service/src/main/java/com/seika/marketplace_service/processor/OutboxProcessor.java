package com.seika.marketplace_service.processor;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

import com.seika.marketplace_service.config.RabbitMQConfig;
import com.seika.marketplace_service.entity.OutboxEvent;
import com.seika.marketplace_service.enums.OutboxStatus;
import com.seika.marketplace_service.repository.OutboxEventRepository;

@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxProcessor {
    private static final int ERROR_LIMIT = 2000;

    private final OutboxEventRepository outboxEventRepository;
    private final RabbitTemplate rabbitTemplate;

    @Scheduled(fixedDelayString = "${outbox.processor.delay-ms:3000}")
    public void publishOutboxEvents() {
        // Fetch tối đa 50 outbox event có status PENDING hoặc FAILED, sắp xếp theo createdAt để đảm bảo thứ tự publish
        List<OutboxEvent> events = outboxEventRepository.findTop50ByStatusInOrderByCreatedAtAsc(
            List.of(OutboxStatus.PENDING, OutboxStatus.FAILED)
        );

        // Duyệt qua từng event và publish ra message broker, sau đó cập nhật lại status và thông tin lỗi nếu có
        for (OutboxEvent event : events) {
            try {
                rabbitTemplate.convertAndSend(
                    RabbitMQConfig.WALLET_COMMANDS_EXCHANGE,
                    event.getEventType(),
                    event.getPayload()
                );

                event.setStatus(OutboxStatus.SENT);
                event.setPublishedAt(Instant.now());
                event.setLastError(null);
                outboxEventRepository.save(event);
            } catch (Exception exception) {
                event.setStatus(OutboxStatus.FAILED);
                event.setRetryCount(event.getRetryCount() + 1);
                event.setLastError(truncateError(exception.getMessage()));
                outboxEventRepository.save(event);
                log.error("Failed to publish outbox event id={}", event.getId(), exception);
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
