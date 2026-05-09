package com.seika.quiz_service.controller;

import com.seika.quiz_service.dto.quiz.QuizCreateRequest;
import com.seika.quiz_service.dto.quiz.QuizResponse;
import com.seika.quiz_service.service.QuizService;
import com.seika.quiz_service.shared.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quiz")
@Slf4j
public class QuizController {
    private final QuizService quizService;

    public QuizController(QuizService quizService){
        this.quizService = quizService;
    }

    @GetMapping()
    public ResponseEntity<ApiResponse<List<QuizResponse>>> getQuizzes() {
        List<QuizResponse> response = quizService.getQuizzes();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<QuizResponse>> getQuiz(@PathVariable String id) {
        QuizResponse response = quizService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping()
    public ResponseEntity<ApiResponse<QuizResponse>> createQuiz(@RequestBody QuizCreateRequest request){
        QuizResponse response = quizService.create(request);
        return ResponseEntity.ok(ApiResponse.created(response));
    }
}
