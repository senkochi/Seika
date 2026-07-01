package com.seika.quiz_service.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Lightweight projection used by {@code GET /api/quiz-sets/my/top-selling}.
 * Aggregates purchase count and revenue for a single QuizSet.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopQuizSetResponse {

    private String quizSetId;
    private String title;
    private long totalSold;
    private BigDecimal totalRevenue;
}