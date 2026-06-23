package com.seika.notification_service.controller;

import com.seika.notification_service.dto.CreateNotificationRequest;
import com.seika.notification_service.dto.MarkAllAsReadResponse;
import com.seika.notification_service.dto.NotificationResponse;
import com.seika.notification_service.dto.UnreadCountResponse;
import jakarta.validation.Valid;
import com.seika.notification_service.shared.ApiResponse;
import com.seika.notification_service.shared.PagedResponse;
import jakarta.validation.Valid;
import com.seika.notification_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping
    public ResponseEntity<ApiResponse<NotificationResponse>> createNotification(@Valid @RequestBody CreateNotificationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(notificationService.createNotification(request)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<PagedResponse<NotificationResponse>>> getMyNotifications(
            @RequestHeader("X-User-Id") String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<NotificationResponse> result = notificationService.getNotificationsByUser(userId, page, size);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(result)));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markAsRead(
            @PathVariable String notificationId,
            @RequestHeader("X-User-Id") String userId
    ) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.markAsRead(notificationId, userId)));
    }

    @PatchMapping("/me/read-all")
    public ResponseEntity<ApiResponse<MarkAllAsReadResponse>> markAllAsRead(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.markAllAsRead(userId)));
    }

    @GetMapping("/me/unread-count")
    public ResponseEntity<ApiResponse<UnreadCountResponse>> getUnreadCount(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.getUnreadCount(userId)));
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            @PathVariable String notificationId,
            @RequestHeader("X-User-Id") String userId
    ) {
        notificationService.deleteNotification(notificationId, userId);
        return ResponseEntity.ok(ApiResponse.noContent());
    }
}
