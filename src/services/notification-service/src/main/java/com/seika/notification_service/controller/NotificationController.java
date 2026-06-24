package com.seika.notification_service.controller;

import com.seika.notification_service.dto.CreateNotificationRequest;
import com.seika.notification_service.dto.MarkAllAsReadResponse;
import com.seika.notification_service.dto.NotificationResponse;
import com.seika.notification_service.dto.UnreadCountResponse;
import jakarta.validation.Valid;
import com.seika.notification_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.http.MediaType;

import com.seika.notification_service.service.SseService;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final SseService sseService;

    @GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@RequestHeader("X-User-Id") String userId) {
        return sseService.subscribe(userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public NotificationResponse createNotification(@Valid @RequestBody CreateNotificationRequest request) {
        return notificationService.createNotification(request);
    }

    @GetMapping("/me")
    public Page<NotificationResponse> getMyNotifications(
            @RequestHeader("X-User-Id") String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return notificationService.getNotificationsByUser(userId, page, size);
    }

    @PatchMapping("/{notificationId}/read")
    public NotificationResponse markAsRead(
            @PathVariable String notificationId,
            @RequestHeader("X-User-Id") String userId
    ) {
        return notificationService.markAsRead(notificationId, userId);
    }

    @PatchMapping("/me/read-all")
    public MarkAllAsReadResponse markAllAsRead(@RequestHeader("X-User-Id") String userId) {
        return notificationService.markAllAsRead(userId);
    }

    @GetMapping("/me/unread-count")
    public UnreadCountResponse getUnreadCount(@RequestHeader("X-User-Id") String userId) {
        return notificationService.getUnreadCount(userId);
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable String notificationId,
            @RequestHeader("X-User-Id") String userId
    ) {
        notificationService.deleteNotification(notificationId, userId);
        return ResponseEntity.noContent().build();
    }
}
