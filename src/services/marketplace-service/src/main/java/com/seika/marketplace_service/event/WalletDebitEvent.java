package com.seika.marketplace_service.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonIgnoreProperties(ignoreUnknown = true)
public class WalletDebitEvent {
    String eventId;
    String eventType;
    String idempotencyKey;
    String orderId;
    String buyerUserId;
    BigDecimal totalAmount;
    SourceBreakdown sourceBreakdown;
    List<String> ledgerEntryIds;
    Instant occurredAt;
    String reason;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SourceBreakdown {
        BigDecimal bonusAmount;
        BigDecimal rewardAmount;
        BigDecimal earnedPromoAmount;
        BigDecimal paidAmount;
        BigDecimal promoBackedAmount;
    }
}
