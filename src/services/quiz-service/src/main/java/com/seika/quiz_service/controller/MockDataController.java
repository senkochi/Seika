package com.seika.quiz_service.controller;

import com.seika.quiz_service.constant.data.QuizMockData;
import com.seika.quiz_service.domain.BaseQuiz;
import com.seika.quiz_service.shared.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * Development/Testing endpoint for mock data
 * Remove this in production
 */
@RestController
@RequestMapping("/api/v1/dev/mock")
@Slf4j
public class MockDataController {

    /**
     * Get all mock quizzes
     * GET /api/v1/dev/mock/quizzes
     */
    @GetMapping("/quizzes")
    public ResponseEntity<ApiResponse<List<BaseQuiz>>> getAllMockQuizzes() {
        log.info("Fetching all mock quizzes");
        List<BaseQuiz> mockData = QuizMockData.getAllMockQuizzes();
        return ResponseEntity.ok(ApiResponse.success(mockData, "Mock quizzes retrieved successfully"));
    }

    /**
     * Get mock quizzes by type
     * GET /api/v1/dev/mock/quizzes/type/{type}
     * Examples: MULTIPLE_CHOICE, FILL_IN_THE_BLANK, MATCHING, REORDER
     */
    @GetMapping("/quizzes/type/{type}")
    public ResponseEntity<ApiResponse<?>> getMockQuizzesByType(@PathVariable String type) {
        log.info("Fetching mock quizzes by type: {}", type);
        List<?> mockData = QuizMockData.getMockQuizzesByType(type);
        if (mockData.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(
                List.of(),
                "No mock quizzes found for type: " + type
            ));
        }
        return ResponseEntity.ok(ApiResponse.success(mockData, "Mock quizzes of type " + type));
    }

    /**
     * Get a specific mock quiz by ID
     * GET /api/v1/dev/mock/quizzes/{id}
     */
    @GetMapping("/quizzes/{id}")
    public ResponseEntity<ApiResponse<?>> getMockQuizById(@PathVariable String id) {
        log.info("Fetching mock quiz by id: {}", id);
        Optional<BaseQuiz> quiz = QuizMockData.getMockQuizById(id);
        
        if (quiz.isPresent()) {
            return ResponseEntity.ok(ApiResponse.success(quiz.get(), "Mock quiz retrieved"));
        } else {
            return ResponseEntity.ok(ApiResponse.success(
                null,
                "Mock quiz with id " + id + " not found"
            ));
        }
    }

    /**
     * Get mock data for Multiple Choice quizzes
     * GET /api/v1/dev/mock/multiple-choice
     */
    @GetMapping("/multiple-choice")
    public ResponseEntity<ApiResponse<?>> getMockMultipleChoice() {
        log.info("Fetching mock multiple choice quizzes");
        return ResponseEntity.ok(ApiResponse.success(
            List.of(
                QuizMockData.createMockMultipleChoiceQuiz(),
                QuizMockData.createMockMultipleChoiceQuiz2()
            ),
            "Mock multiple choice quizzes"
        ));
    }

    /**
     * Get mock data for Fill in Blank quizzes
     * GET /api/v1/dev/mock/fill-in-blank
     */
    @GetMapping("/fill-in-blank")
    public ResponseEntity<ApiResponse<?>> getMockFillInBlank() {
        log.info("Fetching mock fill in blank quizzes");
        return ResponseEntity.ok(ApiResponse.success(
            List.of(
                QuizMockData.createMockFillInBlankQuiz(),
                QuizMockData.createMockFillInBlankQuiz2()
            ),
            "Mock fill in blank quizzes"
        ));
    }

    /**
     * Get mock data for Matching quizzes
     * GET /api/v1/dev/mock/matching
     */
    @GetMapping("/matching")
    public ResponseEntity<ApiResponse<?>> getMockMatching() {
        log.info("Fetching mock matching quizzes");
        return ResponseEntity.ok(ApiResponse.success(
            List.of(
                QuizMockData.createMockMatchingQuiz(),
                QuizMockData.createMockMatchingQuiz2()
            ),
            "Mock matching quizzes"
        ));
    }

    /**
     * Get mock data for Reorder quizzes
     * GET /api/v1/dev/mock/reorder
     */
    @GetMapping("/reorder")
    public ResponseEntity<ApiResponse<?>> getMockReorder() {
        log.info("Fetching mock reorder quizzes");
        return ResponseEntity.ok(ApiResponse.success(
            List.of(
                QuizMockData.createMockReorderQuiz(),
                QuizMockData.createMockReorderQuiz2()
            ),
            "Mock reorder quizzes"
        ));
    }
}
