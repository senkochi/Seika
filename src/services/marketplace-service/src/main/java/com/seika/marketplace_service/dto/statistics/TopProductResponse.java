package com.seika.marketplace_service.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopProductResponse {
    private String productId;
    private String productType;
    private String productName;
    private BigDecimal unitPrice;
    private long totalSold;
    private BigDecimal totalRevenue;
}