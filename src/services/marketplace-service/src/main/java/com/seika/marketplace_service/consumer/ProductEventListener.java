package com.seika.marketplace_service.consumer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.marketplace_service.entity.Product;
import com.seika.marketplace_service.enums.ProductType;
import com.seika.marketplace_service.event.FlashcardSetCreatedEvent;
import com.seika.marketplace_service.event.QuizSetCreatedEvent;
import com.seika.marketplace_service.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProductEventListener {

    private final ObjectMapper objectMapper;
    private final ProductRepository productRepository;

    @RabbitListener(queues = "${messaging.events.marketplace-content-queue:marketplace.content-events}")
    public void handleContentCreatedEvent(String rawMessage, @Header(AmqpHeaders.RECEIVED_ROUTING_KEY) String routingKey) {
        try {
            if ("flashcard.set.created".equals(routingKey)) {
                FlashcardSetCreatedEvent event = objectMapper.readValue(rawMessage, FlashcardSetCreatedEvent.class);
                saveProduct(event.getCardSetId(), ProductType.FLASHCARD, event.getTitle(), event.getDescription(), event.getPrice(), event.getCreatedBy());
            } else if ("quiz.set.created".equals(routingKey)) {
                QuizSetCreatedEvent event = objectMapper.readValue(rawMessage, QuizSetCreatedEvent.class);
                saveProduct(event.getQuizSetId(), ProductType.QUIZ, event.getTitle(), event.getDescription(), event.getPrice(), event.getCreatedBy());
            }
        } catch (JsonProcessingException exception) {
            log.error("Failed to deserialize content event. routingKey={}, payload={}", routingKey, rawMessage, exception);
        } catch (Exception exception) {
            log.error("Failed to process content event. routingKey={}, payload={}", routingKey, rawMessage, exception);
            throw exception;
        }
    }

    private void saveProduct(String referenceId, ProductType type, String title, String description, BigDecimal price, String sellerId) {
        if (productRepository.existsByReferenceIdAndType(referenceId, type)) {
            log.info("Product already exists for type={}, referenceId={}", type, referenceId);
            return;
        }

        Product product = Product.builder()
                .referenceId(referenceId)
                .type(type)
                .name(title == null ? "Untitled" : title)
                .description(description)
                .price(price == null ? BigDecimal.ZERO : price)
                .sellerUserId(sellerId)
                .active(true)
                .build();
        productRepository.save(product);
        log.info("Saved new product to marketplace: type={}, referenceId={}, price={}", type, referenceId, product.getPrice());
    }
}
