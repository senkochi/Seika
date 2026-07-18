package com.seika.notification_service.consumer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.notification_service.config.RabbitMQConfig;
import com.seika.notification_service.dto.CreateNotificationRequest;
import com.seika.notification_service.entity.NotificationChannel;
import com.seika.notification_service.entity.NotificationType;
import com.seika.notification_service.event.WalletUpdatedEvent;
import com.seika.notification_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class WalletEventListener {

    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @RabbitListener(queues = RabbitMQConfig.NOTIFICATION_WALLET_QUEUE)
    public void handleWalletUpdatedEvent(String rawMessage) {
        try {
            WalletUpdatedEvent event = objectMapper.readValue(rawMessage, WalletUpdatedEvent.class);
            log.info("Received WalletUpdatedEvent for user {}, type {}, amount {}", event.getUserId(), event.getTransactionType(), event.getAmount());

            if (event.getUserId() == null || event.getTransactionType() == null) {
                return;
            }

            String type = event.getTransactionType().toUpperCase();
            String title;
            String content;
            BigDecimal amount = event.getAmount() != null ? event.getAmount().abs() : BigDecimal.ZERO;
            String descStr = (event.getDescription() != null && !event.getDescription().isBlank())
                    ? (" (" + event.getDescription() + ")") : "";

            if ("TOP_UP".equals(type) || "DEPOSIT".equals(type)) {
                title = "Nạp Coin thành công 💰";
                content = String.format("Bạn đã nạp thành công %s Coin vào ví%s.", amount.toPlainString(), descStr);
            } else if ("CASH_OUT".equals(type)) {
                title = "Rút Coin thành công 💸";
                content = String.format("Giao dịch rút/quy đổi %s Coin của bạn đã được thực hiện thành công%s.", amount.toPlainString(), descStr);
            } else {
                log.debug("Skipping notification for wallet transaction type {}", type);
                return;
            }

            CreateNotificationRequest req = CreateNotificationRequest.builder()
                    .userId(event.getUserId())
                    .title(title)
                    .content(content)
                    .type(NotificationType.WALLET_UPDATED)
                    .channel(NotificationChannel.IN_APP)
                    .eventId("wallet_updated_" + (event.getEventId() != null ? event.getEventId() : UUID.randomUUID().toString()))
                    .build();

            try {
                notificationService.createNotification(req);
                log.info("Sent WALLET_UPDATED notification to user {}", event.getUserId());
            } catch (Exception e) {
                log.error("Failed to create WALLET_UPDATED notification for user {}", event.getUserId(), e);
            }
        } catch (JsonProcessingException exception) {
            log.error("Failed to deserialize wallet.updated message. payload={}", rawMessage, exception);
            throw new AmqpRejectAndDontRequeueException("Invalid wallet.updated payload", exception);
        } catch (Exception exception) {
            log.error("Failed to process wallet.updated message. payload={}", rawMessage, exception);
            throw exception;
        }
    }
}
