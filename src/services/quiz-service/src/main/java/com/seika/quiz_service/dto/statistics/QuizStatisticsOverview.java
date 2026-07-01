package com.seika.quiz_service.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Aggregate statistics for the currently authenticated teacher, covering all
 * quiz sets they have authored.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizStatisticsOverview {

    /** Total QuizSet documents where {@code createdBy == teacherId}. */
    private long totalQuizSets;

    /** Total QuizAttempt documents referencing those QuizSets. */
    private long totalAttempts;

    /** Number of attempts with {@code passed = true}. */
    private long totalPassed;

    /** {@code totalPassed / totalAttempts} as percentage (0-100), 0 when no attempts. */
    private double passRate;

    /** Sum of {@code ProductSales.price} where productType = QUIZ_SET. */
    private BigDecimal totalRevenue;

    /** Distinct buyers who purchased any of the teacher's QuizSets. */
    private long totalStudents;
}