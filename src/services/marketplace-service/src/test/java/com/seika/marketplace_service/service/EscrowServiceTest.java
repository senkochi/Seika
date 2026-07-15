package com.seika.marketplace_service.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.marketplace_service.entity.EscrowTransaction;
import com.seika.marketplace_service.entity.OrderItem;
import com.seika.marketplace_service.entity.OutboxEvent;
import com.seika.marketplace_service.enums.EscrowState;
import com.seika.marketplace_service.enums.EscrowStatus;
import com.seika.marketplace_service.event.WalletEscrowResultEvent;
import com.seika.marketplace_service.event.WalletRefundRequestedEvent;
import com.seika.marketplace_service.repository.EscrowTransactionRepository;
import com.seika.marketplace_service.repository.OrderItemRepository;
import com.seika.marketplace_service.repository.OutboxEventRepository;
import com.seika.marketplace_service.repository.UserInventoryRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class EscrowServiceTest {

    @Test
    void adminPartialRefundProratesOriginalSourceAmounts() throws Exception {
        EscrowTransactionRepository escrowRepository = mock(EscrowTransactionRepository.class);
        OrderItemRepository orderItemRepository = mock(OrderItemRepository.class);
        UserInventoryRepository inventoryRepository = mock(UserInventoryRepository.class);
        OutboxEventRepository outboxRepository = mock(OutboxEventRepository.class);
        ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
        AdminActionLogService logService = mock(AdminActionLogService.class);
        EscrowService service = new EscrowService(escrowRepository, orderItemRepository, inventoryRepository,
                outboxRepository, mock(MarketplaceConfigService.class), mock(TeacherRatingService.class), objectMapper);
        org.springframework.test.util.ReflectionTestUtils.setField(service, "adminActionLogService", logService);

        EscrowTransaction escrow = EscrowTransaction.builder()
                .id("ESC1")
                .orderId("ORDER1")
                .orderItemId("ITEM1")
                .buyerId("BUYER1")
                .sellerId("SELLER1")
                .productId("PRODUCT1")
                .grossAmount(new BigDecimal("100"))
                .bonusBackedAmount(new BigDecimal("40"))
                .rewardBackedAmount(new BigDecimal("20"))
                .paidBackedAmount(new BigDecimal("40"))
                .earnedPromoBackedAmount(BigDecimal.ZERO)
                .promoBackedAmount(new BigDecimal("60"))
                .status(EscrowStatus.PENDING_ADMIN_DECISION)
                .needsAdminDecision(true)
                .releaseAt(Instant.now())
                .build();
        when(escrowRepository.findByOrderItemId("ITEM1")).thenReturn(Optional.of(escrow));
        when(escrowRepository.save(any(EscrowTransaction.class))).thenAnswer(inv -> inv.getArgument(0));
        when(outboxRepository.save(any(OutboxEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        service.adminPartialRefund("ITEM1", new BigDecimal("50"), "admin-1", "half refund");

        ArgumentCaptor<OutboxEvent> outboxCaptor = ArgumentCaptor.forClass(OutboxEvent.class);
        verify(outboxRepository).save(outboxCaptor.capture());
        WalletRefundRequestedEvent event = objectMapper.readValue(outboxCaptor.getValue().getPayload(), WalletRefundRequestedEvent.class);
        assertThat(event.getIdempotencyKey()).isEqualTo("escrow:ESC1:partial-refund:50.00");
        assertThat(event.getBonusAmount()).isEqualByComparingTo("20.00");
        assertThat(event.getRewardAmount()).isEqualByComparingTo("10.00");
        assertThat(event.getPaidAmount()).isEqualByComparingTo("20.00");
        assertThat(event.getEarnedPromoAmount()).isEqualByComparingTo("0.00");
        assertThat(escrow.getStatus()).isEqualTo(EscrowStatus.PENDING_ADMIN_DECISION);
        assertThat(escrow.isNeedsAdminDecision()).isTrue();
        verify(logService).logAction(
                org.mockito.ArgumentMatchers.eq("admin-1"),
                org.mockito.ArgumentMatchers.eq("PARTIAL_REFUND_ESCROW"),
                org.mockito.ArgumentMatchers.eq("ORDER_ITEM"),
                org.mockito.ArgumentMatchers.eq("ITEM1"),
                org.mockito.ArgumentMatchers.eq("half refund"),
                org.mockito.ArgumentMatchers.contains("\"amount\":\"50.00\""));
    }

    @Test
    void partialRefundSucceededDoesNotRevokeInventoryOrMarkOrderItemFullyRefunded() {
        EscrowTransactionRepository escrowRepository = mock(EscrowTransactionRepository.class);
        OrderItemRepository orderItemRepository = mock(OrderItemRepository.class);
        UserInventoryRepository inventoryRepository = mock(UserInventoryRepository.class);
        EscrowService service = new EscrowService(escrowRepository, orderItemRepository, inventoryRepository,
                mock(OutboxEventRepository.class), mock(MarketplaceConfigService.class), mock(TeacherRatingService.class), new ObjectMapper().findAndRegisterModules());

        EscrowTransaction escrow = EscrowTransaction.builder()
                .id("ESC1")
                .orderId("ORDER1")
                .orderItemId("ITEM1")
                .buyerId("BUYER1")
                .productId("PRODUCT1")
                .grossAmount(new BigDecimal("100"))
                .status(EscrowStatus.PENDING_ADMIN_DECISION)
                .needsAdminDecision(true)
                .releaseAt(Instant.now())
                .build();
        OrderItem item = OrderItem.builder()
                .id("ITEM1")
                .escrowState(EscrowState.PENDING_ADMIN_DECISION)
                .escrowFullyRefunded(false)
                .build();
        when(escrowRepository.findById("ESC1")).thenReturn(Optional.of(escrow));
        when(orderItemRepository.findById("ITEM1")).thenReturn(Optional.of(item));

        service.handleWalletEscrowResult(WalletEscrowResultEvent.builder()
                .eventType("wallet.refund.succeeded")
                .idempotencyKey("escrow:ESC1:partial-refund:50.00")
                .escrowId("ESC1")
                .occurredAt(Instant.now())
                .build());

        assertThat(escrow.getStatus()).isEqualTo(EscrowStatus.PENDING_ADMIN_DECISION);
        assertThat(escrow.getReviewReason()).isEqualTo("partial_refund_completed");
        assertThat(item.getEscrowState()).isEqualTo(EscrowState.PENDING_ADMIN_DECISION);
        assertThat(item.isEscrowFullyRefunded()).isFalse();
        verify(inventoryRepository, never()).save(any());
    }
}
