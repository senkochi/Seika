package com.seika.marketplace_service.service;

import com.seika.marketplace_service.event.WalletEscrowResultEvent;
import com.seika.marketplace_service.repository.InboxEventRepository;
import com.seika.marketplace_service.repository.OrderItemRepository;
import com.seika.marketplace_service.repository.OrderRepository;
import com.seika.marketplace_service.repository.UserInventoryRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class WalletEscrowResultIdempotencyTest {

    @Test
    void differentEventIdsWithSameBusinessKeyApplyPartialRefundOnlyOnce() {
        InboxEventRepository inboxRepository = mock(InboxEventRepository.class);
        EscrowService escrowService = mock(EscrowService.class);
        WalletEventHandler handler = new WalletEventHandler(
                inboxRepository,
                mock(OrderRepository.class),
                mock(OrderItemRepository.class),
                mock(UserInventoryRepository.class),
                mock(com.seika.marketplace_service.repository.PurchaseClaimRepository.class),
                mock(ContentPurchasedEventPublisher.class),
                escrowService);

        when(inboxRepository.claimMessage(anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(1, 0);
        when(inboxRepository.findByMessageId(any())).thenReturn(Optional.empty());

        handler.handleWalletEscrowResult(partialRefundResult("result-event-1"),
                "{\"eventId\":\"result-event-1\"}");
        handler.handleWalletEscrowResult(partialRefundResult("result-event-2"),
                "{\"eventId\":\"result-event-2\"}");

        ArgumentCaptor<String> messageIdCaptor = ArgumentCaptor.forClass(String.class);
        verify(inboxRepository, times(2)).claimMessage(
                anyString(), messageIdCaptor.capture(), anyString(), anyString(), anyString());
        assertThat(messageIdCaptor.getAllValues().get(0))
                .isEqualTo(messageIdCaptor.getAllValues().get(1))
                .hasSize(64);
        verify(escrowService, times(1)).handleWalletEscrowResult(any(WalletEscrowResultEvent.class));
    }

    private WalletEscrowResultEvent partialRefundResult(String eventId) {
        return WalletEscrowResultEvent.builder()
                .eventId(eventId)
                .eventType("wallet.refund.succeeded")
                .idempotencyKey("escrow:ESC1:partial-refund:100.00:40.00")
                .escrowId("ESC1")
                .bonusAmount(new BigDecimal("20"))
                .paidAmount(new BigDecimal("20"))
                .build();
    }
}
