package com.seika.identity_service.exception;

/**
 * Token (access/refresh) không hợp lệ, đã revoke, hoặc hết hạn — HTTP 401.
 */
public class TokenInvalidException extends AuthException {
    public TokenInvalidException(String message) {
        super(401, message);
    }
}
