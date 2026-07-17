package com.cardy.walletService.service;

import com.cardy.walletService.domain.WalletOutboxEvent;
import com.cardy.walletService.enums.WalletOutboxStatus;
import com.cardy.walletService.event.WalletCreditRequestedEvent;
import com.cardy.walletService.event.WalletDebitEvent;
import com.cardy.walletService.event.WalletDebitRequestedEvent;
import com.cardy.walletService.event.WalletEscrowResultEvent;
import com.cardy.walletService.event.WalletRefundRequestedEvent;
import com.cardy.walletService.repository.WalletOutboxEventRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WalletCommandOutboxService {

    private final WalletService walletService;
    private final WalletOutboxEventRepository walletOutboxEventRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public void processDebitRequested(WalletDebitRequestedEvent event) {
        String desc = (event.getDescription() != null && !event.getDescription().isBlank())
                ? "Mua " + event.getDescription()
                : "Thanh toan don hang " + event.getOrderId();
        String idempotencyKey = debitIdempotencyKey(event);
        WalletDebitResult result = walletService.debitPurchase(
                UUID.fromString(event.getUserId()),
                event.getAmount(),
                desc,
                event.getOrderId(),
                idempotencyKey);
        enqueueDebitResult(event, "wallet.debit.succeeded", result, null);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void enqueueDebitFailed(WalletDebitRequestedEvent event, String reason) {
        enqueueDebitResult(event, "wallet.debit.failed", new WalletDebitResult(Map.of()), reason);
    }

    @Transactional
    public void processCreditRequested(WalletCreditRequestedEvent event) {
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
        enqueueCreditResult(event, "wallet.credit.succeeded", null);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void enqueueCreditFailed(WalletCreditRequestedEvent event, String reason) {
        enqueueCreditResult(event, "wallet.credit.failed", reason);
    }

    @Transactional
    public void processRefundRequested(WalletRefundRequestedEvent event) {
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
        enqueueRefundResult(event, "wallet.refund.succeeded", null);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void enqueueRefundFailed(WalletRefundRequestedEvent event, String reason) {
        enqueueRefundResult(event, "wallet.refund.failed", reason);
    }

    private void enqueueDebitResult(WalletDebitRequestedEvent requestEvent,
                                    String eventType,
                                    WalletDebitResult result,
                                    String reason) {
        WalletDebitEvent outEvent = WalletDebitEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType(eventType)
                .idempotencyKey(debitIdempotencyKey(requestEvent))
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
        enqueueOutboxResult("Order", requestEvent.getOrderId(), eventType, outEvent);
    }

    private void enqueueCreditResult(WalletCreditRequestedEvent requestEvent, String eventType, String reason) {
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
        enqueueOutboxResult("EscrowTransaction", requestEvent.getEscrowId(), eventType, outEvent);
    }

    private void enqueueRefundResult(WalletRefundRequestedEvent requestEvent, String eventType, String reason) {
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
        enqueueOutboxResult("EscrowTransaction", requestEvent.getEscrowId(), eventType, outEvent);
    }

    /**
     * Shared helper that serialises {@code payload} and persists a {@link WalletOutboxEvent}
     * row with the supplied aggregate identity and event type. Note that
     * {@link WalletOutboxEvent} has no reason column — callers embed the reason inside
     * their typed payload (e.g. {@link WalletDebitEvent#getReason()} /
     * {@link WalletEscrowResultEvent#getReason()}).
     */
    private void enqueueOutboxResult(String aggregateType, String aggregateId, String eventType, Object payload) {
        try {
            walletOutboxEventRepository.save(WalletOutboxEvent.builder()
                    .aggregateType(aggregateType)
                    .aggregateId(aggregateId == null ? "UNKNOWN" : aggregateId)
                    .eventType(eventType)
                    .payload(objectMapper.writeValueAsString(payload))
                    .status(WalletOutboxStatus.PENDING)
                    .build());
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize wallet outbox payload", exception);
        }
    }

    private String debitIdempotencyKey(WalletDebitRequestedEvent event) {
        return (event.getIdempotencyKey() != null && !event.getIdempotencyKey().isBlank())
                ? event.getIdempotencyKey()
                : "order:" + event.getOrderId() + ":debit";
    }
}