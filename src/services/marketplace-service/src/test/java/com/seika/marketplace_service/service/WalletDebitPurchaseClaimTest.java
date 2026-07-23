package com.seika.marketplace_service.service;

import com.seika.marketplace_service.entity.InboxEvent;
import com.seika.marketplace_service.entity.Order;
import com.seika.marketplace_service.entity.PurchaseClaim;
import com.seika.marketplace_service.enums.OrderStatus;
import com.seika.marketplace_service.enums.PurchaseClaimStatus;
import com.seika.marketplace_service.event.WalletDebitEvent;
import com.seika.marketplace_service.repository.InboxEventRepository;
import com.seika.marketplace_service.repository.OrderItemRepository;
import com.seika.marketplace_service.repository.OrderRepository;
import com.seika.marketplace_service.repository.PurchaseClaimRepository;
import com.seika.marketplace_service.repository.UserInventoryRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.when;

class WalletDebitPurchaseClaimTest {

    @Test
    void successfulDebitCompletesPurchaseClaim() {
        InboxEventRepository inboxRepository = mock(InboxEventRepository.class);
        OrderRepository orderRepository = mock(OrderRepository.class);
        OrderItemRepository orderItemRepository = mock(OrderItemRepository.class);
        PurchaseClaimRepository claimRepository = mock(PurchaseClaimRepository.class);
        WalletEventHandler handler = handler(
                inboxRepository, orderRepository, orderItemRepository, claimRepository);
        Order order = Order.builder().id("order-1").userId("student-1")
                .status(OrderStatus.PENDING_PAYMENT).build();
        PurchaseClaim claim = PurchaseClaim.builder()
                .orderId("order-1")
                .userId("student-1")
                .productId("product-1")
                .status(PurchaseClaimStatus.PENDING)
                .build();
        when(inboxRepository.findByMessageId("event-1")).thenReturn(Optional.empty());
        when(inboxRepository.save(any(InboxEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderRepository.findById("order-1")).thenReturn(Optional.of(order));
        when(orderItemRepository.findByOrderId("order-1")).thenReturn(List.of());
        when(claimRepository.findByOrderId("order-1")).thenReturn(List.of(claim));

        handler.handleWalletDebitEvent(debitEvent("event-1", "wallet.debit.succeeded"), "{}");

        assertThat(claim.getStatus()).isEqualTo(PurchaseClaimStatus.OWNED);
        verify(claimRepository).saveAll(List.of(claim));
    }

    @Test
    void failedDebitReleasesPurchaseClaim() {
        InboxEventRepository inboxRepository = mock(InboxEventRepository.class);
        OrderRepository orderRepository = mock(OrderRepository.class);
        OrderItemRepository orderItemRepository = mock(OrderItemRepository.class);
        PurchaseClaimRepository claimRepository = mock(PurchaseClaimRepository.class);
        WalletEventHandler handler = handler(
                inboxRepository, orderRepository, orderItemRepository, claimRepository);
        Order order = Order.builder().id("order-1").userId("student-1")
                .status(OrderStatus.PENDING_PAYMENT).build();
        when(inboxRepository.findByMessageId("event-2")).thenReturn(Optional.empty());
        when(inboxRepository.save(any(InboxEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderRepository.findById("order-1")).thenReturn(Optional.of(order));

        handler.handleWalletDebitEvent(debitEvent("event-2", "wallet.debit.failed"), "{}");

        verify(claimRepository).deleteByOrderId("order-1");
        assertThat(order.getStatus()).isEqualTo(OrderStatus.FAILED);
    }

    @Test
    void duplicateDebitResultsWithDifferentEventIdsUseOneBusinessInboxKey() {
        InboxEventRepository inboxRepository = mock(InboxEventRepository.class);
        OrderRepository orderRepository = mock(OrderRepository.class);
        OrderItemRepository orderItemRepository = mock(OrderItemRepository.class);
        PurchaseClaimRepository claimRepository = mock(PurchaseClaimRepository.class);
        WalletEventHandler handler = handler(
                inboxRepository, orderRepository, orderItemRepository, claimRepository);
        Order order = Order.builder().id("order-1").userId("student-1")
                .status(OrderStatus.PENDING_PAYMENT).build();
        when(inboxRepository.claimMessage(anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(1, 0);
        when(orderRepository.findById("order-1")).thenReturn(Optional.of(order));
        when(orderItemRepository.findByOrderId("order-1")).thenReturn(List.of());
        when(claimRepository.findByOrderId("order-1")).thenReturn(List.of());

        handler.handleWalletDebitEvent(debitEvent("result-1", "wallet.debit.succeeded"), "{}");
        handler.handleWalletDebitEvent(debitEvent("result-2", "wallet.debit.succeeded"), "{}");

        ArgumentCaptor<String> messageIdCaptor = ArgumentCaptor.forClass(String.class);
        verify(inboxRepository, times(2)).claimMessage(
                anyString(), messageIdCaptor.capture(), anyString(), anyString(), anyString());
        assertThat(messageIdCaptor.getAllValues().get(0))
                .isEqualTo(messageIdCaptor.getAllValues().get(1))
                .hasSize(64);
        verify(orderRepository, times(1)).findById("order-1");
    }

    private WalletEventHandler handler(InboxEventRepository inboxRepository,
                                       OrderRepository orderRepository,
                                       OrderItemRepository orderItemRepository,
                                       PurchaseClaimRepository claimRepository) {
        when(inboxRepository.claimMessage(anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(1);
        return new WalletEventHandler(
                inboxRepository,
                orderRepository,
                orderItemRepository,
                mock(UserInventoryRepository.class),
                claimRepository,
                mock(ContentPurchasedEventPublisher.class),
                mock(EscrowService.class));
    }

    private WalletDebitEvent debitEvent(String eventId, String eventType) {
        return WalletDebitEvent.builder()
                .eventId(eventId)
                .eventType(eventType)
                .idempotencyKey("order:order-1:debit")
                .orderId("order-1")
                .buyerUserId("student-1")
                .totalAmount(new BigDecimal("100"))
                .sourceBreakdown(WalletDebitEvent.SourceBreakdown.builder()
                        .paidAmount(new BigDecimal("100"))
                        .build())
                .build();
    }
}
