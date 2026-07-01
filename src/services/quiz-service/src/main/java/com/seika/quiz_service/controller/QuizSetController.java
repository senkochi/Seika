package com.seika.quiz_service.controller;

import com.seika.quiz_service.dto.quizset.QuizSetCreateRequest;
import com.seika.quiz_service.dto.quizset.QuizSetResponse;
import com.seika.quiz_service.dto.statistics.QuizAttemptResponse;
import com.seika.quiz_service.dto.statistics.QuizStatisticsOverview;
import com.seika.quiz_service.dto.statistics.TopQuizSetResponse;
import com.seika.quiz_service.service.QuizSetService;
import com.seika.quiz_service.shared.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quiz-sets")
@Slf4j
public class QuizSetController {
    
    private final QuizSetService quizSetService;

    public QuizSetController(QuizSetService quizSetService) {
        this.quizSetService = quizSetService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<QuizSetResponse>> createQuizSet(@RequestBody QuizSetCreateRequest request) {
        String userId = extractUserId();
        QuizSetResponse response = quizSetService.create(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(response));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<QuizSetResponse>>> getMyQuizSets() {
        String userId = extractUserId();
        List<QuizSetResponse> response = quizSetService.getByCreatedBy(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<QuizSetResponse>> getQuizSet(@PathVariable String id) {
        QuizSetResponse response = quizSetService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteQuizSet(@PathVariable String id) {
        String userId = extractUserId();
        quizSetService.deleteByOwner(id, userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // -------------------------------------------------------------------------
    // Teacher statistics endpoints
    // -------------------------------------------------------------------------

    @GetMapping("/my/statistics")
    public ResponseEntity<ApiResponse<QuizStatisticsOverview>> getMyStatistics() {
        String userId = extractUserId();
        QuizStatisticsOverview overview = quizSetService.getStatisticsForAuthor(userId);
        return ResponseEntity.ok(ApiResponse.success(overview));
    }

    @GetMapping("/{id}/attempts")
    public ResponseEntity<ApiResponse<List<QuizAttemptResponse>>> getAttemptsForQuizSet(@PathVariable String id) {
        String userId = extractUserId();
        List<QuizAttemptResponse> attempts = quizSetService.getAttemptsForQuizSet(id, userId);
        return ResponseEntity.ok(ApiResponse.success(attempts));
    }

    @GetMapping("/my/top-selling")
    public ResponseEntity<ApiResponse<List<TopQuizSetResponse>>> getTopSellingQuizSets(
            @RequestParam(defaultValue = "5") int limit) {
        String userId = extractUserId();
        List<TopQuizSetResponse> top = quizSetService.getTopSellingQuizSets(userId, limit);
        return ResponseEntity.ok(ApiResponse.success(top));
    }

    private String extractUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new IllegalStateException("User not authenticated");
        }
        return auth.getPrincipal().toString();
    }
}
