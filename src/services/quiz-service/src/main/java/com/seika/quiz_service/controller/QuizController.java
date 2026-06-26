package com.seika.quiz_service.controller;

import com.seika.quiz_service.dto.quiz.QuizCreateRequest;
import com.seika.quiz_service.dto.quiz.QuizResponse;
import com.seika.quiz_service.service.QuizService;
import com.seika.quiz_service.shared.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import java.util.List;

@RestController
@RequestMapping("/api/quiz")
@Slf4j
public class QuizController {
    private final QuizService quizService;

    public QuizController(QuizService quizService){
        this.quizService = quizService;
    }

    /**
     * GET /api/quiz – lấy toàn bộ quiz (public, dùng cho học sinh)
     */
    @GetMapping()
    public ResponseEntity<ApiResponse<List<QuizResponse>>> getQuizzes() {
        List<QuizResponse> response = quizService.getQuizzes();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * GET /api/quiz/my – lấy quiz của giáo viên đang đăng nhập
     */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<QuizResponse>>> getMyQuizzes() {
        String userId = extractUserId();
        List<QuizResponse> response = quizService.getByCreatedBy(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * GET /api/quiz/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<QuizResponse>> getQuiz(@PathVariable String id) {
        QuizResponse response = quizService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * POST /api/quiz – giáo viên tạo quiz mới
     */
    @PostMapping()
    public ResponseEntity<ApiResponse<QuizResponse>> createQuiz(@RequestBody QuizCreateRequest request){
        String userId = extractUserId();
        QuizResponse response = quizService.create(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(response));
    }

    /**
     * DELETE /api/quiz/{id} – giáo viên xóa quiz của mình
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteQuiz(@PathVariable String id) {
        String userId = extractUserId();
        quizService.deleteByOwner(id, userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * POST /api/quiz/{id}/submit – học sinh nộp bài
     */
    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<Void>> submitQuiz(@PathVariable String id, @RequestBody java.util.Map<String, Object> payload) {
        String userId = extractUserId();
        Double score = Double.valueOf(payload.getOrDefault("score", 0).toString());
        quizService.submitQuiz(id, userId, score);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * Lấy userId từ SecurityContext (được inject bởi JwtAuthenticationFilter)
     */
    private String extractUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new IllegalStateException("User not authenticated");
        }
        return auth.getPrincipal().toString();
    }
}

