package com.cardy.walletService.event;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletDebitEvent {
    private String eventId;
    private String eventType;
    private String idempotencyKey;
    private String orderId;
    private String buyerUserId;
    private BigDecimal totalAmount;
    private SourceBreakdown sourceBreakdown;
    private List<String> ledgerEntryIds;
    private Instant occurredAt;
    private String reason;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SourceBreakdown {
        private BigDecimal bonusAmount;
        private BigDecimal rewardAmount;
        private BigDecimal earnedPromoAmount;
        private BigDecimal paidAmount;
        private BigDecimal promoBackedAmount;
    }
}
