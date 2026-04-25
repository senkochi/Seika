package com.seika.notification_service.dto;

import com.seika.notification_service.entity.NotificationChannel;
import com.seika.notification_service.entity.NotificationStatus;
import com.seika.notification_service.entity.NotificationType;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class NotificationResponse {
    String id;
    String userId;
    NotificationType type;
    NotificationChannel channel;
    NotificationStatus status;
    String title;
    String content;
    String eventId;
    Instant readAt;
    Instant createdAt;
}
