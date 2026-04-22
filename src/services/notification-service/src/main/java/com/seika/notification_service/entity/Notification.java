package com.seika.notification_service.entity;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "notifications")
@CompoundIndex(name = "idx_user_status_created", def = "{'userId': 1, 'status': 1, 'createdAt': -1}")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Notification {

    @Id
    String id;

    @Indexed
    String userId;

    NotificationType type;

    NotificationChannel channel;

    NotificationStatus status;

    String title;

    String content;

    @Indexed(unique = true, sparse = true)
    String eventId;

    Instant readAt;

    @Indexed
    Instant createdAt;
}
