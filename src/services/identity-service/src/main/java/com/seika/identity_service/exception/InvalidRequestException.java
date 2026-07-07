package com.seika.identity_service.exception;

/**
 * Request không hợp lệ về mặt nghiệp vụ — HTTP 400.
 */
public class InvalidRequestException extends AuthException {
    public InvalidRequestException(String message) {
        super(400, message);
    }
}
