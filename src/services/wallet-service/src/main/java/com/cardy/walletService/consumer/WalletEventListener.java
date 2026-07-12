package com.cardy.walletService.consumer;

import com.cardy.walletService.config.RabbitMQConfig;
import com.cardy.walletService.event.ContentPurchasedEvent;
import com.cardy.walletService.event.WalletCreditRequestedEvent;
import com.cardy.walletService.event.WalletDebitEvent;
import com.cardy.walletService.event.WalletDebitRequestedEvent;
import com.cardy.walletService.event.WalletEscrowResultEvent;
import com.cardy.walletService.event.WalletRefundRequestedEvent;
import com.cardy.walletService.service.WalletDebitResult;
import com.cardy.walletService.service.WalletService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class WalletEventListener {

    private static final String DEBIT_REQUESTED = "wallet.debit.requested";
    private static final String CREDIT_REQUESTED = "wallet.credit.requested";
    private static final String REFUND_REQUESTED = "wallet.refund.requested";

    private final ObjectMapper objectMapper;
    private final WalletService walletService;
    private final RabbitTemplate rabbitTemplate;

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

            String desc = (event.getDescription() != null && !event.getDescription().isBlank())
                    ? "Mua " + event.getDescription()
                    : "Thanh toan don hang " + event.getOrderId();
            String idempotencyKey = (event.getIdempotencyKey() != null && !event.getIdempotencyKey().isBlank())
                    ? event.getIdempotencyKey()
                    : "order:" + event.getOrderId() + ":debit";

            WalletDebitResult result = walletService.debitPurchase(
                    UUID.fromString(event.getUserId()),
                    event.getAmount(),
                    desc,
                    event.getOrderId(),
                    idempotencyKey);
            log.info("Debit successful for orderId={}", event.getOrderId());

            publishWalletDebitEvent(event, "wallet.debit.succeeded", result, null);
        } catch (Exception exception) {
            log.error("Failed to process wallet debit for event={}. Reason: {}", event, exception.getMessage());
            if (event != null && event.getOrderId() != null) {
                publishWalletDebitEvent(event, "wallet.debit.failed", new WalletDebitResult(java.util.Map.of()), exception.getMessage());
            }
        }
    }

    private void handleWalletCreditRequested(WalletCreditRequestedEvent event) {
        try {
            walletService.creditEscrowRelease(
                    UUID.fromString(event.getSellerUserId()),
                    event.getBuyerUserId() == null ? null : UUID.fromString(event.getBuyerUserId()),
                    event.getTeacherWithdrawableAmount(),
                    event.getTeacherPromoAmount(),
                    event.getPlatformFeeReal(),
                    event.getPlatformFeePromoSink(),
                    event.getOrderId(),
                    event.getOrderItemId(),
                    event.getEscrowId(),
                    event.getIdempotencyKey());
            publishEscrowResult(event, "wallet.credit.succeeded", null);
        } catch (Exception exception) {
            log.error("Failed to process wallet credit for escrowId={}. Reason: {}", event.getEscrowId(), exception.getMessage());
            publishEscrowResult(event, "wallet.credit.failed", exception.getMessage());
        }
    }

    private void handleWalletRefundRequested(WalletRefundRequestedEvent event) {
        try {
            walletService.refundEscrowPurchase(
                    UUID.fromString(event.getBuyerUserId()),
                    event.getBonusAmount(),
                    event.getRewardAmount(),
                    event.getPaidAmount(),
                    event.getEarnedPromoAmount(),
                    event.getOrderId(),
                    event.getOrderItemId(),
                    event.getEscrowId(),
                    event.getIdempotencyKey());
            publishRefundResult(event, "wallet.refund.succeeded", null);
        } catch (Exception exception) {
            log.error("Failed to process wallet refund for escrowId={}. Reason: {}", event.getEscrowId(), exception.getMessage());
            publishRefundResult(event, "wallet.refund.failed", exception.getMessage());
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

    private void publishWalletDebitEvent(WalletDebitRequestedEvent requestEvent,
                                         String eventType,
                                         WalletDebitResult result,
                                         String reason) {
        WalletDebitEvent outEvent = WalletDebitEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType(eventType)
                .idempotencyKey((requestEvent.getIdempotencyKey() != null && !requestEvent.getIdempotencyKey().isBlank())
                        ? requestEvent.getIdempotencyKey()
                        : "order:" + requestEvent.getOrderId() + ":debit")
                .orderId(requestEvent.getOrderId())
                .buyerUserId(requestEvent.getUserId())
                .totalAmount(requestEvent.getAmount())
                .sourceBreakdown(WalletDebitEvent.SourceBreakdown.builder()
                        .bonusAmount(result.bonusAmount())
                        .rewardAmount(result.rewardAmount())
                        .earnedPromoAmount(result.earnedPromoAmount())
                        .paidAmount(result.paidAmount())
                        .promoBackedAmount(result.promoBackedAmount())
                        .build())
                .ledgerEntryIds(result.ledgerEntryIds())
                .occurredAt(Instant.now())
                .reason(reason)
                .build();
        publishWalletEvent(eventType, requestEvent.getOrderId(), outEvent);
    }

    private void publishEscrowResult(WalletCreditRequestedEvent requestEvent, String eventType, String reason) {
        WalletEscrowResultEvent outEvent = WalletEscrowResultEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType(eventType)
                .idempotencyKey(requestEvent.getIdempotencyKey())
                .escrowId(requestEvent.getEscrowId())
                .orderId(requestEvent.getOrderId())
                .orderItemId(requestEvent.getOrderItemId())
                .buyerUserId(requestEvent.getBuyerUserId())
                .sellerUserId(requestEvent.getSellerUserId())
                .teacherWithdrawableAmount(requestEvent.getTeacherWithdrawableAmount())
                .teacherPromoAmount(requestEvent.getTeacherPromoAmount())
                .platformFeeReal(requestEvent.getPlatformFeeReal())
                .platformFeePromoSink(requestEvent.getPlatformFeePromoSink())
                .occurredAt(Instant.now())
                .reason(reason)
                .build();
        publishWalletEvent(eventType, requestEvent.getOrderId(), outEvent);
    }

    private void publishRefundResult(WalletRefundRequestedEvent requestEvent, String eventType, String reason) {
        WalletEscrowResultEvent outEvent = WalletEscrowResultEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType(eventType)
                .idempotencyKey(requestEvent.getIdempotencyKey())
                .escrowId(requestEvent.getEscrowId())
                .orderId(requestEvent.getOrderId())
                .orderItemId(requestEvent.getOrderItemId())
                .buyerUserId(requestEvent.getBuyerUserId())
                .bonusAmount(requestEvent.getBonusAmount())
                .rewardAmount(requestEvent.getRewardAmount())
                .paidAmount(requestEvent.getPaidAmount())
                .earnedPromoAmount(requestEvent.getEarnedPromoAmount())
                .occurredAt(Instant.now())
                .reason(reason)
                .build();
        publishWalletEvent(eventType, requestEvent.getOrderId(), outEvent);
    }

    private void publishWalletEvent(String eventType, String orderId, Object outEvent) {
        try {
            String message = objectMapper.writeValueAsString(outEvent);
            rabbitTemplate.convertAndSend(RabbitMQConfig.WALLET_EVENTS_EXCHANGE, eventType, message);
            log.info("Published event: {} for orderId={}", eventType, orderId);
        } catch (JsonProcessingException e) {
            log.error("Failed to publish event: {} for orderId={}", eventType, orderId, e);
        }
    }
}
