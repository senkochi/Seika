package com.cardy.walletService.service;

import com.cardy.walletService.domain.Wallet;
import com.cardy.walletService.domain.WalletHold;
import com.cardy.walletService.repository.TransactionRepository;
import com.cardy.walletService.repository.WalletHoldRepository;
import com.cardy.walletService.repository.WalletIdempotencyKeyRepository;
import com.cardy.walletService.repository.WalletLedgerEntryRepository;
import com.cardy.walletService.repository.WalletRepository;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class WalletConcurrencyGuardTest {

    @Test
    void escrowReleaseLocksUserBeforeCheckingIdempotency() {
        TestFixture fixture = new TestFixture();
        UUID userId = UUID.randomUUID();
        Wallet wallet = wallet(userId);
        when(fixture.walletRepository.findByUserId(userId)).thenReturn(Optional.of(wallet));
        when(fixture.idempotencyRepository.existsById("release-1")).thenReturn(true);

        fixture.service.creditEscrowRelease(
                userId, UUID.randomUUID(), BigDecimal.ONE, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, "order-1", "item-1", "escrow-1", "release-1");

        InOrder order = inOrder(fixture.walletRepository, fixture.idempotencyRepository);
        order.verify(fixture.walletRepository).acquireUserLock(userId.toString());
        order.verify(fixture.walletRepository).findByUserId(userId);
        order.verify(fixture.idempotencyRepository).existsById("release-1");
    }

    @Test
    void escrowRefundLocksUserBeforeCheckingIdempotency() {
        TestFixture fixture = new TestFixture();
        UUID userId = UUID.randomUUID();
        Wallet wallet = wallet(userId);
        when(fixture.walletRepository.findByUserId(userId)).thenReturn(Optional.of(wallet));
        when(fixture.idempotencyRepository.existsById("refund-1")).thenReturn(true);

        fixture.service.refundEscrowPurchase(
                userId, BigDecimal.ONE, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                "order-1", "item-1", "escrow-1", "refund-1");

        InOrder order = inOrder(fixture.walletRepository, fixture.idempotencyRepository);
        order.verify(fixture.walletRepository).acquireUserLock(userId.toString());
        order.verify(fixture.walletRepository).findByUserId(userId);
        order.verify(fixture.idempotencyRepository).existsById("refund-1");
    }

    @Test
    void cashOutLocksUserBeforeCheckingActiveHolds() {
        TestFixture fixture = new TestFixture();
        UUID userId = UUID.randomUUID();
        when(fixture.walletRepository.findByUserId(userId)).thenReturn(Optional.of(wallet(userId)));
        when(fixture.holdService.canCashOut(userId)).thenReturn(false);

        assertThatThrownBy(() -> fixture.service.cashOut(userId, new BigDecimal("10"), null))
                .isInstanceOf(IllegalStateException.class);

        InOrder order = inOrder(fixture.walletRepository, fixture.holdService);
        order.verify(fixture.walletRepository).acquireUserLock(userId.toString());
        order.verify(fixture.walletRepository).findByUserId(userId);
        order.verify(fixture.holdService).canCashOut(userId);
    }

    @Test
    void placingHoldUsesSameUserLockBeforeDeduplication() {
        WalletRepository walletRepository = mock(WalletRepository.class);
        WalletHoldRepository holdRepository = mock(WalletHoldRepository.class);
        WalletHold existing = WalletHold.builder().id(UUID.randomUUID()).active(true).build();
        UUID userId = UUID.randomUUID();
        when(holdRepository.findByUserIdAndHoldTypeAndSourceFlagId(userId, "WASH_HOLD", "flag-1"))
                .thenReturn(Optional.of(existing));
        WalletHoldService service = new WalletHoldService(holdRepository, walletRepository);

        service.placeHold(userId, "WASH_HOLD", "review", "flag-1", "system", null);

        InOrder order = inOrder(walletRepository, holdRepository);
        order.verify(walletRepository).acquireUserLock(userId.toString());
        order.verify(holdRepository)
                .findByUserIdAndHoldTypeAndSourceFlagId(userId, "WASH_HOLD", "flag-1");
    }

    @Test
    void walletCreationLocksUserBeforeCheckingInitializationKey() {
        TestFixture fixture = new TestFixture();
        UUID userId = UUID.randomUUID();
        when(fixture.idempotencyRepository.existsById(anyString())).thenReturn(true);

        fixture.service.createWallet(userId, false);

        InOrder order = inOrder(fixture.walletRepository, fixture.idempotencyRepository);
        order.verify(fixture.walletRepository).acquireUserLock(userId.toString());
        order.verify(fixture.idempotencyRepository)
                .existsById("user:" + userId + ":wallet-initialized");
    }

    private static Wallet wallet(UUID userId) {
        Wallet wallet = Wallet.builder().id(UUID.randomUUID()).userId(userId).build();
        wallet.recalculateBalance();
        return wallet;
    }

    private static final class TestFixture {
        private final WalletRepository walletRepository = mock(WalletRepository.class);
        private final TransactionRepository transactionRepository = mock(TransactionRepository.class);
        private final WalletLedgerEntryRepository ledgerRepository = mock(WalletLedgerEntryRepository.class);
        private final WalletIdempotencyKeyRepository idempotencyRepository =
                mock(WalletIdempotencyKeyRepository.class);
        private final SystemConfigService configService = mock(SystemConfigService.class);
        private final WalletNotificationPublisher notificationPublisher =
                mock(WalletNotificationPublisher.class);
        private final WalletHoldService holdService = mock(WalletHoldService.class);
        private final WalletService service = new WalletService(
                walletRepository,
                transactionRepository,
                ledgerRepository,
                idempotencyRepository,
                configService,
                notificationPublisher,
                holdService);
    }
}
