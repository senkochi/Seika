package com.seika.quiz_service.exception;

/**
 * Exception thrown when a requested resource is not found
 */
public class ResourceNotFoundException extends QuizServiceException {
    public ResourceNotFoundException(String resourceName, String id) {
        super(404, resourceName + " with ID " + id + " not found");
    }

    public ResourceNotFoundException(String message) {
        super(404, message);
    }
}
