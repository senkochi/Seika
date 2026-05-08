package com.seika.quiz_service.controller;

import com.seika.quiz_service.dto.quiz.QuizResponse;
import com.seika.quiz_service.service.QuizService;
import com.seika.quiz_service.shared.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
        log.info("Fetching quiz with id: {}", 1);
        List<QuizResponse> response = quizService.getQuizzes();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
