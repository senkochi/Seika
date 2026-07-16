package com.cardy.walletService.service;

import com.cardy.walletService.domain.WalletOutboxEvent;
import com.cardy.walletService.enums.WalletLedgerSource;
import com.cardy.walletService.enums.WalletOutboxStatus;
import com.cardy.walletService.event.WalletCreditRequestedEvent;
import com.cardy.walletService.event.WalletDebitEvent;
import com.cardy.walletService.event.WalletDebitRequestedEvent;
import com.cardy.walletService.event.WalletEscrowResultEvent;
import com.cardy.walletService.repository.WalletOutboxEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class WalletCommandOutboxServiceTest {

    private final WalletService walletService = mock(WalletService.class);
    private final WalletOutboxEventRepository outboxRepository = mock(WalletOutboxEventRepository.class);
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
    private final WalletCommandOutboxService service = new WalletCommandOutboxService(
            walletService,
            outboxRepository,
            objectMapper);

    @Test
    void debitSuccessStoresWalletDebitSucceededOutboxEvent() throws Exception {
        UUID userId = UUID.randomUUID();
        WalletDebitRequestedEvent request = WalletDebitRequestedEvent.builder()
                .eventType("wallet.debit.requested")
                .idempotencyKey("order:ORDER-1:debit")
                .orderId("ORDER-1")
                .userId(userId.toString())
                .amount(new BigDecimal("100"))
                .description("Algebra deck")
                .build();
        when(walletService.debitPurchase(eq(userId), eq(new BigDecimal("100")), eq("Mua Algebra deck"),
                eq("ORDER-1"), eq("order:ORDER-1:debit")))
                .thenReturn(new WalletDebitResult(
                        Map.of(WalletLedgerSource.PAID, new BigDecimal("60"), WalletLedgerSource.REWARD, new BigDecimal("40")),
                        List.of("L1", "L2")));
        when(outboxRepository.save(any(WalletOutboxEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.processDebitRequested(request);

        ArgumentCaptor<WalletOutboxEvent> captor = ArgumentCaptor.forClass(WalletOutboxEvent.class);
        verify(outboxRepository).save(captor.capture());
        WalletOutboxEvent saved = captor.getValue();
        assertThat(saved.getAggregateType()).isEqualTo("Order");
        assertThat(saved.getAggregateId()).isEqualTo("ORDER-1");
        assertThat(saved.getEventType()).isEqualTo("wallet.debit.succeeded");
        assertThat(saved.getStatus()).isEqualTo(WalletOutboxStatus.PENDING);

        WalletDebitEvent payload = objectMapper.readValue(saved.getPayload(), WalletDebitEvent.class);
        assertThat(payload.getEventType()).isEqualTo("wallet.debit.succeeded");
        assertThat(payload.getSourceBreakdown().getPaidAmount()).isEqualByComparingTo("60");
        assertThat(payload.getSourceBreakdown().getRewardAmount()).isEqualByComparingTo("40");
        assertThat(payload.getLedgerEntryIds()).containsExactly("L1", "L2");
    }

    @Test
    void creditFailureStoresWalletCreditFailedOutboxEventWithReason() throws Exception {
        WalletCreditRequestedEvent request = WalletCreditRequestedEvent.builder()
                .eventType("wallet.credit.requested")
                .idempotencyKey("escrow:E1:release")
                .escrowId("E1")
                .orderId("ORDER-1")
                .orderItemId("ITEM-1")
                .sellerUserId(UUID.randomUUID().toString())
                .buyerUserId(UUID.randomUUID().toString())
                .teacherWithdrawableAmount(new BigDecimal("90"))
                .teacherPromoAmount(new BigDecimal("10"))
                .platformFeeReal(new BigDecimal("5"))
                .platformFeePromoSink(new BigDecimal("2"))
                .build();
        when(outboxRepository.save(any(WalletOutboxEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.enqueueCreditFailed(request, "wallet frozen");

        ArgumentCaptor<WalletOutboxEvent> captor = ArgumentCaptor.forClass(WalletOutboxEvent.class);
        verify(outboxRepository).save(captor.capture());
        WalletOutboxEvent saved = captor.getValue();
        assertThat(saved.getAggregateType()).isEqualTo("EscrowTransaction");
        assertThat(saved.getAggregateId()).isEqualTo("E1");
        assertThat(saved.getEventType()).isEqualTo("wallet.credit.failed");
        assertThat(saved.getStatus()).isEqualTo(WalletOutboxStatus.PENDING);

        WalletEscrowResultEvent payload = objectMapper.readValue(saved.getPayload(), WalletEscrowResultEvent.class);
        assertThat(payload.getEventType()).isEqualTo("wallet.credit.failed");
        assertThat(payload.getEscrowId()).isEqualTo("E1");
        assertThat(payload.getReason()).isEqualTo("wallet frozen");
    }
}