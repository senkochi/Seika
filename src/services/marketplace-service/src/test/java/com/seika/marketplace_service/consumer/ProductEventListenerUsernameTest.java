package com.seika.marketplace_service.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.marketplace_service.entity.Product;
import com.seika.marketplace_service.repository.ProductRepository;
import com.seika.marketplace_service.repository.UserInventoryRepository;
import com.seika.marketplace_service.service.MarketplaceEscrowSafetyService;
import com.seika.marketplace_service.service.MarketplaceNotificationPublisher;
import com.seika.marketplace_service.service.SellerIdentityProjectionService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.cache.CacheManager;

import java.nio.charset.StandardCharsets;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ProductEventListenerUsernameTest {

    @Test
    void productUsesUsernameFromLocalIdentityProjection() {
        ProductRepository productRepository = mock(ProductRepository.class);
        SellerIdentityProjectionService identityProjectionService =
                mock(SellerIdentityProjectionService.class);
        when(identityProjectionService.findUsername("teacher-1"))
                .thenReturn(Optional.of("lan.nguyen"));
        when(productRepository.save(any(Product.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ProductEventListener listener = new ProductEventListener(
                new ObjectMapper().findAndRegisterModules(),
                productRepository,
                mock(MarketplaceNotificationPublisher.class),
                mock(MarketplaceEscrowSafetyService.class),
                mock(UserInventoryRepository.class),
                mock(CacheManager.class),
                identityProjectionService);

        String json = """
                {
                  "eventId":"event-1",
                  "cardSetId":"card-set-1",
                  "createdBy":"teacher-1",
                  "title":"Animal",
                  "price":100
                }
                """;
        Message message = new Message(
                json.getBytes(StandardCharsets.UTF_8),
                new MessageProperties());

        listener.handleContentCreatedEvent(message, "flashcard.set.created");

        ArgumentCaptor<Product> productCaptor = ArgumentCaptor.forClass(Product.class);
        verify(productRepository).save(productCaptor.capture());
        assertThat(productCaptor.getValue().getTeacherDisplayName())
                .isEqualTo("lan.nguyen");
    }
}
