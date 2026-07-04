package com.seika.quiz_service.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Persists a single attempt by a student on a quiz or quiz set.
 * Created when {@code QuizService.submitQuiz} is called; consumed by the
 * teacher Statistics endpoints ({@code /api/quiz-sets/my/statistics}, etc.).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "quiz_attempts")
@CompoundIndex(name = "quizset_attempt_at_desc", def = "{'quizSetId': 1, 'attemptAt': -1}")
public class QuizAttempt {

    @Id
    private String id;

    /** Id of the student who attempted. */
    @Indexed
    private String userId;

    /**
     * Id of the QuizSet attempted. {@code quizId} stays null for set-level
     * submissions and is set for individual quiz submissions.
     */
    @Indexed
    private String quizSetId;

    private String quizId;

    /** Raw percentage score (0-100) submitted by the student. */
    private double score;

    /** Pass flag computed against {@code PASS_THRESHOLD = 80.0}. */
    private boolean passed;

    private Instant attemptAt;
}