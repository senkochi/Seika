package com.seika.quiz_service.config;

import com.seika.quiz_service.exception.QuizServiceException;
import com.seika.quiz_service.shared.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.util.stream.Collectors;

/**
 * Global Exception Handler for Quiz Service
 * Handles all exceptions and returns standardized API responses
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(QuizServiceException.class)
    public ResponseEntity<ApiResponse<?>> handleQuizServiceException(
            QuizServiceException ex,
            WebRequest request) {
        log.error("Quiz Service Exception: {} - Code: {}", ex.getMessage(), ex.getCode());
        return ResponseEntity.status(ex.getCode())
            .body(ApiResponse.error(ex.getCode(), ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handleValidationException(
            MethodArgumentNotValidException ex,
            WebRequest request) {
        String message = ex.getBindingResult().getFieldErrors()
            .stream()
            .map(error -> error.getField() + ": " + error.getDefaultMessage())
            .collect(Collectors.joining(", "));
        log.error("Validation Error: {}", message);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.error(400, "Validation error: " + message));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<?>> handleIllegalArgumentException(
            IllegalArgumentException ex,
            WebRequest request) {
        log.error("Illegal Argument: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.error(400, ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleGenericException(
            Exception ex,
            WebRequest request) {
        log.error("Unexpected error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error(500, "An unexpected error occurred. Please try again later."));
    }
}
