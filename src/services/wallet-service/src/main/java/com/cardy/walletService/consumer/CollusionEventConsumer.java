package com.cardy.walletService.consumer;

import com.cardy.walletService.config.RabbitMQConfig;
import com.cardy.walletService.event.CollusionFlaggedEvent;
import com.cardy.walletService.service.WalletHoldService;
import com.cardy.walletService.service.WalletService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class CollusionEventConsumer {

    private static final int DEFAULT_WASH_HOLD_DAYS = 30;

    private final WalletHoldService walletHoldService;
    private final WalletService walletService;

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    /**
     * Listener entry point. Poison messages (unparseable JSON, missing required
     * identifiers, malformed UUIDs) are re-thrown as
     * {@link AmqpRejectAndDontRequeueException} so the broker routes them to the
     * wallet DLX configured on {@link RabbitMQConfig#collusionFlagsQueue()}.
     * Transient DB failures propagate to Spring AMQP and trigger a redelivery
     * (broker default), so the local transaction rolls back atomically.
     */
    @RabbitListener(queues = RabbitMQConfig.COLLUSION_FLAGS_QUEUE)
    @Transactional
    public void handleCollusionFlaggedEvent(Message message) {
        String body = new String(message.getBody());
        log.info("Received raw CollusionFlaggedEvent message: {}", body);

        CollusionFlaggedEvent event;
        try {
            event = MAPPER.readValue(body, CollusionFlaggedEvent.class);
        } catch (JsonProcessingException jpe) {
            log.error("Malformed CollusionFlaggedEvent payload, routing to DLX. payload={}", body, jpe);
            throw new AmqpRejectAndDontRequeueException("malformed payload", jpe);
        }
        log.info("Parsed CollusionFlaggedEvent flagId={}, status={}", event.getFlagId(), event.getStatus());

        String status = event.getStatus();
        if ("CONFIRMED".equalsIgnoreCase(status)) {
            handleConfirmed(event);
        } else if ("MALICIOUS".equalsIgnoreCase(status)) {
            handleMalicious(event);
        } else {
            log.warn("Ignoring CollusionFlaggedEvent with unknown status={} flagId={}", status, event.getFlagId());
        }
    }

    private void handleConfirmed(CollusionFlaggedEvent event) {
        String teacherIdRaw = event.getTeacherId();
        if (teacherIdRaw == null || teacherIdRaw.isBlank()) {
            log.error("CONFIRMED CollusionFlaggedEvent missing teacherId, routing to DLX. flagId={}", event.getFlagId());
            throw new AmqpRejectAndDontRequeueException(
                    "CONFIRMED CollusionFlaggedEvent missing teacherId flagId=" + event.getFlagId());
        }
        UUID teacherId;
        try {
            teacherId = UUID.fromString(teacherIdRaw);
        } catch (IllegalArgumentException iae) {
            log.error("CONFIRMED CollusionFlaggedEvent has non-UUID teacherId={}, routing to DLX. flagId={}",
                    teacherIdRaw, event.getFlagId(), iae);
            throw new AmqpRejectAndDontRequeueException(
                    "CONFIRMED CollusionFlaggedEvent has non-UUID teacherId flagId=" + event.getFlagId(), iae);
        }
        LocalDateTime expiresAt = LocalDateTime.now().plusDays(resolveHoldDays(event));
        walletHoldService.placeHold(teacherId, "WASH_HOLD",
                "Collusion flag " + event.getStatus() + ": " + event.getReason(),
                event.getFlagId(), "SYSTEM_COLLUSION", expiresAt);
        log.info("WASH_HOLD placed on wallet for teacherId {} flagId {}", teacherId, event.getFlagId());
    }

    private void handleMalicious(CollusionFlaggedEvent event) {
        String teacherIdRaw = event.getTeacherId();
        String buyerIdRaw = event.getBuyerId();
        if (teacherIdRaw == null || teacherIdRaw.isBlank()) {
            log.error("MALICIOUS CollusionFlaggedEvent missing teacherId, routing to DLX. flagId={}", event.getFlagId());
            throw new AmqpRejectAndDontRequeueException(
                    "MALICIOUS CollusionFlaggedEvent missing teacherId flagId=" + event.getFlagId());
        }
        if (buyerIdRaw == null || buyerIdRaw.isBlank()) {
            log.error("MALICIOUS CollusionFlaggedEvent missing buyerId, routing to DLX. flagId={}", event.getFlagId());
            throw new AmqpRejectAndDontRequeueException(
                    "MALICIOUS CollusionFlaggedEvent missing buyerId flagId=" + event.getFlagId());
        }
        UUID teacherId;
        UUID buyerId;
        try {
            teacherId = UUID.fromString(teacherIdRaw);
            buyerId = UUID.fromString(buyerIdRaw);
        } catch (IllegalArgumentException iae) {
            log.error("MALICIOUS CollusionFlaggedEvent has non-UUID id, routing to DLX. flagId={} teacherId={} buyerId={}",
                    event.getFlagId(), teacherIdRaw, buyerIdRaw, iae);
            throw new AmqpRejectAndDontRequeueException(
                    "MALICIOUS CollusionFlaggedEvent has non-UUID id flagId=" + event.getFlagId(), iae);
        }
        String reason = "Collusion flag " + event.getStatus() + ": " + event.getReason();
        walletService.applyFreeze(teacherId, reason, event.getFlagId(), "SYSTEM_COLLUSION");
        walletService.applyFreeze(buyerId, reason, event.getFlagId(), "SYSTEM_COLLUSION");
        log.info("Wallets frozen for malicious collusion flagId {} teacherId {} buyerId {}",
                event.getFlagId(), teacherId, buyerId);
    }

    private int resolveHoldDays(CollusionFlaggedEvent event) {
        Integer holdDays = event.getHoldDays();
        return holdDays == null || holdDays <= 0 ? DEFAULT_WASH_HOLD_DAYS : holdDays;
    }
}
