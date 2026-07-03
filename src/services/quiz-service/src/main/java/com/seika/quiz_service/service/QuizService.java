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
import com.seika.quiz_service.domain.QuizAttempt;
import com.seika.quiz_service.repository.QuizAttemptRepository;
import com.seika.quiz_service.repository.QuizRepository;
import com.seika.quiz_service.repository.QuizSetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuizService {

    /**
     * Minimum percentage (0-100) required for a quiz attempt to be considered
     * passed. Aligned with the documented business rule "hoàn thành 80% quiz
     * được tính thưởng".
     */
    public static final double PASS_THRESHOLD = 80.0;

    private final QuizRepository quizRepository;
    private final QuizSetRepository quizSetRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;
    
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

    public Double calculateScoreFromAnswers(String id, List<java.util.Map<String, Object>> answers) {
        if (answers == null || answers.isEmpty()) {
            throw new IllegalArgumentException("Danh sách câu trả lời (answers) không được để trống!");
        }
        int totalQuestions = 0;
        int correctCount = 0;

        if (quizSetRepository.existsById(id)) {
            com.seika.quiz_service.domain.QuizSet quizSet = quizSetRepository.findById(id).orElse(null);
            if (quizSet != null && quizSet.getQuizIds() != null) {
                totalQuestions = quizSet.getQuizIds().size();
            } else {
                totalQuestions = answers.size();
            }
        } else if (quizRepository.existsById(id)) {
            totalQuestions = 1;
        } else {
            throw new ResourceNotFoundException("Quiz or QuizSet", id);
        }

        for (java.util.Map<String, Object> ansMap : answers) {
            String qId = (String) ansMap.get("questionId");
            Object ansVal = ansMap.get("answer");
            if (qId == null || ansVal == null) continue;

            BaseQuiz quiz = quizRepository.findById(qId).orElse(null);
            if (quiz == null) continue;

            boolean isCorrect = false;
            if (quiz instanceof com.seika.quiz_service.domain.MultipleChoiceQuiz mcq) {
                try {
                    int submittedIdx = Integer.parseInt(ansVal.toString());
                    isCorrect = (submittedIdx == mcq.getCorrectOptionIndex());
                } catch (NumberFormatException ignored) {}
            } else if (quiz instanceof com.seika.quiz_service.domain.FillInBlankQuiz fib) {
                String submittedAns = ansVal.toString().trim().toLowerCase();
                isCorrect = fib.getAcceptedAnswers() != null && fib.getAcceptedAnswers().stream()
                        .anyMatch(a -> a != null && a.trim().toLowerCase().equals(submittedAns));
            } else if (quiz instanceof com.seika.quiz_service.domain.ReorderQuiz rq) {
                isCorrect = rq.getCorrectOrder() != null && rq.getCorrectOrder().equals(ansVal);
            } else if (quiz instanceof com.seika.quiz_service.domain.MatchingQuiz mq) {
                isCorrect = mq.getMatchingPairs() != null && mq.getMatchingPairs().equals(ansVal);
            }

            if (isCorrect) {
                correctCount++;
            }
        }

        if (totalQuestions == 0) return 0.0;
        return Math.round(((double) correctCount / totalQuestions) * 100.0) * 1.0;
    }

    /**
     * Submit a quiz attempt and publish completion event.
     *
     * <p>Persists a {@link QuizAttempt} document so teacher Statistics endpoints
     * can compute pass-rate and per-quiz-set drill-downs without going through
     * the asynchronous event stream. The {@code QuizCompletedEvent} is still
     * emitted so downstream consumers (reward-service, profile-service) keep
     * working unchanged.
     */
    public void submitQuiz(String id, String userId, Double score) {
        log.info("Submitting quiz id: {} for user: {} with score: {}", id, userId, score);

        // Ensure quiz or quiz set exists
        if (!quizRepository.existsById(id) && !quizSetRepository.existsById(id)) {
            throw new ResourceNotFoundException("Quiz or QuizSet", id);
        }

        boolean passed = score >= PASS_THRESHOLD;

        // 1) Persist attempt (used by teacher Statistics page)
        String resolvedQuizSetId = quizSetRepository.existsById(id)
                ? id
                : resolveOwningQuizSetId(id);

        QuizAttempt attempt = QuizAttempt.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .quizSetId(resolvedQuizSetId)
                .quizId(quizSetRepository.existsById(id) ? null : id)
                .score(score)
                .passed(passed)
                .attemptAt(Instant.now())
                .build();
        quizAttemptRepository.save(attempt);

        // 2) Publish event for downstream consumers (rewards, profile, ...)
        com.seika.quiz_service.dto.QuizCompletedEvent event = com.seika.quiz_service.dto.QuizCompletedEvent.builder()
                .eventId(java.util.UUID.randomUUID().toString())
                .correlationId("quiz-" + id + "-user-" + userId)
                .userId(userId)
                .quizId(id)
                .score(score)
                .passed(passed)
                .completedAt(java.time.LocalDateTime.now().toString())
                .build();

        rabbitTemplate.convertAndSend(
                com.seika.quiz_service.config.RabbitMQConfig.LEARNING_EVENTS_EXCHANGE,
                com.seika.quiz_service.config.RabbitMQConfig.QUIZ_COMPLETED_ROUTING_KEY,
                event
        );
        log.info("Published QuizCompletedEvent for quiz {} and user {} (passed={})", id, userId, passed);
    }

    /**
     * Locate the QuizSet that owns the supplied quiz id. Returns {@code null}
     * if the quiz is not nested in any QuizSet (a standalone quiz). Uses
     * MongoTemplate to avoid pulling extra repository dependencies.
     */
    private String resolveOwningQuizSetId(String quizId) {
        return quizSetRepository.findAll().stream()
                .filter(qs -> qs.getQuizIds() != null && qs.getQuizIds().contains(quizId))
                .map(com.seika.quiz_service.domain.QuizSet::getId)
                .findFirst()
                .orElse(null);
    }
}
