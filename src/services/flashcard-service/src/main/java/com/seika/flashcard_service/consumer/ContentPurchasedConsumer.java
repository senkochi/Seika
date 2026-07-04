package com.seika.flashcard_service.consumer;

import com.seika.flashcard_service.config.RabbitMQConfig;
import com.seika.flashcard_service.domain.ProductSales;
import com.seika.flashcard_service.repository.ProductSalesRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Consumes {@code marketplace.events / content.purchased} events emitted by
 * marketplace-service. Only {@code productType = CARD_SET} rows are persisted
 * locally so teacher Statistics endpoints can compute top-selling card sets
 * and revenue without crossing service boundaries.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ContentPurchasedConsumer {

    private static final String CARD_SET_PRODUCT_TYPE = "CARD_SET";
    private static final String QUEUE_NAME = "flashcard.marketplace.purchases";

    private final ProductSalesRepository productSalesRepository;

    @RabbitListener(queues = QUEUE_NAME)
    public void onContentPurchased(Map<String, Object> event) {
        try {
            String productType = stringValue(event, "productType");
            if (!CARD_SET_PRODUCT_TYPE.equalsIgnoreCase(productType)) {
                return;
            }

            BigDecimal price = bigDecimalValue(event, "price");

            ProductSales sale = ProductSales.builder()
                    .id(UUID.randomUUID().toString())
                    .orderId(stringValue(event, "orderId"))
                    .buyerUserId(stringValue(event, "buyerUserId"))
                    .teacherUserId(stringValue(event, "teacherUserId"))
                    .productId(stringValue(event, "productId"))
                    .productType(productType)
                    .price(price)
                    .purchasedAt(Instant.now())
                    .build();

            productSalesRepository.save(sale);
            log.info("Recorded purchase for CardSet {} by buyer {} (teacher {})",
                    sale.getProductId(), sale.getBuyerUserId(), sale.getTeacherUserId());
        } catch (Exception ex) {
            log.error("Failed to process content.purchased event: {}", event, ex);
        }
    }

    private static String stringValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value == null ? null : value.toString();
    }

    private static BigDecimal bigDecimalValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal bd) {
            return bd;
        }
        if (value instanceof Number n) {
            return BigDecimal.valueOf(n.doubleValue());
        }
        try {
            return new BigDecimal(value.toString());
        } catch (NumberFormatException ex) {
            return BigDecimal.ZERO;
        }
    }

    @Configuration
    static class MarketplaceEventsBinding {

        @Bean
        public TopicExchange marketplaceEventsExchange() {
            return new TopicExchange(RabbitMQConfig.MARKETPLACE_EVENTS_EXCHANGE, true, false);
        }

        @Bean
        public Queue flashcardMarketplacePurchasesQueue() {
            return new Queue(QUEUE_NAME, true);
        }

        @Bean
        public Binding flashcardMarketplacePurchasesBinding(Queue flashcardMarketplacePurchasesQueue,
                                                            TopicExchange marketplaceEventsExchange) {
            return BindingBuilder.bind(flashcardMarketplacePurchasesQueue)
                    .to(marketplaceEventsExchange)
                    .with("content.purchased");
        }
    }
}