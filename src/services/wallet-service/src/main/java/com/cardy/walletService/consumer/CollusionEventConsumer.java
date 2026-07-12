package com.cardy.walletService.consumer;

import com.cardy.walletService.config.RabbitMQConfig;
import com.cardy.walletService.event.CollusionFlaggedEvent;
import com.cardy.walletService.service.WalletHoldService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class CollusionEventConsumer {

    private final WalletHoldService walletHoldService;

    @RabbitListener(queues = RabbitMQConfig.COLLUSION_FLAGS_QUEUE)
    public void handleCollusionFlaggedEvent(org.springframework.amqp.core.Message message) {
        try {
            String body = new String(message.getBody());
            log.info("Received raw CollusionFlaggedEvent message: {}", body);

            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            mapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

            CollusionFlaggedEvent event = mapper.readValue(body, CollusionFlaggedEvent.class);
            log.info("Parsed CollusionFlaggedEvent flagId={}, status={}", event.getFlagId(), event.getStatus());

            if ("CONFIRMED".equalsIgnoreCase(event.getStatus()) || "MALICIOUS".equalsIgnoreCase(event.getStatus())) {
                UUID teacherId = UUID.fromString(event.getTeacherId());
                LocalDateTime expiresAt = LocalDateTime.now().plusDays(30);
                walletHoldService.placeHold(teacherId, "WASH_HOLD",
                        "Collusion flag " + event.getStatus() + ": " + event.getReason(),
                        event.getFlagId(), "SYSTEM_COLLUSION", expiresAt);
                log.info("WASH_HOLD placed on wallet for teacherId {} flagId {}", teacherId, event.getFlagId());
            }
        } catch (Exception e) {
            log.error("Error processing CollusionFlaggedEvent", e);
        }
    }
}
