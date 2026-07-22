package com.seika.marketplace_service.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.marketplace_service.entity.OutboxEvent;
import com.seika.marketplace_service.enums.OutboxStatus;
import com.seika.marketplace_service.repository.OutboxEventRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ContentPurchasedEventPublisherTest {

    @Test
    void purchaseEventIsStoredInTransactionalOutbox() {
        OutboxEventRepository repository = mock(OutboxEventRepository.class);
        when(repository.save(any(OutboxEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
        ContentPurchasedEventPublisher publisher = new ContentPurchasedEventPublisher(
                repository, new ObjectMapper().findAndRegisterModules());

        publisher.publishContentPurchased(
                "order-1",
                "student-1",
                "teacher-1",
                "product-1",
                "FLASHCARD",
                "Deck",
                new BigDecimal("100"));

        ArgumentCaptor<OutboxEvent> captor = ArgumentCaptor.forClass(OutboxEvent.class);
        verify(repository).save(captor.capture());
        OutboxEvent event = captor.getValue();
        assertThat(event.getAggregateType()).isEqualTo("Order");
        assertThat(event.getAggregateId()).isEqualTo("order-1");
        assertThat(event.getEventType()).isEqualTo("content.purchased");
        assertThat(event.getStatus()).isEqualTo(OutboxStatus.PENDING);
        assertThat(event.getPayload())
                .contains("\"orderId\":\"order-1\"")
                .contains("\"productId\":\"product-1\"");
    }
}
