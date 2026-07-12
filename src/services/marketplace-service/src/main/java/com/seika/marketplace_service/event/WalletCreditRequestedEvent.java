package com.seika.marketplace_service.event;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletCreditRequestedEvent {
    private String eventId;
    private String eventType;
    private String idempotencyKey;
    private String escrowId;
    private String orderId;
    private String orderItemId;
    private String sellerUserId;
    private String buyerUserId;
    private BigDecimal teacherWithdrawableAmount;
    private BigDecimal teacherPromoAmount;
    private BigDecimal platformFeeReal;
    private BigDecimal platformFeePromoSink;
    private Instant occurredAt;
}
