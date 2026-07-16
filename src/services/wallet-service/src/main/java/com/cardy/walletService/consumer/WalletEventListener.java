package com.cardy.walletService.consumer;

import com.cardy.walletService.config.RabbitMQConfig;
import com.cardy.walletService.event.ContentPurchasedEvent;
import com.cardy.walletService.event.WalletCreditRequestedEvent;
import com.cardy.walletService.event.WalletDebitRequestedEvent;
import com.cardy.walletService.event.WalletRefundRequestedEvent;
import com.cardy.walletService.service.WalletCommandOutboxService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class WalletEventListener {

    private static final String DEBIT_REQUESTED = "wallet.debit.requested";
    private static final String CREDIT_REQUESTED = "wallet.credit.requested";
    private static final String REFUND_REQUESTED = "wallet.refund.requested";

    private final ObjectMapper objectMapper;
    private final WalletCommandOutboxService walletCommandOutboxService;

    @RabbitListener(queues = RabbitMQConfig.WALLET_COMMANDS_QUEUE)
    public void handleWalletCommand(String rawMessage) {
        try {
            JsonNode root = objectMapper.readTree(rawMessage);
            String eventType = root.path("eventType").asText(DEBIT_REQUESTED);
            switch (eventType) {
                case DEBIT_REQUESTED -> handleWalletDebitRequested(objectMapper.treeToValue(root, WalletDebitRequestedEvent.class));
                case CREDIT_REQUESTED -> handleWalletCreditRequested(objectMapper.treeToValue(root, WalletCreditRequestedEvent.class));
                case REFUND_REQUESTED -> handleWalletRefundRequested(objectMapper.treeToValue(root, WalletRefundRequestedEvent.class));
                default -> log.warn("Ignoring unsupported wallet command eventType={}", eventType);
            }
        } catch (JsonProcessingException exception) {
            log.error("Failed to deserialize wallet command. payload={}", rawMessage, exception);
        }
    }

    private void handleWalletDebitRequested(WalletDebitRequestedEvent event) {
        try {
            log.info("Received wallet.debit.requested for orderId={}, userId={}, amount={}", event.getOrderId(), event.getUserId(), event.getAmount());
            walletCommandOutboxService.processDebitRequested(event);
            log.info("Debit successful for orderId={}; result event queued in wallet outbox", event.getOrderId());
        } catch (Exception exception) {
            log.error("Failed to process wallet debit for event={}. Reason: {}", event, exception.getMessage());
            if (event != null && event.getOrderId() != null) {
                walletCommandOutboxService.enqueueDebitFailed(event, exception.getMessage());
            }
        }
    }

    private void handleWalletCreditRequested(WalletCreditRequestedEvent event) {
        try {
            walletCommandOutboxService.processCreditRequested(event);
            log.info("Credit successful for escrowId={}; result event queued in wallet outbox", event.getEscrowId());
        } catch (Exception exception) {
            log.error("Failed to process wallet credit for escrowId={}. Reason: {}", event.getEscrowId(), exception.getMessage());
            walletCommandOutboxService.enqueueCreditFailed(event, exception.getMessage());
        }
    }

    private void handleWalletRefundRequested(WalletRefundRequestedEvent event) {
        try {
            walletCommandOutboxService.processRefundRequested(event);
            log.info("Refund successful for escrowId={}; result event queued in wallet outbox", event.getEscrowId());
        } catch (Exception exception) {
            log.error("Failed to process wallet refund for escrowId={}. Reason: {}", event.getEscrowId(), exception.getMessage());
            walletCommandOutboxService.enqueueRefundFailed(event, exception.getMessage());
        }
    }

    @RabbitListener(queues = RabbitMQConfig.MARKETPLACE_EVENTS_QUEUE)
    public void handleContentPurchased(String rawMessage) {
        try {
            ContentPurchasedEvent event = objectMapper.readValue(rawMessage, ContentPurchasedEvent.class);
            log.info("Received content.purchased for orderId={}, teacherUserId={}; teacher payout is handled by escrow release", event.getOrderId(), event.getTeacherUserId());
        } catch (JsonProcessingException exception) {
            log.error("Failed to deserialize content purchased event.", exception);
        }
    }
}
