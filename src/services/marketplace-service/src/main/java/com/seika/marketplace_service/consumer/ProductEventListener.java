package com.seika.marketplace_service.consumer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.marketplace_service.entity.Product;
import com.seika.marketplace_service.enums.ProductStatus;
import com.seika.marketplace_service.enums.ProductType;
import com.seika.marketplace_service.event.FlashcardSetCreatedEvent;
import com.seika.marketplace_service.event.QuizSetCreatedEvent;
import com.seika.marketplace_service.repository.ProductRepository;
import com.seika.marketplace_service.service.MarketplaceNotificationPublisher;
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
    private final MarketplaceNotificationPublisher notificationPublisher;

    @RabbitListener(queues = "${messaging.events.marketplace-content-queue:marketplace.content-events}")
    public void handleContentCreatedEvent(String rawMessage, @Header(AmqpHeaders.RECEIVED_ROUTING_KEY) String routingKey) {
        try {
            if ("flashcard.set.created".equals(routingKey)) {
                FlashcardSetCreatedEvent event = objectMapper.readValue(rawMessage, FlashcardSetCreatedEvent.class);
                saveProduct(event.getCardSetId(), ProductType.FLASHCARD, event.getTitle(), event.getDescription(), event.getPrice(), event.getCreatedBy());
            } else if ("quiz.set.created".equals(routingKey)) {
                QuizSetCreatedEvent event = objectMapper.readValue(rawMessage, QuizSetCreatedEvent.class);
                saveProduct(event.getQuizSetId(), ProductType.QUIZ, event.getTitle(), event.getDescription(), event.getPrice(), event.getCreatedBy());
            } else if ("flashcard.set.updated".equals(routingKey)) {
                FlashcardSetCreatedEvent event = objectMapper.readValue(rawMessage, FlashcardSetCreatedEvent.class);
                updateProduct(event.getCardSetId(), ProductType.FLASHCARD, event.getTitle(), event.getDescription(), event.getPrice());
            } else if ("quiz.set.updated".equals(routingKey)) {
                QuizSetCreatedEvent event = objectMapper.readValue(rawMessage, QuizSetCreatedEvent.class);
                updateProduct(event.getQuizSetId(), ProductType.QUIZ, event.getTitle(), event.getDescription(), event.getPrice());
            }
        } catch (JsonProcessingException exception) {
            log.error("Failed to deserialize content event. routingKey={}, payload={}", routingKey, rawMessage, exception);
        } catch (Exception exception) {
            log.error("Failed to process content event. routingKey={}, payload={}", routingKey, rawMessage, exception);
            throw exception;
        }
    }

    private void updateProduct(String referenceId, ProductType type, String title, String description, BigDecimal price) {
        java.util.Optional<Product> optionalProduct = productRepository.findByReferenceIdAndType(referenceId, type);
        if (optionalProduct.isPresent()) {
            Product product = optionalProduct.get();
            product.setName(title == null ? "Untitled" : title);
            product.setDescription(description);
            product.setPrice(price == null ? BigDecimal.ZERO : price);
            product.setActive(false);
            product.setStatus(ProductStatus.PENDING_REVIEW);
            product.setRejectionReason(null);
            productRepository.save(product);
            log.info("Updated product to pending review in marketplace: type={}, referenceId={}", type, referenceId);
        } else {
            log.warn("Product to update not found: type={}, referenceId={}", type, referenceId);
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
                .active(false)                                     // chỉ active=true khi admin duyệt
                .status(ProductStatus.PENDING_REVIEW)             // cần admin duyệt
                .build();
        Product saved = productRepository.save(product);
        log.info("Saved new product to marketplace: type={}, referenceId={}, price={}", type, referenceId, saved.getPrice());
        notificationPublisher.publishContentCreated(saved.getId(), saved.getName(), saved.getType().name(), saved.getSellerUserId());
    }
}
