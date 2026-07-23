package com.seika.quiz_service.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.quiz_service.config.RabbitMQConfig;
import com.seika.quiz_service.event.QuizSetCreatedEvent;
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

    public void publishQuizSetCreated(String quizSetId, String createdBy, String title, String description, java.math.BigDecimal price) {
        QuizSetCreatedEvent event = QuizSetCreatedEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .quizSetId(quizSetId)
                .createdBy(createdBy)
                .title(title)
                .description(description == null ? "" : description)
                .price(price == null ? java.math.BigDecimal.ZERO : price)
                .build();
        try {
            String message = objectMapper.writeValueAsString(event);
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.CONTENT_EVENTS_EXCHANGE,
                    RabbitMQConfig.QUIZ_SET_CREATED_ROUTING_KEY,
                    message);
            log.info("Published quiz.set.created for quizSetId={} by teacherId={}", quizSetId, createdBy);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize quiz.set.created event for quizSetId={}", quizSetId, e);
        } catch (Exception e) {
            log.error("Failed to publish quiz.set.created event for quizSetId={}", quizSetId, e);
        }
    }

    public void publishQuizSetUpdated(String quizSetId, String createdBy, String title, String description, java.math.BigDecimal price) {
        QuizSetCreatedEvent event = QuizSetCreatedEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .quizSetId(quizSetId)
                .createdBy(createdBy)
                .title(title)
                .description(description == null ? "" : description)
                .price(price == null ? java.math.BigDecimal.ZERO : price)
                .build();
        try {
            String message = objectMapper.writeValueAsString(event);
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.CONTENT_EVENTS_EXCHANGE,
                    "quiz.set.updated",
                    message);
            log.info("Published quiz.set.updated for quizSetId={} by teacherId={}", quizSetId, createdBy);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize quiz.set.updated event for quizSetId={}", quizSetId, e);
        } catch (Exception e) {
            log.error("Failed to publish quiz.set.updated event for quizSetId={}", quizSetId, e);
        }
    }
    public void publishQuizSetConsumed(String quizSetId, String userId) {
        Map<String, Object> event = Map.of(
                "eventId", UUID.randomUUID().toString(),
                "eventType", RabbitMQConfig.QUIZ_SET_CONSUMED_ROUTING_KEY,
                "userId", userId,
                "referenceId", quizSetId,
                "productType", "QUIZ",
                "consumedAt", java.time.Instant.now().toString()
        );
        try {
            String message = objectMapper.writeValueAsString(event);
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.CONTENT_EVENTS_EXCHANGE,
                    RabbitMQConfig.QUIZ_SET_CONSUMED_ROUTING_KEY,
                    message);
            log.info("Published quiz.set.consumed for quizSetId={} userId={}", quizSetId, userId);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize quiz.set.consumed event for quizSetId={}", quizSetId, e);
        } catch (Exception e) {
            log.error("Failed to publish quiz.set.consumed event for quizSetId={}", quizSetId, e);
        }
    }
}


