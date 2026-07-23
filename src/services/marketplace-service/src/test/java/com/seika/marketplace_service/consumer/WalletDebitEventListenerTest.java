package com.seika.marketplace_service.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.marketplace_service.event.WalletDebitEvent;
import com.seika.marketplace_service.service.EscrowService;
import com.seika.marketplace_service.service.WalletEventHandler;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.amqp.core.Message;

import java.nio.charset.StandardCharsets;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

class WalletDebitEventListenerTest {

    @Test
    void handleWalletEventDeserializesDebitSucceededEventWithInstantTimestamp() {
        ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
        WalletEventHandler walletEventHandler = mock(WalletEventHandler.class);
        EscrowService escrowService = mock(EscrowService.class);
        WalletDebitEventListener listener = new WalletDebitEventListener(objectMapper, walletEventHandler, escrowService);

        String rawMessage = """
                {
                  "eventId":"event-1",
                  "eventType":"wallet.debit.succeeded",
                  "idempotencyKey":"order:order-1:debit",
                  "orderId":"order-1",
                  "buyerUserId":"student-1",
                  "totalAmount":30,
                  "sourceBreakdown":{"bonusAmount":30,"rewardAmount":0,"earnedPromoAmount":0,"paidAmount":0,"promoBackedAmount":30},
                  "ledgerEntryIds":["ledger-1"],
                  "occurredAt":"2026-07-12T16:24:07.286449899Z",
                  "reason":null
                }
                """;

        listener.handleWalletEvent(new Message(rawMessage.getBytes(StandardCharsets.UTF_8)));

        ArgumentCaptor<WalletDebitEvent> eventCaptor = ArgumentCaptor.forClass(WalletDebitEvent.class);
        verify(walletEventHandler).handleWalletDebitEvent(eventCaptor.capture(), anyString());
        verifyNoInteractions(escrowService);

        WalletDebitEvent event = eventCaptor.getValue();
        assertThat(event.getEventId()).isEqualTo("event-1");
        assertThat(event.getEventType()).isEqualTo("wallet.debit.succeeded");
        assertThat(event.getOrderId()).isEqualTo("order-1");
        assertThat(event.getOccurredAt()).isEqualTo(Instant.parse("2026-07-12T16:24:07.286449899Z"));
        assertThat(event.getSourceBreakdown().getBonusAmount()).isEqualByComparingTo("30");
    }

    @Test
    void handleWalletEventRethrowsMalformedPayload() {
        ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
        WalletDebitEventListener listener = new WalletDebitEventListener(
                objectMapper,
                mock(WalletEventHandler.class),
                mock(EscrowService.class)
        );

        assertThatThrownBy(() -> listener.handleWalletEvent(new Message("{".getBytes(StandardCharsets.UTF_8))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Failed to deserialize wallet message");
    }
}