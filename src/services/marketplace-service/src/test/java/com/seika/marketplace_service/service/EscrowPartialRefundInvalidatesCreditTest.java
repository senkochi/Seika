package com.seika.marketplace_service.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.marketplace_service.entity.EscrowTransaction;
import com.seika.marketplace_service.entity.OrderItem;
import com.seika.marketplace_service.enums.EscrowStatus;
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
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class EscrowPartialRefundInvalidatesCreditTest {

    @Test
    void partialRefundClearsPreviouslyScheduledCreditRequestedAt() {
        EscrowTransactionRepository escrowRepository = mock(EscrowTransactionRepository.class);
        OrderItemRepository orderItemRepository = mock(OrderItemRepository.class);
        UserInventoryRepository inventoryRepository = mock(UserInventoryRepository.class);
        OutboxEventRepository outboxRepository = mock(OutboxEventRepository.class);
        ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
        AdminActionLogService logService = mock(AdminActionLogService.class);
        EscrowService service = new EscrowService(escrowRepository, orderItemRepository, inventoryRepository,
                outboxRepository, mock(MarketplaceConfigService.class), mock(TeacherRatingService.class), objectMapper);
        org.springframework.test.util.ReflectionTestUtils.setField(service, "adminActionLogService", logService);

        Instant previouslyScheduledCredit = Instant.parse("2026-07-10T00:00:00Z");
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
                .status(EscrowStatus.HELD)
                .needsAdminDecision(false)
                .releaseAt(Instant.now())
                .creditRequestedAt(previouslyScheduledCredit)
                .build();
        OrderItem item = OrderItem.builder().id("ITEM1").build();
        when(escrowRepository.findByOrderItemId("ITEM1")).thenReturn(Optional.of(escrow));
        when(orderItemRepository.findById("ITEM1")).thenReturn(Optional.of(item));
        when(escrowRepository.save(any(EscrowTransaction.class))).thenAnswer(inv -> inv.getArgument(0));
        when(outboxRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        org.assertj.core.api.Assertions.assertThatThrownBy(
                        () -> service.adminPartialRefund("ITEM1", new BigDecimal("50"), "admin-1", "half refund"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("in progress");
        org.mockito.Mockito.verify(outboxRepository, org.mockito.Mockito.never()).save(any());
    }
}