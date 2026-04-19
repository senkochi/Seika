package com.seika.notification_service.controller;

import com.seika.notification_service.dto.CreateNotificationRequest;
import com.seika.notification_service.dto.MarkAllAsReadResponse;
import com.seika.notification_service.dto.NotificationResponse;
import com.seika.notification_service.dto.UnreadCountResponse;
import jakarta.validation.Valid;
import com.seika.notification_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public NotificationResponse createNotification(@Valid @RequestBody CreateNotificationRequest request) {
        return notificationService.createNotification(request);
    }

    @GetMapping("/users/{userId}")
    public List<NotificationResponse> getNotificationsByUser(@PathVariable String userId) {
        return notificationService.getNotificationsByUser(userId);
    }

    @PatchMapping("/{notificationId}/read")
    public NotificationResponse markAsRead(@PathVariable String notificationId) {
        return notificationService.markAsRead(notificationId);
    }

    @PatchMapping("/users/{userId}/read-all")
    public MarkAllAsReadResponse markAllAsRead(@PathVariable String userId) {
        return notificationService.markAllAsRead(userId);
    }

    @GetMapping("/users/{userId}/unread-count")
    public UnreadCountResponse getUnreadCount(@PathVariable String userId) {
        return notificationService.getUnreadCount(userId);
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> deleteNotification(@PathVariable String notificationId) {
        notificationService.deleteNotification(notificationId);
        return ResponseEntity.noContent().build();
    }
}
