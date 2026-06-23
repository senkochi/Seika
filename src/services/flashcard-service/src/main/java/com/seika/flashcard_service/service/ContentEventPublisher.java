package com.seika.flashcard_service.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.flashcard_service.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContentEventPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    public void publishFlashcardSetCreated(String cardSetId, String createdBy) {
        Map<String, String> event = Map.of(
                "eventId", UUID.randomUUID().toString(),
                "cardSetId", cardSetId,
                "createdBy", createdBy
        );
        try {
            String message = objectMapper.writeValueAsString(event);
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.CONTENT_EVENTS_EXCHANGE,
                    RabbitMQConfig.FLASHCARD_SET_CREATED_ROUTING_KEY,
                    message);
            log.info("Published flashcard.set.created for cardSetId={} by teacherId={}", cardSetId, createdBy);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize flashcard.set.created event for cardSetId={}", cardSetId, e);
        } catch (Exception e) {
            log.error("Failed to publish flashcard.set.created event for cardSetId={}", cardSetId, e);
        }
    }
}

