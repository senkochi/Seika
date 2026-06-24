package com.cardy.walletService.consumer;

import com.cardy.walletService.config.RabbitMQConfig;
import com.cardy.walletService.dto.TransactionReqDTO;
import com.cardy.walletService.event.ContentPurchasedEvent;
import com.cardy.walletService.event.WalletDebitEvent;
import com.cardy.walletService.event.WalletDebitRequestedEvent;
import com.cardy.walletService.service.WalletService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class WalletEventListener {

    private final ObjectMapper objectMapper;
    private final WalletService walletService;
    private final RabbitTemplate rabbitTemplate;

    @RabbitListener(queues = RabbitMQConfig.WALLET_COMMANDS_QUEUE)
    public void handleWalletDebitRequested(String rawMessage) {
        WalletDebitRequestedEvent event = null;
        try {
            event = objectMapper.readValue(rawMessage, WalletDebitRequestedEvent.class);
            log.info("Received wallet.debit.requested for orderId={}, userId={}, amount={}", event.getOrderId(), event.getUserId(), event.getAmount());
            
            TransactionReqDTO req = new TransactionReqDTO();
            req.setAmount(event.getAmount());
            req.setDescription("Thanh toán đơn hàng " + event.getOrderId());
            
            walletService.spend(UUID.fromString(event.getUserId()), req);
            log.info("Debit successful for orderId={}", event.getOrderId());
            
            publishWalletEvent(event.getOrderId(), "wallet.debit.succeeded");
            
        } catch (JsonProcessingException exception) {
            log.error("Failed to deserialize wallet debit requested event.", exception);
        } catch (Exception exception) {
            log.error("Failed to process wallet debit for event={}. Reason: {}", event, exception.getMessage());
            if (event != null && event.getOrderId() != null) {
                publishWalletEvent(event.getOrderId(), "wallet.debit.failed");
            }
        }
    }

    @RabbitListener(queues = RabbitMQConfig.MARKETPLACE_EVENTS_QUEUE)
    public void handleContentPurchased(String rawMessage) {
        try {
            ContentPurchasedEvent event = objectMapper.readValue(rawMessage, ContentPurchasedEvent.class);
            log.info("Received content.purchased for orderId={}, teacherUserId={}", event.getOrderId(), event.getTeacherUserId());
            
            if (event.getPrice() != null && event.getPrice().compareTo(java.math.BigDecimal.ZERO) > 0) {
                TransactionReqDTO req = new TransactionReqDTO();
                req.setAmount(event.getPrice());
                req.setDescription("Bán sản phẩm " + event.getProductType() + " " + event.getProductId());
                
                walletService.reward(UUID.fromString(event.getTeacherUserId()), req);
                log.info("Deposit successful for teacherUserId={}", event.getTeacherUserId());
            }
        } catch (JsonProcessingException exception) {
            log.error("Failed to deserialize content purchased event.", exception);
        } catch (Exception exception) {
            log.error("Failed to process content purchased event. payload={}", rawMessage, exception);
            throw exception; // Requeue if necessary based on your RabbitMQ DLQ config
        }
    }

    private void publishWalletEvent(String orderId, String eventType) {
        WalletDebitEvent outEvent = WalletDebitEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType(eventType)
                .orderId(orderId)
                .build();
        try {
            String message = objectMapper.writeValueAsString(outEvent);
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.WALLET_EVENTS_EXCHANGE,
                    eventType,
                    message);
            log.info("Published event: {} for orderId={}", eventType, orderId);
        } catch (JsonProcessingException e) {
            log.error("Failed to publish event: {} for orderId={}", eventType, orderId, e);
        }
    }
}
