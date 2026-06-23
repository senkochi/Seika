package com.seika.marketplace_service.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.marketplace_service.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContentPurchasedEventPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    public void publishContentPurchased(String orderId, String buyerUserId, String teacherUserId,
                                        String productId, String productType) {
        Map<String, String> event = new HashMap<>();
        event.put("eventId", UUID.randomUUID().toString());
        event.put("orderId", orderId);
        event.put("buyerUserId", buyerUserId);
        event.put("teacherUserId", teacherUserId);
        event.put("productId", productId);
        event.put("productType", productType);

        try {
            String message = objectMapper.writeValueAsString(event);
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.MARKETPLACE_EVENTS_EXCHANGE,
                    RabbitMQConfig.CONTENT_PURCHASED_ROUTING_KEY,
                    message);
            log.info("Published content.purchased for orderId={} teacherId={}", orderId, teacherUserId);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize content.purchased event for orderId={}", orderId, e);
        } catch (Exception e) {
            log.error("Failed to publish content.purchased event for orderId={}", orderId, e);
        }
    }
}

