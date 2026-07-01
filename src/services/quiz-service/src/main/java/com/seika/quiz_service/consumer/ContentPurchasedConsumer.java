package com.seika.quiz_service.consumer;

import com.seika.quiz_service.config.RabbitMQConfig;
import com.seika.quiz_service.domain.ProductSales;
import com.seika.quiz_service.repository.ProductSalesRepository;
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
 * marketplace-service whenever a student buys a QuizSet (or CardSet). We only
 * persist rows for {@code productType = QUIZ_SET} so teacher Statistics can
 * compute top-selling and revenue locally without Feign calls.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ContentPurchasedConsumer {

    private static final String QUIZ_SET_PRODUCT_TYPE = "QUIZ_SET";
    private static final String QUEUE_NAME = "quiz.marketplace.purchases";

    private final ProductSalesRepository productSalesRepository;

    @RabbitListener(queues = QUEUE_NAME)
    public void onContentPurchased(Map<String, Object> event) {
        try {
            String productType = stringValue(event, "productType");
            if (!QUIZ_SET_PRODUCT_TYPE.equalsIgnoreCase(productType)) {
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
            log.info("Recorded purchase for QuizSet {} by buyer {} (teacher {})",
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

    /**
     * Declare the queue + binding for the marketplace events exchange. Lives
     * inside the consumer class so we avoid creating yet another @Configuration.
     */
    @Configuration
    static class MarketplaceEventsBinding {

        @Bean
        public TopicExchange marketplaceEventsExchange() {
            return new TopicExchange(RabbitMQConfig.MARKETPLACE_EVENTS_EXCHANGE_NAME, true, false);
        }

        @Bean
        public Queue quizMarketplacePurchasesQueue() {
            return new Queue(QUEUE_NAME, true);
        }

        @Bean
        public Binding quizMarketplacePurchasesBinding(Queue quizMarketplacePurchasesQueue,
                                                       TopicExchange marketplaceEventsExchange) {
            return BindingBuilder.bind(quizMarketplacePurchasesQueue)
                    .to(marketplaceEventsExchange)
                    .with("content.purchased");
        }
    }
}