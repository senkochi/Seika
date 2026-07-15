package com.cardy.walletService.service;

import com.cardy.walletService.domain.Wallet;
import com.cardy.walletService.domain.WalletLedgerEntry;
import com.cardy.walletService.dto.admin.AdminRevenueStatsDTO;
import com.cardy.walletService.enums.WalletLedgerSource;
import com.cardy.walletService.enums.WalletLedgerType;
import com.cardy.walletService.repository.TransactionRepository;
import com.cardy.walletService.repository.WalletLedgerEntryRepository;
import com.cardy.walletService.repository.WalletRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AdminRevenueServiceTest {

    @Test
    void revenueStatsSeparateRealFeesPromoSinkAndWithdrawableLiability() {
        TransactionRepository transactionRepository = mock(TransactionRepository.class);
        WalletLedgerEntryRepository ledgerRepository = mock(WalletLedgerEntryRepository.class);
        WalletRepository walletRepository = mock(WalletRepository.class);
        SystemConfigService configService = mock(SystemConfigService.class);
        AdminRevenueService service = new AdminRevenueService(
                transactionRepository, ledgerRepository, walletRepository, configService);

        when(configService.getBigDecimal(SystemConfigService.KEY_TOPUP_VND_PER_COIN, new BigDecimal("100")))
                .thenReturn(new BigDecimal("100"));
        when(configService.getBigDecimal(SystemConfigService.KEY_WITHDRAWAL_VND_PER_COIN, new BigDecimal("90")))
                .thenReturn(new BigDecimal("90"));
        when(ledgerRepository.findAll()).thenReturn(List.of(
                ledger(WalletLedgerType.TOP_UP, WalletLedgerSource.PAID, "100", "10000"),
                ledger(WalletLedgerType.CASH_OUT, WalletLedgerSource.EARNED_WITHDRAWABLE, "-20", "1800"),
                ledger(WalletLedgerType.PLATFORM_FEE_REAL, WalletLedgerSource.PLATFORM_FEE_REAL, "3", null),
                ledger(WalletLedgerType.PLATFORM_FEE_PROMO_SINK, WalletLedgerSource.PLATFORM_FEE_PROMO_SINK, "7", null)
        ));
        when(walletRepository.findAll()).thenReturn(List.of(
                Wallet.builder()
                        .earnedWithdrawableBalance(new BigDecimal("30"))
                        .bonusBalance(new BigDecimal("5"))
                        .rewardBalance(new BigDecimal("6"))
                        .paidBalance(new BigDecimal("7"))
                        .earnedPromoBalance(new BigDecimal("8"))
                        .build(),
                Wallet.builder()
                        .earnedWithdrawableBalance(new BigDecimal("10"))
                        .bonusBalance(BigDecimal.ZERO)
                        .rewardBalance(BigDecimal.ZERO)
                        .paidBalance(new BigDecimal("9"))
                        .earnedPromoBalance(new BigDecimal("11"))
                        .build()
        ));

        AdminRevenueStatsDTO stats = service.getRevenueStats();

        assertThat(stats.getPaidBackedFeeCoins()).isEqualByComparingTo("3");
        assertThat(stats.getPromoSinkCoins()).isEqualByComparingTo("7");
        assertThat(stats.getRealRevenueVnd()).isEqualByComparingTo("300");
        assertThat(stats.getWithdrawableCoinCirculation()).isEqualByComparingTo("40");
        assertThat(stats.getNonWithdrawableCoinCirculation()).isEqualByComparingTo("46");
        assertThat(stats.getCashOutLiabilityVnd()).isEqualByComparingTo("3600");

        assertThat(stats.getPotentialLiabilityVnd()).isEqualByComparingTo(stats.getCashOutLiabilityVnd());
        assertThat(stats.getTotalCoinCirculation()).isEqualByComparingTo("86");
    }

    private static WalletLedgerEntry ledger(WalletLedgerType type,
                                            WalletLedgerSource source,
                                            String amount,
                                            String amountVnd) {
        return WalletLedgerEntry.builder()
                .type(type)
                .source(source)
                .amount(new BigDecimal(amount))
                .amountVnd(amountVnd == null ? null : new BigDecimal(amountVnd))
                .build();
    }
}
