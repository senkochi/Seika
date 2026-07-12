package com.seika.marketplace_service.event;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletEscrowResultEvent {
    private String eventId;
    private String eventType;
    private String idempotencyKey;
    private String escrowId;
    private String orderId;
    private String orderItemId;
    private String buyerUserId;
    private String sellerUserId;
    private BigDecimal teacherWithdrawableAmount;
    private BigDecimal teacherPromoAmount;
    private BigDecimal platformFeeReal;
    private BigDecimal platformFeePromoSink;
    private BigDecimal bonusAmount;
    private BigDecimal rewardAmount;
    private BigDecimal paidAmount;
    private BigDecimal earnedPromoAmount;
    private Instant occurredAt;
    private String reason;
}
