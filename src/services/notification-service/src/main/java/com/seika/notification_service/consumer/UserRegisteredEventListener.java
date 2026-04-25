package com.seika.notification_service.consumer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.notification_service.dto.CreateNotificationRequest;
import com.seika.notification_service.entity.NotificationChannel;
import com.seika.notification_service.entity.NotificationType;
import com.seika.notification_service.event.UserRegisteredEvent;
import com.seika.notification_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserRegisteredEventListener {

    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @RabbitListener(queues = "${messaging.events.user-registered-queue:notification.user-events}")
    public void handleUserRegistered(String rawMessage) {
        try {
            UserRegisteredEvent event = objectMapper.readValue(rawMessage, UserRegisteredEvent.class);

            if (event.getUserId() == null || event.getUserId().isBlank()) {
                log.warn("Skipped user.registered event because userId is empty. eventId={}", event.getEventId());
                return;
            }

            String username = extractUsername(event.getPayload());

            CreateNotificationRequest request = CreateNotificationRequest.builder()
                    .userId(event.getUserId())
                    .eventId(event.getEventId())
                    .type(NotificationType.SYSTEM)
                    .channel(NotificationChannel.IN_APP)
                    .title("Welcome to Seika")
                    .content(buildWelcomeContent(username))
                    .build();

            notificationService.createNotification(request);
            log.info("Consumed user.registered event and created notification for userId={}, eventId={}",
                    event.getUserId(), event.getEventId());
        } catch (JsonProcessingException exception) {
            log.error("Failed to deserialize user.registered message. payload={}", rawMessage, exception);
        } catch (Exception exception) {
            log.error("Failed to process user.registered message. payload={}", rawMessage, exception);
        }
    }

    private String extractUsername(Map<String, Object> payload) {
        if (payload == null) {
            return "there";
        }

        Object username = payload.get("username");
        if (username == null) {
            return "there";
        }

        String value = String.valueOf(username).trim();
        return value.isEmpty() ? "there" : value;
    }

    private String buildWelcomeContent(String username) {
        return "Hi " + username + ", your account has been created successfully.";
    }
}
