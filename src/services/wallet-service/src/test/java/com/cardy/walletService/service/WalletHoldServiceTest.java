package com.cardy.walletService.service;

import com.cardy.walletService.domain.WalletHold;
import com.cardy.walletService.repository.WalletHoldRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class WalletHoldServiceTest {

    @Test
    void blocksCashOutIfActiveWashHoldExists() {
        WalletHoldRepository repository = mock(WalletHoldRepository.class);
        WalletHoldService service = new WalletHoldService(repository);

        UUID userId = UUID.randomUUID();
        WalletHold activeHold = WalletHold.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .holdType("WASH_HOLD")
                .active(true)
                .expiresAt(LocalDateTime.now().plusDays(30))
                .build();

        when(repository.findByUserIdAndActiveTrue(userId)).thenReturn(List.of(activeHold));

        boolean canCashOut = service.canCashOut(userId);
        assertThat(canCashOut).isFalse();
    }

    @Test
    void allowsCashOutIfHoldsAreExpired() {
        WalletHoldRepository repository = mock(WalletHoldRepository.class);
        WalletHoldService service = new WalletHoldService(repository);

        UUID userId = UUID.randomUUID();
        WalletHold expiredHold = WalletHold.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .holdType("WASH_HOLD")
                .active(true)
                .expiresAt(LocalDateTime.now().minusDays(1))
                .build();

        when(repository.findByUserIdAndActiveTrue(userId)).thenReturn(List.of(expiredHold));

        boolean canCashOut = service.canCashOut(userId);
        assertThat(canCashOut).isTrue();
    }
}
