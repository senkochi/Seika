package com.seika.quiz_service.exception;

/**
 * Base Exception for Quiz Service
 */
public class QuizServiceException extends RuntimeException {
    private final int code;

    public QuizServiceException(int code, String message) {
        super(message);
        this.code = code;
    }

    public QuizServiceException(int code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

    public int getCode() {
        return code;
    }
}
