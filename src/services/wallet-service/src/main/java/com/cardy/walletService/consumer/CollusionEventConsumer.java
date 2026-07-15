package com.cardy.walletService.consumer;

import com.cardy.walletService.config.RabbitMQConfig;
import com.cardy.walletService.event.CollusionFlaggedEvent;
import com.cardy.walletService.service.WalletHoldService;
import com.cardy.walletService.service.WalletService;
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

    private static final int DEFAULT_WASH_HOLD_DAYS = 30;

    private final WalletHoldService walletHoldService;
    private final WalletService walletService;

    @RabbitListener(queues = RabbitMQConfig.COLLUSION_FLAGS_QUEUE)
    public void handleCollusionFlaggedEvent(org.springframework.amqp.core.Message message) {
        try {
            String body = new String(message.getBody());
            log.info("Received raw CollusionFlaggedEvent message: {}", body);

            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            mapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

            CollusionFlaggedEvent event = mapper.readValue(body, CollusionFlaggedEvent.class);
            log.info("Parsed CollusionFlaggedEvent flagId={}, status={}", event.getFlagId(), event.getStatus());

            if ("CONFIRMED".equalsIgnoreCase(event.getStatus())) {
                UUID teacherId = UUID.fromString(event.getTeacherId());
                LocalDateTime expiresAt = LocalDateTime.now().plusDays(resolveHoldDays(event));
                walletHoldService.placeHold(teacherId, "WASH_HOLD",
                        "Collusion flag " + event.getStatus() + ": " + event.getReason(),
                        event.getFlagId(), "SYSTEM_COLLUSION", expiresAt);
                log.info("WASH_HOLD placed on wallet for teacherId {} flagId {}", teacherId, event.getFlagId());
            } else if ("MALICIOUS".equalsIgnoreCase(event.getStatus())) {
                UUID teacherId = UUID.fromString(event.getTeacherId());
                UUID buyerId = UUID.fromString(event.getBuyerId());
                String reason = "Collusion flag " + event.getStatus() + ": " + event.getReason();
                walletService.applyFreeze(teacherId, reason, event.getFlagId(), "SYSTEM_COLLUSION");
                walletService.applyFreeze(buyerId, reason, event.getFlagId(), "SYSTEM_COLLUSION");
                log.info("Wallets frozen for malicious collusion flagId {} teacherId {} buyerId {}",
                        event.getFlagId(), teacherId, buyerId);
            }
        } catch (Exception e) {
            log.error("Error processing CollusionFlaggedEvent", e);
        }
    }

    private int resolveHoldDays(CollusionFlaggedEvent event) {
        Integer holdDays = event.getHoldDays();
        return holdDays == null || holdDays <= 0 ? DEFAULT_WASH_HOLD_DAYS : holdDays;
    }
}
