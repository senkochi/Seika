package com.seika.marketplace_service.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.marketplace_service.entity.OutboxEvent;
import com.seika.marketplace_service.enums.OutboxStatus;
import com.seika.marketplace_service.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContentPurchasedEventPublisher {

    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    public void publishContentPurchased(String orderId, String buyerUserId, String teacherUserId,
                                        String productId, String productType, String productName, java.math.BigDecimal price) {
        Map<String, Object> event = new HashMap<>();
        event.put("eventId", UUID.randomUUID().toString());
        event.put("orderId", orderId);
        event.put("buyerUserId", buyerUserId);
        event.put("teacherUserId", teacherUserId);
        event.put("productId", productId);
        event.put("productType", productType);
        event.put("productName", productName != null ? productName : "");
        event.put("price", price == null ? java.math.BigDecimal.ZERO : price);

        try {
            outboxEventRepository.save(OutboxEvent.builder()
                    .aggregateType("Order")
                    .aggregateId(orderId)
                    .eventType("content.purchased")
                    .payload(objectMapper.writeValueAsString(event))
                    .status(OutboxStatus.PENDING)
                    .retryCount(0)
                    .build());
            log.info("Queued content.purchased in outbox for orderId={} teacherId={}", orderId, teacherUserId);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException(
                    "Failed to serialize content.purchased event for orderId=" + orderId,
                    exception);
        }
    }
}

