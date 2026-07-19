package com.seika.marketplace_service.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.marketplace_service.entity.EscrowTransaction;
import com.seika.marketplace_service.entity.OutboxEvent;
import com.seika.marketplace_service.enums.EscrowStatus;
import com.seika.marketplace_service.event.WalletRefundRequestedEvent;
import com.seika.marketplace_service.repository.EscrowTransactionRepository;
import com.seika.marketplace_service.repository.OrderItemRepository;
import com.seika.marketplace_service.repository.OutboxEventRepository;
import com.seika.marketplace_service.repository.UserInventoryRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EscrowPartialRefundRoundingTest {

    @Test
    void partialRefundNeverProducesNegativeSourceAmountsAfterRounding() throws Exception {
        EscrowTransactionRepository escrowRepository = mock(EscrowTransactionRepository.class);
        OutboxEventRepository outboxRepository = mock(OutboxEventRepository.class);
        ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
        EscrowService service = new EscrowService(
                escrowRepository,
                mock(OrderItemRepository.class),
                mock(UserInventoryRepository.class),
                outboxRepository,
                mock(MarketplaceConfigService.class),
                mock(TeacherRatingService.class),
                objectMapper);
        EscrowTransaction escrow = EscrowTransaction.builder()
                .id("ESC-ROUNDING")
                .orderItemId("ITEM-ROUNDING")
                .grossAmount(new BigDecimal("10.00"))
                .bonusBackedAmount(new BigDecimal("3.33"))
                .rewardBackedAmount(new BigDecimal("3.33"))
                .paidBackedAmount(new BigDecimal("0.01"))
                .earnedPromoBackedAmount(new BigDecimal("3.33"))
                .promoBackedAmount(new BigDecimal("9.99"))
                .status(EscrowStatus.PENDING_ADMIN_DECISION)
                .build();
        when(escrowRepository.findByOrderItemId("ITEM-ROUNDING")).thenReturn(Optional.of(escrow));
        when(outboxRepository.save(any(OutboxEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.adminPartialRefund("ITEM-ROUNDING", new BigDecimal("0.02"), "admin-1", "rounding case");

        ArgumentCaptor<OutboxEvent> outboxCaptor = ArgumentCaptor.forClass(OutboxEvent.class);
        verify(outboxRepository).save(outboxCaptor.capture());
        WalletRefundRequestedEvent event = objectMapper.readValue(
                outboxCaptor.getValue().getPayload(), WalletRefundRequestedEvent.class);
        assertThat(event.getBonusAmount()).isNotNegative();
        assertThat(event.getRewardAmount()).isNotNegative();
        assertThat(event.getPaidAmount()).isNotNegative();
        assertThat(event.getEarnedPromoAmount()).isNotNegative();
        assertThat(event.getBonusAmount()
                .add(event.getRewardAmount())
                .add(event.getPaidAmount())
                .add(event.getEarnedPromoAmount()))
                .isEqualByComparingTo("0.02");
    }
}
