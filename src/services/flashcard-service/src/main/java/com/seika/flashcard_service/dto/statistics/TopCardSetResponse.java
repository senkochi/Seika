package com.seika.flashcard_service.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopCardSetResponse {

    private String cardSetId;
    private String title;
    private long totalSold;
    private BigDecimal totalRevenue;
}