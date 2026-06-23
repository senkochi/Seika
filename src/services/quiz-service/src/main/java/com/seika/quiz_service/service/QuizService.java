package com.seika.quiz_service.service;

import com.seika.quiz_service.domain.*;
import com.seika.quiz_service.dto.quiz.QuizCreateRequest;
import com.seika.quiz_service.dto.quiz.QuizResponse;
import com.seika.quiz_service.dto.quiz.request_sub_types.FillInBlankRequest;
import com.seika.quiz_service.dto.quiz.request_sub_types.MatchingRequest;
import com.seika.quiz_service.dto.quiz.request_sub_types.McqRequest;
import com.seika.quiz_service.dto.quiz.request_sub_types.ReorderRequest;
import com.seika.quiz_service.exception.ForbiddenException;
import com.seika.quiz_service.exception.ResourceNotFoundException;
import com.seika.quiz_service.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
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
     * @param request quiz creation payload
     * @param createdBy userId extracted from JWT by the controller
     */
    public QuizResponse create(QuizCreateRequest request, String createdBy) {
        log.info("Creating new quiz: {} by user: {}", request.getQuestionText(), createdBy);
        BaseQuiz quiz = switch (request) {
            case MatchingRequest req -> {
                MatchingQuiz matchingQuiz = new MatchingQuiz();
                matchingQuiz.setMatchingPairs(req.getMatchingPairs());
                yield matchingQuiz;
            }
            case ReorderRequest req -> {
                ReorderQuiz reorderQuiz = new ReorderQuiz();
                reorderQuiz.setCorrectOrder(req.getCorrectOrder());
                yield reorderQuiz;
            }
            case FillInBlankRequest req -> {
                FillInBlankQuiz fillInBlankQuiz = new FillInBlankQuiz();
                fillInBlankQuiz.setAcceptedAnswers(req.getAcceptedAnswers());
                yield fillInBlankQuiz;
            }
            case McqRequest req -> {
                MultipleChoiceQuiz mcqQuiz = new MultipleChoiceQuiz();
                mcqQuiz.setOptions(req.getOptions());
                mcqQuiz.setCorrectOptionIndex(req.getCorrectOptionIndex());
                yield mcqQuiz;
            }
            default -> throw new IllegalArgumentException("Invalid Quiz Type");
        };

        quiz.setQuestionText(request.getQuestionText());
        quiz.setCreatedBy(createdBy);

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
     * Delete quiz – chỉ owner mới được xóa
     */
    public void deleteByOwner(String id, String requesterId) {
        log.info("Deleting quiz id: {} requested by: {}", id, requesterId);
        BaseQuiz quiz = quizRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Quiz", id));
        if (!quiz.getCreatedBy().equals(requesterId)) {
            throw new ForbiddenException("You are not allowed to delete this quiz");
        }
        quizRepository.deleteById(id);
        log.info("Quiz {} deleted successfully", id);
    }

    /**
     * Delete quiz (internal – no ownership check, kept for legacy compatibility)
     */
    public void delete(String id) {
        log.info("Deleting quiz with id: {}", id);
        if (!quizRepository.existsById(id)) {
            throw new ResourceNotFoundException("Quiz", id);
        }
        quizRepository.deleteById(id);
    }

    /**
     * Convert BaseQuiz to QuizResponse, including type-specific fields
     */
    public QuizResponse convertToResponse(BaseQuiz quiz) {
        QuizResponse.QuizResponseBuilder builder = QuizResponse.builder()
            .id(quiz.getId())
            .questionText(quiz.getQuestionText())
            .createdAt(quiz.getCreatedAt())
            .updatedAt(quiz.getUpdatedAt())
            .createdBy(quiz.getCreatedBy())
            .type(quiz.getType());

        if (quiz instanceof MultipleChoiceQuiz mcq) {
            builder.options(mcq.getOptions());
            builder.correctOptionIndex(mcq.getCorrectOptionIndex());
        } else if (quiz instanceof MatchingQuiz matching) {
            builder.matchingPairs(matching.getMatchingPairs());
        } else if (quiz instanceof ReorderQuiz reorder) {
            builder.correctOrder(reorder.getCorrectOrder());
        } else if (quiz instanceof FillInBlankQuiz fillIn) {
            builder.acceptedAnswers(fillIn.getAcceptedAnswers());
        }

        return builder.build();
    }
}
