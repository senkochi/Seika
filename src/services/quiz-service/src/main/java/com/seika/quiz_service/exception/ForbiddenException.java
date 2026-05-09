package com.seika.quiz_service.exception;

/**
 * Exception thrown when user doesn't have permission to access resource
 */
public class ForbiddenException extends QuizServiceException {
    public ForbiddenException(String message) {
        super(403, message);
    }
}
