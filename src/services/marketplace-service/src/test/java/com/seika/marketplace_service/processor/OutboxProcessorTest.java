package com.seika.marketplace_service.processor;

import com.seika.marketplace_service.config.RabbitMQConfig;
import com.seika.marketplace_service.entity.OutboxEvent;
import com.seika.marketplace_service.enums.OutboxStatus;
import com.seika.marketplace_service.repository.OutboxEventRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.util.List;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class OutboxProcessorTest {

    @Test
    void walletCommandEventsStillPublishToWalletCommandsExchange() {
        OutboxEventRepository repository = mock(OutboxEventRepository.class);
        RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
        OutboxProcessor processor = new OutboxProcessor(repository, rabbitTemplate);
        OutboxEvent event = OutboxEvent.builder()
                .eventType("wallet.credit.requested")
                .payload("{}")
                .status(OutboxStatus.PENDING)
                .build();
        when(repository.claimNextPendingBatch(org.mockito.ArgumentMatchers.eq(50), any(Instant.class)))
                .thenReturn(List.of(event));

        processor.publishOutboxEvents();

        verify(rabbitTemplate).convertAndSend(
                RabbitMQConfig.WALLET_COMMANDS_EXCHANGE,
                "wallet.credit.requested",
                "{}");
    }

    @Test
    void marketplaceDomainEventsPublishToMarketplaceEventsExchange() {
        OutboxEventRepository repository = mock(OutboxEventRepository.class);
        RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
        OutboxProcessor processor = new OutboxProcessor(repository, rabbitTemplate);
        OutboxEvent event = OutboxEvent.builder()
                .eventType(RabbitMQConfig.COLLUSION_FLAGGED_ROUTING_KEY)
                .payload("{\"status\":\"MALICIOUS\"}")
                .status(OutboxStatus.PENDING)
                .build();
        when(repository.claimNextPendingBatch(org.mockito.ArgumentMatchers.eq(50), any(Instant.class)))
                .thenReturn(List.of(event));

        processor.publishOutboxEvents();

        verify(rabbitTemplate).convertAndSend(
                RabbitMQConfig.MARKETPLACE_EVENTS_EXCHANGE,
                RabbitMQConfig.COLLUSION_FLAGGED_ROUTING_KEY,
                "{\"status\":\"MALICIOUS\"}");
        ArgumentCaptor<OutboxEvent> captor = ArgumentCaptor.forClass(OutboxEvent.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(OutboxStatus.SENT);
    }
}