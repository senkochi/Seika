package com.seika.quiz_service.constant.data;

import com.seika.quiz_service.domain.*;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Mock data for testing quiz service
 */
public class QuizMockData {

    // ==================== Multiple Choice Quiz ====================
    public static MultipleChoiceQuiz createMockMultipleChoiceQuiz() {
        MultipleChoiceQuiz quiz = new MultipleChoiceQuiz();
        quiz.setId("625f5d7b4c3f1a2b9c8d7e6f");
        quiz.setQuestionText("What is the capital of France?");
        quiz.setOptions(Arrays.asList("London", "Berlin", "Paris", "Madrid"));
        quiz.setCorrectOptionIndex(2);
        quiz.setCreatedBy("user123");
        quiz.setCreatedAt(LocalDateTime.now().minusDays(5));
        quiz.setUpdatedAt(LocalDateTime.now().minusDays(2));
        return quiz;
    }

    public static MultipleChoiceQuiz createMockMultipleChoiceQuiz2() {
        MultipleChoiceQuiz quiz = new MultipleChoiceQuiz();
        quiz.setId("625f5d7b4c3f1a2b9c8d7e70");
        quiz.setQuestionText("Which planet is the largest in our solar system?");
        quiz.setOptions(Arrays.asList("Saturn", "Jupiter", "Mars", "Venus"));
        quiz.setCorrectOptionIndex(1);
        quiz.setCreatedBy("user456");
        quiz.setCreatedAt(LocalDateTime.now().minusDays(10));
        quiz.setUpdatedAt(LocalDateTime.now().minusDays(3));
        return quiz;
    }

    // ==================== Fill in Blank Quiz ====================
    public static FillInBlankQuiz createMockFillInBlankQuiz() {
        FillInBlankQuiz quiz = new FillInBlankQuiz();
        quiz.setId("625f5d7b4c3f1a2b9c8d7e71");
        quiz.setQuestionText("The Great Wall of China is located in _________.");
        quiz.setAcceptedAnswers(Arrays.asList("China", "china"));
        quiz.setCreatedBy("user789");
        quiz.setCreatedAt(LocalDateTime.now().minusDays(7));
        quiz.setUpdatedAt(LocalDateTime.now().minusDays(1));
        return quiz;
    }

    public static FillInBlankQuiz createMockFillInBlankQuiz2() {
        FillInBlankQuiz quiz = new FillInBlankQuiz();
        quiz.setId("625f5d7b4c3f1a2b9c8d7e72");
        quiz.setQuestionText("The chemical formula for water is _________.");
        quiz.setAcceptedAnswers(Arrays.asList("H2O", "h2o", "H₂O"));
        quiz.setCreatedBy("user101");
        quiz.setCreatedAt(LocalDateTime.now().minusDays(15));
        quiz.setUpdatedAt(LocalDateTime.now().minusDays(5));
        return quiz;
    }

    // ==================== Matching Quiz ====================
    public static MatchingQuiz createMockMatchingQuiz() {
        MatchingQuiz quiz = new MatchingQuiz();
        quiz.setId("625f5d7b4c3f1a2b9c8d7e73");
        quiz.setQuestionText("Match countries with their capitals");
        
        Map<String, String> pairs = new LinkedHashMap<>();
        pairs.put("France", "Paris");
        pairs.put("Japan", "Tokyo");
        pairs.put("Brazil", "Brasília");
        pairs.put("Egypt", "Cairo");
        
        quiz.setMatchingPairs(pairs);
        quiz.setCreatedBy("user202");
        quiz.setCreatedAt(LocalDateTime.now().minusDays(8));
        quiz.setUpdatedAt(LocalDateTime.now().minusDays(2));
        return quiz;
    }

    public static MatchingQuiz createMockMatchingQuiz2() {
        MatchingQuiz quiz = new MatchingQuiz();
        quiz.setId("625f5d7b4c3f1a2b9c8d7e74");
        quiz.setQuestionText("Match animals with their sounds");
        
        Map<String, String> pairs = new LinkedHashMap<>();
        pairs.put("Cat", "Meow");
        pairs.put("Dog", "Bark");
        pairs.put("Cow", "Moo");
        pairs.put("Sheep", "Baa");
        
        quiz.setMatchingPairs(pairs);
        quiz.setCreatedBy("user303");
        quiz.setCreatedAt(LocalDateTime.now().minusDays(12));
        quiz.setUpdatedAt(LocalDateTime.now().minusDays(4));
        return quiz;
    }

    // ==================== Reorder Quiz ====================
    public static ReorderQuiz createMockReorderQuiz() {
        ReorderQuiz quiz = new ReorderQuiz();
        quiz.setId("625f5d7b4c3f1a2b9c8d7e75");
        quiz.setQuestionText("Arrange the following steps to make a cup of tea");
        quiz.setCorrectOrder(Arrays.asList(
            "Boil water",
            "Add tea leaves to cup",
            "Pour boiling water into cup",
            "Let it steep for 5 minutes",
            "Add milk and sugar",
            "Stir and enjoy"
        ));
        quiz.setCreatedBy("user404");
        quiz.setCreatedAt(LocalDateTime.now().minusDays(6));
        quiz.setUpdatedAt(LocalDateTime.now().minusDays(1));
        return quiz;
    }

    public static ReorderQuiz createMockReorderQuiz2() {
        ReorderQuiz quiz = new ReorderQuiz();
        quiz.setId("625f5d7b4c3f1a2b9c8d7e76");
        quiz.setQuestionText("Arrange in order of smallest to largest");
        quiz.setCorrectOrder(Arrays.asList(
            "Atom",
            "Molecule",
            "Cell",
            "Tissue",
            "Organ",
            "Organism"
        ));
        quiz.setCreatedBy("user505");
        quiz.setCreatedAt(LocalDateTime.now().minusDays(20));
        quiz.setUpdatedAt(LocalDateTime.now().minusDays(10));
        return quiz;
    }

    // ==================== Convenience Methods ====================

    /**
     * Get all mock quizzes as a list
     */
    public static List<BaseQuiz> getAllMockQuizzes() {
        List<BaseQuiz> quizzes = new ArrayList<>();
        quizzes.add(createMockMultipleChoiceQuiz());
        quizzes.add(createMockMultipleChoiceQuiz2());
        quizzes.add(createMockFillInBlankQuiz());
        quizzes.add(createMockFillInBlankQuiz2());
        quizzes.add(createMockMatchingQuiz());
        quizzes.add(createMockMatchingQuiz2());
        quizzes.add(createMockReorderQuiz());
        quizzes.add(createMockReorderQuiz2());
        return quizzes;
    }

    /**
     * Get mock quizzes by type
     */
    public static List<? extends BaseQuiz> getMockQuizzesByType(String type) {
        return switch (type.toUpperCase()) {
            case "MULTIPLE_CHOICE" -> Arrays.asList(
                createMockMultipleChoiceQuiz(),
                createMockMultipleChoiceQuiz2()
            );
            case "FILL_IN_THE_BLANK" -> Arrays.asList(
                createMockFillInBlankQuiz(),
                createMockFillInBlankQuiz2()
            );
            case "MATCHING" -> Arrays.asList(
                createMockMatchingQuiz(),
                createMockMatchingQuiz2()
            );
            case "REORDER" -> Arrays.asList(
                createMockReorderQuiz(),
                createMockReorderQuiz2()
            );
            default -> new ArrayList<>();
        };
    }

    /**
     * Get a specific mock quiz by ID
     */
    public static Optional<BaseQuiz> getMockQuizById(String id) {
        return getAllMockQuizzes().stream()
            .filter(quiz -> quiz.getId().equals(id))
            .findFirst();
    }
}
