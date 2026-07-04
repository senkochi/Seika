package com.seika.marketplace_service.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.marketplace_service.config.RabbitMQConfig;
import com.seika.marketplace_service.event.ContentCreatedEvent;
import com.seika.marketplace_service.event.ContentReviewedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MarketplaceNotificationPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    public void publishContentReviewed(String productId, String productName, String productType,
                                       String teacherUserId, String status, String rejectionReason) {
        ContentReviewedEvent event = ContentReviewedEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .productId(productId)
                .productName(productName != null ? productName : "")
                .productType(productType)
                .teacherUserId(teacherUserId)
                .status(status)
                .rejectionReason(rejectionReason)
                .build();
        try {
            String message = objectMapper.writeValueAsString(event);
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.MARKETPLACE_EVENTS_EXCHANGE,
                    "content.reviewed",
                    message);
            log.info("Published content.reviewed event for productId={}, status={}, teacherUserId={}", productId, status, teacherUserId);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize content.reviewed event for productId={}", productId, e);
        } catch (Exception e) {
            log.error("Failed to publish content.reviewed event for productId={}", productId, e);
        }
    }

    public void publishContentCreated(String productId, String productName, String productType,
                                      String teacherUserId) {
        ContentCreatedEvent event = ContentCreatedEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .productId(productId)
                .productName(productName != null ? productName : "")
                .productType(productType)
                .teacherUserId(teacherUserId)
                .build();
        try {
            String message = objectMapper.writeValueAsString(event);
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.MARKETPLACE_EVENTS_EXCHANGE,
                    "content.created",
                    message);
            log.info("Published content.created event for productId={}, type={}, teacherUserId={}", productId, productType, teacherUserId);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize content.created event for productId={}", productId, e);
        } catch (Exception e) {
            log.error("Failed to publish content.created event for productId={}", productId, e);
        }
    }
}
