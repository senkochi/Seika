package com.seika.marketplace_service.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.marketplace_service.entity.Product;
import com.seika.marketplace_service.enums.ProductStatus;
import com.seika.marketplace_service.enums.ProductType;
import com.seika.marketplace_service.repository.ProductRepository;
import com.seika.marketplace_service.repository.UserInventoryRepository;
import com.seika.marketplace_service.service.MarketplaceEscrowSafetyService;
import com.seika.marketplace_service.service.MarketplaceNotificationPublisher;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ProductEventListenerTest {

    @Test
    void handleFlashcardCreatedAcceptsJsonStringProducedByRabbitConverter() {
        ProductRepository productRepository = mock(ProductRepository.class);
        MarketplaceNotificationPublisher notificationPublisher = mock(MarketplaceNotificationPublisher.class);
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product product = invocation.getArgument(0);
            product.setId("product-1");
            return product;
        });

        ProductEventListener listener = new ProductEventListener(
                new ObjectMapper().findAndRegisterModules(),
                productRepository,
                notificationPublisher,
                mock(MarketplaceEscrowSafetyService.class),
                mock(UserInventoryRepository.class)
        );

        String eventJson = """
                {
                  "eventId":"event-1",
                  "cardSetId":"card-set-1",
                  "createdBy":"teacher-1",
                  "title":"Animal",
                  "description":"Dong vat",
                  "price":100
                }
                """;
        Message message = new JacksonJsonMessageConverter()
                .toMessage(eventJson, new MessageProperties());

        listener.handleContentCreatedEvent(message, "flashcard.set.created");

        ArgumentCaptor<Product> productCaptor = ArgumentCaptor.forClass(Product.class);
        verify(productRepository).save(productCaptor.capture());
        Product product = productCaptor.getValue();
        assertThat(product.getReferenceId()).isEqualTo("card-set-1");
        assertThat(product.getType()).isEqualTo(ProductType.FLASHCARD);
        assertThat(product.getName()).isEqualTo("Animal");
        assertThat(product.getPrice()).isEqualByComparingTo(BigDecimal.valueOf(100));
        assertThat(product.getSellerUserId()).isEqualTo("teacher-1");
        assertThat(product.getStatus()).isEqualTo(ProductStatus.PENDING_REVIEW);
        assertThat(product.isActive()).isFalse();
        verify(notificationPublisher).publishContentCreated(
                "product-1", "Animal", "FLASHCARD", "teacher-1");
    }
}
