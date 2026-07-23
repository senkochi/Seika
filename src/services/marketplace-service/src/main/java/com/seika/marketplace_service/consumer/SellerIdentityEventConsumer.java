package com.seika.marketplace_service.consumer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.marketplace_service.service.SellerIdentityProjectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class SellerIdentityEventConsumer {

    private final ObjectMapper objectMapper;
    private final SellerIdentityProjectionService projectionService;

    @RabbitListener(
            queues = "${messaging.events.marketplace-identity-queue:marketplace.identity-events}")
    public void handle(String rawMessage) {
        try {
            JsonNode event = readEvent(rawMessage);
            String userId = event.path("userId").asText(null);
            String username = event.path("payload").path("username").asText(null);
            if (userId == null || userId.isBlank() || username == null || username.isBlank()) {
                log.warn("Ignored public identity event without userId or username");
                return;
            }
            projectionService.sync(userId, username);
        } catch (JsonProcessingException exception) {
            log.error("Failed to deserialize public identity event", exception);
        } catch (IllegalArgumentException exception) {
            log.warn("Ignored invalid public identity event: {}", exception.getMessage());
        }
    }

    private JsonNode readEvent(String rawMessage) throws JsonProcessingException {
        JsonNode root = objectMapper.readTree(rawMessage);
        if (root != null && root.isTextual()) {
            return objectMapper.readTree(root.textValue());
        }
        return root;
    }
}
