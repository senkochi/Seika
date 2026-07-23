package com.seika.marketplace_service.consumer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.marketplace_service.entity.Product;
import com.seika.marketplace_service.enums.ProductStatus;
import com.seika.marketplace_service.enums.ProductType;
import com.seika.marketplace_service.event.FlashcardSetCreatedEvent;
import com.seika.marketplace_service.event.QuizSetCreatedEvent;
import com.seika.marketplace_service.event.ContentConsumedEvent;
import com.seika.marketplace_service.repository.ProductRepository;
import com.seika.marketplace_service.repository.UserInventoryRepository;
import com.seika.marketplace_service.service.MarketplaceEscrowSafetyService;
import com.seika.marketplace_service.service.MarketplaceNotificationPublisher;
import com.seika.marketplace_service.service.SellerIdentityProjectionService;
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
    private final MarketplaceEscrowSafetyService escrowSafetyService;
    private final UserInventoryRepository userInventoryRepository;
    private final org.springframework.cache.CacheManager cacheManager;
    private final SellerIdentityProjectionService identityProjectionService;

    @RabbitListener(queues = "${messaging.events.marketplace-content-queue:marketplace.content-events}")
    public void handleContentCreatedEvent(org.springframework.amqp.core.Message message, @Header(AmqpHeaders.RECEIVED_ROUTING_KEY) String routingKey) {
        String messageBody = new String(message.getBody(), java.nio.charset.StandardCharsets.UTF_8);
        String rawMessage = messageBody;
        try {
            rawMessage = unwrapJsonString(messageBody);
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
            } else if ("flashcard.set.consumed".equals(routingKey) || "quiz.set.consumed".equals(routingKey)) {
                ContentConsumedEvent event = objectMapper.readValue(rawMessage, ContentConsumedEvent.class);
                markConsumed(event, routingKey.startsWith("flashcard") ? ProductType.FLASHCARD : ProductType.QUIZ);
            }
        } catch (JsonProcessingException exception) {
            log.error("Failed to deserialize content event. routingKey={}, payload={}", routingKey, rawMessage, exception);
        } catch (Exception exception) {
            log.error("Failed to process content event. routingKey={}, payload={}", routingKey, rawMessage, exception);
            throw exception;
        }
    }

    private String unwrapJsonString(String messageBody) throws JsonProcessingException {
        JsonNode root = objectMapper.readTree(messageBody);
        return root != null && root.isTextual() ? root.textValue() : messageBody;
    }

    private void markConsumed(ContentConsumedEvent event, ProductType type) {
        if (event.getUserId() == null || event.getUserId().isBlank()) {
            return;
        }
        java.util.Optional<Product> product = java.util.Optional.empty();
        if (event.getProductId() != null && !event.getProductId().isBlank()) {
            product = productRepository.findById(event.getProductId());
        }
        if (product.isEmpty() && event.getReferenceId() != null && !event.getReferenceId().isBlank()) {
            product = productRepository.findByReferenceIdAndType(event.getReferenceId(), type);
        }
        product.ifPresent(p -> userInventoryRepository.findByUserIdAndProductIdAndActiveTrue(event.getUserId(), p.getId())
                .ifPresent(inventory -> {
                    if (inventory.getConsumedAt() == null) {
                        inventory.setConsumedAt(event.getConsumedAt() == null ? java.time.Instant.now() : event.getConsumedAt());
                        userInventoryRepository.save(inventory);
                    }
                }));
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
            escrowSafetyService.markHeldItemsPendingDecision(product.getId(), "content_edit_by_teacher");
            evictProductCaches();
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

        String teacherUsername = identityProjectionService.findUsername(sellerId).orElse(null);

        Product product = Product.builder()
                .referenceId(referenceId)
                .type(type)
                .name(title == null ? "Untitled" : title)
                .description(description)
                .price(price == null ? BigDecimal.ZERO : price)
                .sellerUserId(sellerId)
                .teacherDisplayName(teacherUsername)
                .active(false)                                     // chỉ active=true khi admin duyệt
                .status(ProductStatus.PENDING_REVIEW)             // cần admin duyệt
                .build();
        Product saved = productRepository.save(product);
        evictProductCaches();
        log.info("Saved new product to marketplace: type={}, referenceId={}, price={}", type, referenceId, saved.getPrice());
        notificationPublisher.publishContentCreated(saved.getId(), saved.getName(), saved.getType().name(), saved.getSellerUserId());
    }

    private void evictProductCaches() {
        if (cacheManager != null) {
            org.springframework.cache.Cache activeCache = cacheManager.getCache("marketplace:products:active");
            if (activeCache != null) activeCache.clear();
            org.springframework.cache.Cache detailCache = cacheManager.getCache("marketplace:products:detail");
            if (detailCache != null) detailCache.clear();
        }
    }
}


