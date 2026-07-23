package com.seika.quiz_service.service;

import com.seika.quiz_service.exception.ResourceNotFoundException;
import com.seika.quiz_service.repository.QuizAttemptRepository;
import com.seika.quiz_service.repository.QuizRepository;
import com.seika.quiz_service.repository.QuizSetRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

public class QuizServiceTest {

    @Mock
    private QuizRepository quizRepository;

    @Mock
    private QuizSetRepository quizSetRepository;

    @Mock
    private QuizAttemptRepository quizAttemptRepository;

    @Mock
    private ContentEventPublisher contentEventPublisher;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @InjectMocks
    private QuizService quizService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testSubmitQuiz_WhenQuizExists_ShouldSucceed() {
        String id = "quiz-123";
        String userId = "user-123";
        Double score = 80.0;

        when(quizRepository.existsById(id)).thenReturn(true);

        quizService.submitQuiz(id, userId, score);

        verify(rabbitTemplate, times(1)).convertAndSend(anyString(), anyString(), any(com.seika.quiz_service.dto.QuizCompletedEvent.class));
        verify(quizRepository, times(1)).existsById(id);
    }

    @Test
    void testSubmitQuiz_WhenQuizSetExists_ShouldSucceed() {
        String id = "quizset-123";
        String userId = "user-123";
        Double score = 80.0;

        when(quizRepository.existsById(id)).thenReturn(false);
        when(quizSetRepository.existsById(id)).thenReturn(true);
        when(quizAttemptRepository.existsByUserIdAndQuizSetId(userId, id)).thenReturn(false);

        quizService.submitQuiz(id, userId, score);

        verify(rabbitTemplate, times(1)).convertAndSend(anyString(), anyString(), any(com.seika.quiz_service.dto.QuizCompletedEvent.class));
        verify(quizRepository, times(1)).existsById(id);
        verify(quizSetRepository, atLeastOnce()).existsById(id);
        verify(contentEventPublisher, times(1)).publishQuizSetConsumed(id, userId);
    }

    @Test
    void testSubmitQuiz_WhenNeitherExists_ShouldThrowException() {
        String id = "notfound-123";
        String userId = "user-123";
        Double score = 80.0;

        when(quizRepository.existsById(id)).thenReturn(false);
        when(quizSetRepository.existsById(id)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> {
            quizService.submitQuiz(id, userId, score);
        });

        verify(rabbitTemplate, never()).convertAndSend(anyString(), anyString(), any(com.seika.quiz_service.dto.QuizCompletedEvent.class));
    }
}


