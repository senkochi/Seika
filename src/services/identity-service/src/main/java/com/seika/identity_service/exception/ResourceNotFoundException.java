package com.seika.identity_service.exception;

/**
 * Resource (user, role, ...) không tồn tại — HTTP 404.
 */
public class ResourceNotFoundException extends AuthException {
    public ResourceNotFoundException(String resource, String id) {
        super(404, resource + " với ID " + id + " không tồn tại");
    }
}
