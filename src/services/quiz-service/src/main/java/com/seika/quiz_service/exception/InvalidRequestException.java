package com.seika.quiz_service.exception;

/**
 * Exception thrown when the request is invalid
 */
public class InvalidRequestException extends QuizServiceException {
    public InvalidRequestException(String message) {
        super(400, message);
    }
}
