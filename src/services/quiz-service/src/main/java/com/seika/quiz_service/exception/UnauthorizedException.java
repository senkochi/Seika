package com.seika.quiz_service.exception;

/**
 * Exception thrown when user is not authenticated
 */
public class UnauthorizedException extends QuizServiceException {
    public UnauthorizedException(String message) {
        super(401, message);
    }
}
