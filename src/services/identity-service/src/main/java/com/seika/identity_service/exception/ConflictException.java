package com.seika.identity_service.exception;

/**
 * Xung đột dữ liệu (vd username đã tồn tại) — HTTP 409.
 */
public class ConflictException extends AuthException {
    public ConflictException(String message) {
        super(409, message);
    }
}
