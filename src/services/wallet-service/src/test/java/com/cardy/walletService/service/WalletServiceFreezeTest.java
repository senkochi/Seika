package com.cardy.walletService.service;

import com.cardy.walletService.domain.Wallet;
import com.cardy.walletService.domain.WalletLedgerEntry;
import com.cardy.walletService.enums.WalletLedgerSource;
import com.cardy.walletService.enums.WalletLedgerType;
import com.cardy.walletService.repository.TransactionRepository;
import com.cardy.walletService.repository.WalletIdempotencyKeyRepository;
import com.cardy.walletService.repository.WalletLedgerEntryRepository;
import com.cardy.walletService.repository.WalletRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class WalletServiceFreezeTest {

    @Test
    void applyFreezeMarksWalletFrozenAndWritesLedgerEntry() {
        WalletRepository walletRepository = mock(WalletRepository.class);
        TransactionRepository transactionRepository = mock(TransactionRepository.class);
        WalletLedgerEntryRepository ledgerRepository = mock(WalletLedgerEntryRepository.class);
        WalletIdempotencyKeyRepository idempotencyRepository = mock(WalletIdempotencyKeyRepository.class);
        SystemConfigService configService = mock(SystemConfigService.class);
        WalletNotificationPublisher notificationPublisher = mock(WalletNotificationPublisher.class);
        WalletHoldService holdService = mock(WalletHoldService.class);
        WalletService service = new WalletService(walletRepository, transactionRepository, ledgerRepository,
                idempotencyRepository, configService, notificationPublisher, holdService);

        UUID userId = UUID.randomUUID();
        Wallet wallet = Wallet.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .paidBalance(new BigDecimal("25"))
                .frozen(false)
                .build();
        when(walletRepository.findByUserId(userId)).thenReturn(Optional.of(wallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(ledgerRepository.save(any(WalletLedgerEntry.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Wallet result = service.applyFreeze(userId, "malicious collusion", "FLAG-1", "SYSTEM_COLLUSION");

        assertThat(result.isFrozen()).isTrue();
        ArgumentCaptor<WalletLedgerEntry> ledgerCaptor = ArgumentCaptor.forClass(WalletLedgerEntry.class);
        verify(ledgerRepository).save(ledgerCaptor.capture());
        WalletLedgerEntry ledger = ledgerCaptor.getValue();
        assertThat(ledger.getType()).isEqualTo(WalletLedgerType.WALLET_FREEZE);
        assertThat(ledger.getSource()).isEqualTo(WalletLedgerSource.SYSTEM);
        assertThat(ledger.getAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(ledger.getIdempotencyKey()).isEqualTo("wallet-freeze:FLAG-1:" + userId);
        assertThat(ledger.getDescription()).contains("malicious collusion");
    }

    @Test
    void removeFreezeUnfreezesWalletAndWritesLedgerEntry() {
        WalletRepository walletRepository = mock(WalletRepository.class);
        TransactionRepository transactionRepository = mock(TransactionRepository.class);
        WalletLedgerEntryRepository ledgerRepository = mock(WalletLedgerEntryRepository.class);
        WalletIdempotencyKeyRepository idempotencyRepository = mock(WalletIdempotencyKeyRepository.class);
        SystemConfigService configService = mock(SystemConfigService.class);
        WalletNotificationPublisher notificationPublisher = mock(WalletNotificationPublisher.class);
        WalletHoldService holdService = mock(WalletHoldService.class);
        WalletService service = new WalletService(walletRepository, transactionRepository, ledgerRepository,
                idempotencyRepository, configService, notificationPublisher, holdService);

        UUID userId = UUID.randomUUID();
        Wallet wallet = Wallet.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .frozen(true)
                .build();
        when(walletRepository.findByUserId(userId)).thenReturn(Optional.of(wallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(ledgerRepository.save(any(WalletLedgerEntry.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Wallet result = service.removeFreeze(userId, "appeal approved", "admin-1");

        assertThat(result.isFrozen()).isFalse();
        ArgumentCaptor<WalletLedgerEntry> ledgerCaptor = ArgumentCaptor.forClass(WalletLedgerEntry.class);
        verify(ledgerRepository).save(ledgerCaptor.capture());
        WalletLedgerEntry ledger = ledgerCaptor.getValue();
        assertThat(ledger.getType()).isEqualTo(WalletLedgerType.WALLET_UNFREEZE);
        assertThat(ledger.getSource()).isEqualTo(WalletLedgerSource.SYSTEM);
        assertThat(ledger.getAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(ledger.getDescription()).contains("appeal approved");
    }
}
