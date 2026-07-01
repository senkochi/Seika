package com.seika.flashcard_service.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentActivityResponse {

    private String userId;
    private String cardSetId;
    private BigDecimal purchasePrice;
    private LocalDateTime purchasedAt;

    /** Latest study progress percentage, or null if the user never studied. */
    private Double lastProgress;

    private boolean completed;

    /** Timestamp of the latest study session (null when never studied). */
    private Instant lastStudiedAt;
}