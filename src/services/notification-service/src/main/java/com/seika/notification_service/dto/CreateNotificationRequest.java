package com.seika.notification_service.dto;

import com.seika.notification_service.entity.NotificationChannel;
import com.seika.notification_service.entity.NotificationType;
import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateNotificationRequest {
    @NotBlank(message = "userId is required")
    String userId;

    NotificationType type;

    NotificationChannel channel;

    @NotBlank(message = "title is required")
    String title;

    @NotBlank(message = "content is required")
    String content;

    String eventId;
}
