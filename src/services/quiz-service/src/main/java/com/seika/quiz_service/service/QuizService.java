package com.seika.quiz_service.service;

import com.seika.quiz_service.domain.BaseQuiz;
import com.seika.quiz_service.dto.quiz.QuizResponse;
import com.seika.quiz_service.exception.ResourceNotFoundException;
import com.seika.quiz_service.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuizService {
    
    private final QuizRepository quizRepository;
    
    /**
     * Get all quizzes
     */
    public List<QuizResponse> getQuizzes() {
        log.info("Fetching all quizzes");
        return quizRepository.findAll()
            .stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Get quiz by ID
     */
    public QuizResponse getById(String id) {
        log.info("Fetching quiz with id: {}", id);
        BaseQuiz quiz = quizRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Quiz", id));
        return convertToResponse(quiz);
    }
    
    /**
     * Get quizzes by type
     */
    public List<QuizResponse> getByType(String type) {
        log.info("Fetching quizzes by type: {}", type);
        return quizRepository.findByType(type)
            .stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Get quizzes created by user
     */
    public List<QuizResponse> getByCreatedBy(String createdBy) {
        log.info("Fetching quizzes created by: {}", createdBy);
        return quizRepository.findByCreatedBy(createdBy)
            .stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Create new quiz
     */
    public QuizResponse create(BaseQuiz quiz) {
        log.info("Creating new quiz: {}", quiz.getQuestionText());
        BaseQuiz saved = quizRepository.save(quiz);
        return convertToResponse(saved);
    }
    
    /**
     * Update quiz
     */
    public QuizResponse update(String id, BaseQuiz quiz) {
        log.info("Updating quiz with id: {}", id);
        BaseQuiz existing = quizRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Quiz", id));
        
        quiz.setId(id);
        BaseQuiz updated = quizRepository.save(quiz);
        return convertToResponse(updated);
    }
    
    /**
     * Delete quiz
     */
    public void delete(String id) {
        log.info("Deleting quiz with id: {}", id);
        if (!quizRepository.existsById(id)) {
            throw new ResourceNotFoundException("Quiz", id);
        }
        quizRepository.deleteById(id);
    }
    
    /**
     * Convert BaseQuiz to QuizResponse
     */
    private QuizResponse convertToResponse(BaseQuiz quiz) {
        return QuizResponse.builder()
            .id(quiz.getId())
            .questionText(quiz.getQuestionText())
            .createdAt(quiz.getCreatedAt())
            .updatedAt(quiz.getUpdatedAt())
            .createdBy(quiz.getCreatedBy())
            .type(quiz.getType())
            .build();
    }
}
