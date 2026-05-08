package com.seika.quiz_service;

import com.seika.quiz_service.constant.data.QuizMockData;
import com.seika.quiz_service.domain.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Quiz Mock Data Tests")
public class QuizMockDataTest {

    @Test
    @DisplayName("Should create mock multiple choice quiz")
    public void testCreateMockMultipleChoiceQuiz() {
        MultipleChoiceQuiz quiz = QuizMockData.createMockMultipleChoiceQuiz();
        
        assertNotNull(quiz);
        assertEquals("625f5d7b4c3f1a2b9c8d7e6f", quiz.getId());
        assertEquals("What is the capital of France?", quiz.getQuestionText());
        assertEquals(4, quiz.getOptions().size());
        assertEquals(2, quiz.getCorrectOptionIndex());
        assertEquals("Paris", quiz.getOptions().get(2));
    }

    @Test
    @DisplayName("Should create mock fill in blank quiz")
    public void testCreateMockFillInBlankQuiz() {
        FillInBlankQuiz quiz = QuizMockData.createMockFillInBlankQuiz();
        
        assertNotNull(quiz);
        assertEquals("625f5d7b4c3f1a2b9c8d7e71", quiz.getId());
        assertEquals("The Great Wall of China is located in _________.", quiz.getQuestionText());
        assertTrue(quiz.getAcceptedAnswers().contains("China"));
        assertTrue(quiz.getAcceptedAnswers().contains("china"));
    }

    @Test
    @DisplayName("Should create mock matching quiz")
    public void testCreateMockMatchingQuiz() {
        MatchingQuiz quiz = QuizMockData.createMockMatchingQuiz();
        
        assertNotNull(quiz);
        assertEquals("625f5d7b4c3f1a2b9c8d7e73", quiz.getId());
        assertEquals("Match countries with their capitals", quiz.getQuestionText());
        assertEquals(4, quiz.getMatchingPairs().size());
        assertEquals("Paris", quiz.getMatchingPairs().get("France"));
    }

    @Test
    @DisplayName("Should create mock reorder quiz")
    public void testCreateMockReorderQuiz() {
        ReorderQuiz quiz = QuizMockData.createMockReorderQuiz();
        
        assertNotNull(quiz);
        assertEquals("625f5d7b4c3f1a2b9c8d7e75", quiz.getId());
        assertEquals("Arrange the following steps to make a cup of tea", quiz.getQuestionText());
        assertEquals(6, quiz.getCorrectOrder().size());
        assertEquals("Boil water", quiz.getCorrectOrder().get(0));
    }

    @Test
    @DisplayName("Should get all mock quizzes")
    public void testGetAllMockQuizzes() {
        List<BaseQuiz> quizzes = QuizMockData.getAllMockQuizzes();
        
        assertNotNull(quizzes);
        assertEquals(8, quizzes.size()); // 2 of each type
        
        long mcCount = quizzes.stream()
            .filter(q -> q instanceof MultipleChoiceQuiz)
            .count();
        assertEquals(2, mcCount);
    }

    @Test
    @DisplayName("Should get mock quizzes by type - MULTIPLE_CHOICE")
    public void testGetMockQuizzesByTypeMultipleChoice() {
        List<?> quizzes = QuizMockData.getMockQuizzesByType("MULTIPLE_CHOICE");
        
        assertNotNull(quizzes);
        assertEquals(2, quizzes.size());
        assertTrue(quizzes.get(0) instanceof MultipleChoiceQuiz);
    }

    @Test
    @DisplayName("Should get mock quizzes by type - FILL_IN_THE_BLANK")
    public void testGetMockQuizzesByTypeFillInBlank() {
        List<?> quizzes = QuizMockData.getMockQuizzesByType("FILL_IN_THE_BLANK");
        
        assertNotNull(quizzes);
        assertEquals(2, quizzes.size());
        assertTrue(quizzes.get(0) instanceof FillInBlankQuiz);
    }

    @Test
    @DisplayName("Should get mock quizzes by type - MATCHING")
    public void testGetMockQuizzesByTypeMatching() {
        List<?> quizzes = QuizMockData.getMockQuizzesByType("MATCHING");
        
        assertNotNull(quizzes);
        assertEquals(2, quizzes.size());
        assertTrue(quizzes.get(0) instanceof MatchingQuiz);
    }

    @Test
    @DisplayName("Should get mock quizzes by type - REORDER")
    public void testGetMockQuizzesByTypeReorder() {
        List<?> quizzes = QuizMockData.getMockQuizzesByType("REORDER");
        
        assertNotNull(quizzes);
        assertEquals(2, quizzes.size());
        assertTrue(quizzes.get(0) instanceof ReorderQuiz);
    }

    @Test
    @DisplayName("Should return empty list for unknown type")
    public void testGetMockQuizzesByTypeUnknown() {
        List<?> quizzes = QuizMockData.getMockQuizzesByType("UNKNOWN");
        
        assertNotNull(quizzes);
        assertTrue(quizzes.isEmpty());
    }

    @Test
    @DisplayName("Should get mock quiz by ID")
    public void testGetMockQuizById() {
        Optional<BaseQuiz> quiz = QuizMockData.getMockQuizById("625f5d7b4c3f1a2b9c8d7e6f");
        
        assertTrue(quiz.isPresent());
        assertEquals("What is the capital of France?", quiz.get().getQuestionText());
    }

    @Test
    @DisplayName("Should return empty optional for non-existent ID")
    public void testGetMockQuizByIdNotFound() {
        Optional<BaseQuiz> quiz = QuizMockData.getMockQuizById("non-existent-id");
        
        assertTrue(quiz.isEmpty());
    }

    @Test
    @DisplayName("Should verify all mock quizzes have IDs")
    public void testAllMockQuizzesHaveIds() {
        List<BaseQuiz> quizzes = QuizMockData.getAllMockQuizzes();
        
        quizzes.forEach(quiz -> assertNotNull(quiz.getId()));
        quizzes.forEach(quiz -> assertFalse(quiz.getId().isEmpty()));
    }

    @Test
    @DisplayName("Should verify all mock quizzes have timestamps")
    public void testAllMockQuizzesHaveTimestamps() {
        List<BaseQuiz> quizzes = QuizMockData.getAllMockQuizzes();
        
        quizzes.forEach(quiz -> assertNotNull(quiz.getCreatedAt()));
        quizzes.forEach(quiz -> assertNotNull(quiz.getCreatedBy()));
    }
}
