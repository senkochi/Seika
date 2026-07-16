package com.cardy.walletService.processor;

import com.cardy.walletService.config.RabbitMQConfig;
import com.cardy.walletService.domain.WalletOutboxEvent;
import com.cardy.walletService.enums.WalletOutboxStatus;
import com.cardy.walletService.repository.WalletOutboxEventRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class WalletOutboxProcessorTest {

    @Test
    void publishesPendingEventsToWalletEventsExchangeAndMarksSent() {
        WalletOutboxEventRepository repository = mock(WalletOutboxEventRepository.class);
        RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
        WalletOutboxProcessor processor = new WalletOutboxProcessor(repository, rabbitTemplate);
        WalletOutboxEvent event = WalletOutboxEvent.builder()
                .eventType("wallet.debit.succeeded")
                .payload("{\"eventType\":\"wallet.debit.succeeded\"}")
                .status(WalletOutboxStatus.PENDING)
                .build();
        when(repository.findTop50ByStatusInOrderByCreatedAtAsc(List.of(WalletOutboxStatus.PENDING, WalletOutboxStatus.FAILED)))
                .thenReturn(List.of(event));

        processor.publishOutboxEvents();

        verify(rabbitTemplate).convertAndSend(
                RabbitMQConfig.WALLET_EVENTS_EXCHANGE,
                "wallet.debit.succeeded",
                "{\"eventType\":\"wallet.debit.succeeded\"}");
        ArgumentCaptor<WalletOutboxEvent> captor = ArgumentCaptor.forClass(WalletOutboxEvent.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(WalletOutboxStatus.SENT);
        assertThat(captor.getValue().getPublishedAt()).isNotNull();
        assertThat(captor.getValue().getLastError()).isNull();
    }

    @Test
    void marksEventFailedWhenBrokerPublishFails() {
        WalletOutboxEventRepository repository = mock(WalletOutboxEventRepository.class);
        RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
        WalletOutboxProcessor processor = new WalletOutboxProcessor(repository, rabbitTemplate);
        WalletOutboxEvent event = WalletOutboxEvent.builder()
                .eventType("wallet.refund.succeeded")
                .payload("{}")
                .status(WalletOutboxStatus.PENDING)
                .retryCount(2)
                .build();
        when(repository.findTop50ByStatusInOrderByCreatedAtAsc(List.of(WalletOutboxStatus.PENDING, WalletOutboxStatus.FAILED)))
                .thenReturn(List.of(event));
        doThrow(new RuntimeException("broker down")).when(rabbitTemplate)
                .convertAndSend(any(String.class), any(String.class), any(String.class));

        processor.publishOutboxEvents();

        ArgumentCaptor<WalletOutboxEvent> captor = ArgumentCaptor.forClass(WalletOutboxEvent.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(WalletOutboxStatus.FAILED);
        assertThat(captor.getValue().getRetryCount()).isEqualTo(3);
        assertThat(captor.getValue().getLastError()).isEqualTo("broker down");
    }
}