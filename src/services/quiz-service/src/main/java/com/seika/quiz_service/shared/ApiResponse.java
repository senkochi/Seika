package com.seika.quiz_service.shared;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;

/**
 * Standard API Response Wrapper
 * Used for all API responses across the service
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private int code;
    private String message;
    private T data;
    private LocalDateTime timestamp;

    /**
     * Create a successful response with data
     */
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(200, "Success", data, LocalDateTime.now());
    }

    /**
     * Create a successful response with data and custom message
     */
    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(200, message, data, LocalDateTime.now());
    }

    /**
     * Create a response with custom code and message
     */
    public static <T> ApiResponse<T> error(int code, String message) {
        return new ApiResponse<>(code, message, null, LocalDateTime.now());
    }

    /**
     * Create a 201 Created response
     */
    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(201, "Created", data, LocalDateTime.now());
    }

    /**
     * Create a 201 Created response with custom message
     */
    public static <T> ApiResponse<T> created(T data, String message) {
        return new ApiResponse<>(201, message, data, LocalDateTime.now());
    }

    /**
     * Create a response without data (for delete operations)
     */
    public static ApiResponse<Void> noContent() {
        return new ApiResponse<>(204, "No Content", null, LocalDateTime.now());
    }
}
