package com.seika.quiz_service.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Lightweight projection of {@code QuizAttempt} returned by
 * {@code GET /api/quiz-sets/{id}/attempts}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizAttemptResponse {

    private String id;
    private String userId;
    private String quizSetId;
    private String quizId;
    private double score;
    private boolean passed;
    private Instant attemptAt;
}