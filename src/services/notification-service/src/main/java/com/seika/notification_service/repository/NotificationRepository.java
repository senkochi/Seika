package com.seika.notification_service.repository;

import com.seika.notification_service.entity.Notification;
import com.seika.notification_service.entity.NotificationStatus;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends MongoRepository<Notification, String> {

    Optional<Notification> findByEventId(String eventId);

    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);

    List<Notification> findByUserIdAndStatus(String userId, NotificationStatus status);

    long countByUserIdAndStatus(String userId, NotificationStatus status);
}
