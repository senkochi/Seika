package com.cardy.walletService.service;

import com.cardy.walletService.domain.Wallet;
import com.cardy.walletService.domain.WalletIdempotencyKey;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class WalletInitializationTest {

    @Test
    void registrationInitializesWalletCreatedByAnEarlierBalanceRequest() {
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
        Wallet existingEmptyWallet = Wallet.builder().id(UUID.randomUUID()).userId(userId).build();
        existingEmptyWallet.recalculateBalance();

        when(idempotencyRepository.existsById("user:" + userId + ":wallet-initialized")).thenReturn(false);
        when(configService.getBigDecimal(SystemConfigService.KEY_STUDENT_INITIAL_COIN, new BigDecimal("500")))
                .thenReturn(new BigDecimal("500"));
        when(configService.getBigDecimal(SystemConfigService.KEY_TEACHER_INITIAL_COIN, BigDecimal.ZERO))
                .thenReturn(BigDecimal.ZERO);
        when(walletRepository.findByUserId(userId)).thenReturn(Optional.of(existingEmptyWallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(ledgerRepository.save(any(WalletLedgerEntry.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.createWallet(userId, false);

        assertThat(existingEmptyWallet.getBonusBalance()).isEqualByComparingTo("500");
        assertThat(existingEmptyWallet.getBalance()).isEqualByComparingTo("500");

        ArgumentCaptor<WalletLedgerEntry> ledgerCaptor = ArgumentCaptor.forClass(WalletLedgerEntry.class);
        verify(ledgerRepository).save(ledgerCaptor.capture());
        assertThat(ledgerCaptor.getValue().getType()).isEqualTo(WalletLedgerType.INITIAL_BONUS);
        assertThat(ledgerCaptor.getValue().getSource()).isEqualTo(WalletLedgerSource.BONUS);
        assertThat(ledgerCaptor.getValue().getAmount()).isEqualByComparingTo("500");

        ArgumentCaptor<WalletIdempotencyKey> keyCaptor = ArgumentCaptor.forClass(WalletIdempotencyKey.class);
        verify(idempotencyRepository).save(keyCaptor.capture());
        assertThat(keyCaptor.getValue().getIdempotencyKey())
                .isEqualTo("user:" + userId + ":wallet-initialized");
    }

    @Test
    void duplicateRegistrationEventDoesNotGrantInitialBonusAgain() {
        WalletRepository walletRepository = mock(WalletRepository.class);
        WalletIdempotencyKeyRepository idempotencyRepository = mock(WalletIdempotencyKeyRepository.class);
        WalletService service = new WalletService(
                walletRepository,
                mock(TransactionRepository.class),
                mock(WalletLedgerEntryRepository.class),
                idempotencyRepository,
                mock(SystemConfigService.class),
                mock(WalletNotificationPublisher.class),
                mock(WalletHoldService.class));

        UUID userId = UUID.randomUUID();
        when(idempotencyRepository.existsById("user:" + userId + ":wallet-initialized")).thenReturn(true);

        service.createWallet(userId, false);

        verify(walletRepository, never()).findByUserId(any());
        verify(walletRepository, never()).save(any());
    }

    @Test
    void legacyInitialBonusLedgerPreventsReplayFromGrantingBonusAgain() {
        WalletRepository walletRepository = mock(WalletRepository.class);
        WalletLedgerEntryRepository ledgerRepository = mock(WalletLedgerEntryRepository.class);
        WalletIdempotencyKeyRepository idempotencyRepository = mock(WalletIdempotencyKeyRepository.class);
        WalletService service = new WalletService(
                walletRepository,
                mock(TransactionRepository.class),
                ledgerRepository,
                idempotencyRepository,
                mock(SystemConfigService.class),
                mock(WalletNotificationPublisher.class),
                mock(WalletHoldService.class));

        UUID userId = UUID.randomUUID();
        String initializationKey = "user:" + userId + ":wallet-initialized";
        String legacyLedgerKey = "user:" + userId + ":initial-bonus";
        when(idempotencyRepository.existsById(initializationKey)).thenReturn(false);
        when(ledgerRepository.findByIdempotencyKeyAndTypeOrderByCreatedAtAsc(
                legacyLedgerKey, WalletLedgerType.INITIAL_BONUS))
                .thenReturn(java.util.List.of(WalletLedgerEntry.builder().amount(new BigDecimal("500")).build()));

        service.createWallet(userId, false);

        verify(walletRepository, never()).findByUserId(any());
        verify(walletRepository, never()).save(any());
        verify(idempotencyRepository).save(any(WalletIdempotencyKey.class));
    }}
