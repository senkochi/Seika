package com.seika.notification_service.service;

import com.seika.notification_service.dto.CreateNotificationRequest;
import com.seika.notification_service.dto.MarkAllAsReadResponse;
import com.seika.notification_service.dto.NotificationResponse;
import com.seika.notification_service.dto.UnreadCountResponse;
import com.seika.notification_service.entity.Notification;
import com.seika.notification_service.entity.NotificationChannel;
import com.seika.notification_service.entity.NotificationStatus;
import com.seika.notification_service.entity.NotificationType;
import com.seika.notification_service.exception.BadRequestException;
import com.seika.notification_service.exception.ResourceNotFoundException;
import com.seika.notification_service.mapper.NotificationMapper;
import com.seika.notification_service.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService { 

    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;

    // @Transactional (MongoDB đang ở chế độ standalone - do đang local, không hỗ trợ transaction, khi nào deploy lên cluster thì sẽ bật lại)
    public NotificationResponse createNotification(CreateNotificationRequest request) {
        if (isBlank(request.getUserId())) {
            throw new BadRequestException("userId is required");
        }
        if (isBlank(request.getTitle())) {
            throw new BadRequestException("title is required");
        }
        if (isBlank(request.getContent())) {
            throw new BadRequestException("content is required");
        }

        if (!isBlank(request.getEventId())) {
            Notification existing = notificationRepository.findByEventId(request.getEventId()).orElse(null);
            if (existing != null) {
                return notificationMapper.toResponse(existing);
            }
        }

        NotificationType type = request.getType() == null ? NotificationType.SYSTEM : request.getType();
        NotificationChannel channel = request.getChannel() == null ? NotificationChannel.IN_APP : request.getChannel();

        Notification notification = notificationMapper.toEntity(request);

        notification.setType(type);
        notification.setChannel(channel);
        notification.setStatus(resolveInitialStatus(channel));
        notification.setCreatedAt(Instant.now());

        Notification saved = notificationRepository.save(notification);
        return notificationMapper.toResponse(saved);
    }

    public Page<NotificationResponse> getNotificationsByUser(String userId, int page, int size) {
        if (isBlank(userId)) {
            throw new BadRequestException("userId is required");
        }
        if (page < 0) {
            throw new BadRequestException("page must be greater than or equal to 0");
        }
        if (size <= 0) {
            throw new BadRequestException("size must be greater than 0");
        }

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        return notificationRepository.findByUserId(userId, pageRequest)
                .map(notificationMapper::toResponse);
    }

    // @Transactional (MongoDB đang ở chế độ standalone - do đang local, không hỗ trợ transaction, khi nào deploy lên cluster thì sẽ bật lại)
    public NotificationResponse markAsRead(String notificationId, String userId) {
        if (isBlank(userId)) {
            throw new BadRequestException("userId is required");
        }

        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        notification.setStatus(NotificationStatus.READ);
        notification.setReadAt(Instant.now());

        Notification saved = notificationRepository.save(notification);
        return notificationMapper.toResponse(saved);
    }

    // @Transactional (MongoDB đang ở chế độ standalone - do đang local, không hỗ trợ transaction, khi nào deploy lên cluster thì sẽ bật lại)
    public MarkAllAsReadResponse markAllAsRead(String userId) {
        if (isBlank(userId)) {
            throw new BadRequestException("userId is required");
        }

        List<Notification> unreadNotifications = notificationRepository.findByUserIdAndStatus(userId, NotificationStatus.UNREAD);
        Instant readAt = Instant.now();

        unreadNotifications.forEach(notification -> {
            notification.setStatus(NotificationStatus.READ);
            notification.setReadAt(readAt);
        });

        if (!unreadNotifications.isEmpty()) {
            notificationRepository.saveAll(unreadNotifications);
        }

        return MarkAllAsReadResponse.builder()
                .userId(userId)
                .updatedCount(unreadNotifications.size())
                .build();
    }

    public UnreadCountResponse getUnreadCount(String userId) {
        if (isBlank(userId)) {
            throw new BadRequestException("userId is required");
        }

        long unreadCount = notificationRepository.countByUserIdAndStatus(userId, NotificationStatus.UNREAD);
        return UnreadCountResponse.builder()
                .userId(userId)
                .unreadCount(unreadCount)
                .build();
    }

    // @Transactional (MongoDB đang ở chế độ standalone - do đang local, không hỗ trợ transaction, khi nào deploy lên cluster thì sẽ bật lại)
    public void deleteNotification(String notificationId, String userId) {
        if (isBlank(userId)) {
            throw new BadRequestException("userId is required");
        }

        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        notificationRepository.delete(notification);
    }

    private NotificationStatus resolveInitialStatus(NotificationChannel channel) {
        if (channel == NotificationChannel.EMAIL) {
            return NotificationStatus.SENT;
        }
        return NotificationStatus.UNREAD;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
