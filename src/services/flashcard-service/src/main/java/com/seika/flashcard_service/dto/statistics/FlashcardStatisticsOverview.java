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
public class FlashcardStatisticsOverview {

    private long totalCardSets;

    /** Total purchases across all the teacher's CardSets. */
    private long totalPurchases;

    /** Distinct buyers. */
    private long totalStudents;

    /** Sum of {@code ProductSales.price} for CARD_SET entries. */
    private BigDecimal totalRevenue;
}