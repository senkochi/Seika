package com.cardy.walletService.event;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletRefundRequestedEvent {
    private String eventId;
    private String eventType;
    private String idempotencyKey;
    private String escrowId;
    private String orderId;
    private String orderItemId;
    private String buyerUserId;
    private BigDecimal bonusAmount;
    private BigDecimal rewardAmount;
    private BigDecimal paidAmount;
    private BigDecimal earnedPromoAmount;
}
