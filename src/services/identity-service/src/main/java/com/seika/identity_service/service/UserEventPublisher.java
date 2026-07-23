package com.seika.identity_service.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.identity_service.entity.User;
import com.seika.identity_service.event.UserRegisteredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserEventPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    @Value("${messaging.events.identity-exchange:identity.events}")
    private String identityEventsExchange;

    @Value("${messaging.events.user-registered-routing-key:user.registered}")
    private String userRegisteredRoutingKey;

    @Value("${messaging.events.public-identity-snapshot-routing-key:user.public-identity.snapshot}")
    private String publicIdentitySnapshotRoutingKey;

    public void publishUserRegistered(User user) {
        UserRegisteredEvent event = UserRegisteredEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType("user.registered")
                .occurredAt(Instant.now())
                .userId(user.getId())
                .payload(Map.of(
                        "username", user.getUsername(),
                        "roles", extractRoles(user)
                ))
                .build();

        try {
            String message = objectMapper.writeValueAsString(event);
            rabbitTemplate.convertAndSend(identityEventsExchange, userRegisteredRoutingKey, message);
            log.info("Published user.registered event for userId={} to exchange={} with routingKey={}",
                    user.getId(), identityEventsExchange, userRegisteredRoutingKey);
        } catch (JsonProcessingException exception) {
            log.error("Failed to serialize user.registered event for userId={}", user.getId(), exception);
        } catch (Exception exception) {
            log.error("Failed to publish user.registered event for userId={}", user.getId(), exception);
        }
    }

    public void publishPublicIdentitySnapshot(User user) {
        UserRegisteredEvent event = UserRegisteredEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType("user.public-identity.snapshot")
                .occurredAt(Instant.now())
                .userId(user.getId())
                .payload(Map.of("username", user.getUsername()))
                .build();

        try {
            String message = objectMapper.writeValueAsString(event);
            rabbitTemplate.convertAndSend(
                    identityEventsExchange,
                    publicIdentitySnapshotRoutingKey,
                    message);
            log.info(
                    "Published public identity snapshot for userId={} to exchange={} with routingKey={}",
                    user.getId(),
                    identityEventsExchange,
                    publicIdentitySnapshotRoutingKey);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Could not serialize public identity snapshot", exception);
        } catch (Exception exception) {
            throw new IllegalStateException("Could not publish public identity snapshot", exception);
        }
    }

    private List<String> extractRoles(User user) {
        if (user.getRoles() == null) {
            return List.of();
        }
        return user.getRoles().stream().map(role -> role.getName()).toList();
    }
}
