package com.cardy.walletService.processor;

import com.cardy.walletService.config.RabbitMQConfig;
import com.cardy.walletService.domain.WalletOutboxEvent;
import com.cardy.walletService.enums.WalletOutboxStatus;
import com.cardy.walletService.repository.WalletOutboxEventRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class WalletOutboxProcessorTest {

    private static final Instant NOW = Instant.parse("2026-07-17T10:00:00Z");

    @Test
    void publishesPendingEventsToWalletEventsExchangeAndMarksSent() {
        WalletOutboxEventRepository repository = mock(WalletOutboxEventRepository.class);
        RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
        WalletOutboxProcessor processor = new WalletOutboxProcessor(repository, rabbitTemplate, 8, 30L, 50);
        WalletOutboxEvent event = WalletOutboxEvent.builder()
                .eventType("wallet.debit.succeeded")
                .payload("{\"eventType\":\"wallet.debit.succeeded\"}")
                .status(WalletOutboxStatus.PENDING)
                .build();
        when(repository.claimNextPendingBatch(anyInt(), any(Instant.class)))
                .thenReturn(List.of(event));

        processor.publishOutboxEvents(NOW);

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
    void processorClaimsRowsBeforePublishingAndRetriesFailuresWithBackoff() {
        WalletOutboxEventRepository repository = mock(WalletOutboxEventRepository.class);
        RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
        WalletOutboxProcessor processor = new WalletOutboxProcessor(repository, rabbitTemplate, 8, 30L, 50);
        WalletOutboxEvent event = WalletOutboxEvent.builder()
                .eventType("wallet.refund.succeeded")
                .payload("{}")
                .status(WalletOutboxStatus.PENDING)
                .retryCount(0)
                .build();
        when(repository.claimNextPendingBatch(anyInt(), any(Instant.class)))
                .thenReturn(List.of(event));
        doThrow(new RuntimeException("broker down")).when(rabbitTemplate)
                .convertAndSend(anyString(), anyString(), anyString());

        processor.publishOutboxEvents(NOW);

        // broker is called once (real exchange), not the DLX
        verify(rabbitTemplate).convertAndSend(
                RabbitMQConfig.WALLET_EVENTS_EXCHANGE, "wallet.refund.succeeded", "{}");
        verify(rabbitTemplate, never()).convertAndSend(
                eq(RabbitMQConfig.WALLET_EVENTS_DLX), anyString(), anyString());

        ArgumentCaptor<WalletOutboxEvent> captor = ArgumentCaptor.forClass(WalletOutboxEvent.class);
        verify(repository).save(captor.capture());
        WalletOutboxEvent saved = captor.getValue();
        assertThat(saved.getStatus()).isEqualTo(WalletOutboxStatus.PENDING);
        assertThat(saved.getRetryCount()).isEqualTo(1);
        assertThat(saved.getLastError()).isEqualTo("broker down");
        assertThat(saved.getNextAttemptAt()).isNotNull();
        // first retry: 30s * 2^1 = 60s
        assertThat(saved.getNextAttemptAt()).isEqualTo(NOW.plusSeconds(60));
    }

    @Test
    void processorRoutesDeadLetterOnMaxAttemptsExceeded() {
        WalletOutboxEventRepository repository = mock(WalletOutboxEventRepository.class);
        RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
        int maxAttempts = 8;
        WalletOutboxProcessor processor = new WalletOutboxProcessor(repository, rabbitTemplate, maxAttempts, 30L, 50);
        WalletOutboxEvent event = WalletOutboxEvent.builder()
                .eventType("wallet.debit.failed")
                .payload("{\"foo\":1}")
                .status(WalletOutboxStatus.PENDING)
                .retryCount(maxAttempts - 1) // next failure will exceed
                .build();
        when(repository.claimNextPendingBatch(anyInt(), any(Instant.class)))
                .thenReturn(List.of(event));
        doThrow(new RuntimeException("broker down")).when(rabbitTemplate)
                .convertAndSend(anyString(), anyString(), anyString());

        processor.publishOutboxEvents(NOW);

        // DLX publish attempted
        verify(rabbitTemplate).convertAndSend(
                RabbitMQConfig.WALLET_EVENTS_DLX, "wallet.debit.failed", "{\"foo\":1}");

        ArgumentCaptor<WalletOutboxEvent> captor = ArgumentCaptor.forClass(WalletOutboxEvent.class);
        verify(repository).save(captor.capture());
        WalletOutboxEvent saved = captor.getValue();
        assertThat(saved.getStatus()).isEqualTo(WalletOutboxStatus.DEAD);
        assertThat(saved.getRetryCount()).isEqualTo(maxAttempts);
        assertThat(saved.getLastError()).isEqualTo("broker down");
    }

    @Test
    void processorKeepsRowPendingWithBackoffOnTransientFailure() {
        WalletOutboxEventRepository repository = mock(WalletOutboxEventRepository.class);
        RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
        WalletOutboxProcessor processor = new WalletOutboxProcessor(repository, rabbitTemplate, 8, 30L, 50);
        WalletOutboxEvent event = WalletOutboxEvent.builder()
                .eventType("wallet.credit.succeeded")
                .payload("{}")
                .status(WalletOutboxStatus.PENDING)
                .retryCount(2)
                .build();
        when(repository.claimNextPendingBatch(anyInt(), any(Instant.class)))
                .thenReturn(List.of(event));
        doThrow(new RuntimeException("transient")).when(rabbitTemplate)
                .convertAndSend(anyString(), anyString(), anyString());

        processor.publishOutboxEvents(NOW);

        ArgumentCaptor<WalletOutboxEvent> captor = ArgumentCaptor.forClass(WalletOutboxEvent.class);
        verify(repository).save(captor.capture());
        WalletOutboxEvent saved = captor.getValue();
        assertThat(saved.getStatus()).isEqualTo(WalletOutboxStatus.PENDING);
        assertThat(saved.getRetryCount()).isEqualTo(3);
        // next attempt = 3: 30s * 2^3 = 240s
        assertThat(saved.getNextAttemptAt()).isEqualTo(NOW.plusSeconds(240));
    }

    @Test
    void noClaimedRowsLeavesRepositoryUntouched() {
        WalletOutboxEventRepository repository = mock(WalletOutboxEventRepository.class);
        RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
        WalletOutboxProcessor processor = new WalletOutboxProcessor(repository, rabbitTemplate, 8, 30L, 50);
        when(repository.claimNextPendingBatch(anyInt(), any(Instant.class)))
                .thenReturn(List.of());

        processor.publishOutboxEvents(NOW);

        verify(rabbitTemplate, never()).convertAndSend(anyString(), anyString(), anyString());
        verify(repository, never()).save(any(WalletOutboxEvent.class));
    }

    // --- helpers ---

    private static <T> T eq(T value) {
        return org.mockito.ArgumentMatchers.eq(value);
    }
}
