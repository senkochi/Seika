package com.seika.marketplace_service.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentPurchaseResponse {
    private String userId;
    private String productId;
    private String productType;
    private String productName;
    private BigDecimal unitPrice;
    private Instant purchasedAt;
}