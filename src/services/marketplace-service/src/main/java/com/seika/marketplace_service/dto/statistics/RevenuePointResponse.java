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
public class RevenuePointResponse {
    /** Period label e.g. "2026-07" (monthly) or "2026-07-01" (daily). */
    private String period;
    private BigDecimal totalRevenue;
    private long orderCount;
}