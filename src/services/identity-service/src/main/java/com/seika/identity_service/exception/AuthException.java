package com.seika.identity_service.exception;

import lombok.Getter;

/**
 * Base exception cho identity-service.
 * Mỗi subclass cố định HTTP status qua {@code code} (vd 400, 401, 404, 409).
 */
@Getter
public class AuthException extends RuntimeException {
    private final int code;

    public AuthException(int code, String message) {
        super(message);
        this.code = code;
    }
}
