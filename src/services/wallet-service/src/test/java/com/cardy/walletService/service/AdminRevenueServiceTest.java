package com.cardy.walletService.service;

import com.cardy.walletService.domain.Wallet;
import com.cardy.walletService.domain.WalletLedgerEntry;
import com.cardy.walletService.dto.admin.AdminRevenueStatsDTO;
import com.cardy.walletService.dto.admin.AdminTransactionDTO;
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
    void systemTransactionsUseAdminCashFlowPerspective() {
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
        when(ledgerRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(
                ledger(WalletLedgerType.TOP_UP, WalletLedgerSource.PAID, "100", "10000"),
                ledger(WalletLedgerType.PLATFORM_FEE_REAL, WalletLedgerSource.PLATFORM_FEE_REAL, "6", null),
                ledger(WalletLedgerType.ESCROW_RELEASE_CREDIT, WalletLedgerSource.EARNED_WITHDRAWABLE, "24", null),
                ledger(WalletLedgerType.ESCROW_RELEASE_CREDIT, WalletLedgerSource.EARNED_PROMO, "16", null),
                ledger(WalletLedgerType.ESCROW_REFUND_CREDIT, WalletLedgerSource.PAID, "10", null),
                ledger(WalletLedgerType.LEARNING_REWARD, WalletLedgerSource.REWARD, "5", null),
                ledger(WalletLedgerType.PURCHASE_DEBIT, WalletLedgerSource.PAID, "-30", null),
                ledger(WalletLedgerType.PLATFORM_FEE_PROMO_SINK, WalletLedgerSource.PLATFORM_FEE_PROMO_SINK, "4", null),
                ledger(WalletLedgerType.CASH_OUT, WalletLedgerSource.EARNED_WITHDRAWABLE, "-8", "720")
        ));

        List<AdminTransactionDTO> transactions = service.getSystemTransactions("ALL");

        assertThat(transactions).extracting(AdminTransactionDTO::getFlowDirection)
                .containsExactly(
                        "INFLOW", "INFLOW", "OUTFLOW", "NEUTRAL", "NEUTRAL",
                        "NEUTRAL", "NEUTRAL", "NEUTRAL", "OUTFLOW");
        assertThat(transactions).extracting(AdminTransactionDTO::getSource)
                .containsExactly(
                        "PAID", "PLATFORM_FEE_REAL", "EARNED_WITHDRAWABLE", "EARNED_PROMO",
                        "PAID", "REWARD", "PAID", "PLATFORM_FEE_PROMO_SINK", "EARNED_WITHDRAWABLE");
        assertThat(transactions.get(0).getAmountVnd()).isEqualByComparingTo("10000");
        assertThat(transactions.get(1).getAmountVnd()).isEqualByComparingTo("600");
        assertThat(transactions.get(2).getAmountVnd()).isEqualByComparingTo("2160");
        assertThat(transactions.get(3).getAmountVnd()).isNull();
        assertThat(transactions.get(4).getAmountVnd()).isNull();
        assertThat(transactions.get(5).getAmountVnd()).isNull();
        assertThat(transactions.get(6).getAmountVnd()).isNull();
        assertThat(transactions.get(7).getAmountVnd()).isNull();
        assertThat(transactions.get(8).getAmountVnd()).isEqualByComparingTo("720");
    }

    @Test
    void revenueStatsSeparateRealFeesPromoSinkAndWithdrawableLiability() {
        TransactionRepository transactionRepository = mock(TransactionRepository.class);
        WalletLedgerEntryRepository ledgerRepository = mock(WalletLedgerEntryRepository.class);
        WalletRepository walletRepository = mock(WalletRepository.class);
        SystemConfigService configService = mock(SystemConfigService.class);
        AdminRevenueService service = new AdminRevenueService(
                transactionRepository, ledgerRepository, walletRepository, configService);

        when(configService.getBigDecimal(SystemConfigService.KEY_TOPUP_VND_PER_COIN, new BigDecimal("100")))
                .thenReturn(new BigDecimal("200"));
        when(configService.getBigDecimal(SystemConfigService.KEY_WITHDRAWAL_VND_PER_COIN, new BigDecimal("90")))
                .thenReturn(new BigDecimal("90"));
        when(ledgerRepository.findAll()).thenReturn(List.of(
                ledger(WalletLedgerType.TOP_UP, WalletLedgerSource.PAID, "50", "10000"),
                ledger(WalletLedgerType.TOP_UP, WalletLedgerSource.PAID, "100", "10000"),
                ledger(WalletLedgerType.CASH_OUT, WalletLedgerSource.EARNED_WITHDRAWABLE, "-20", "1800"),
                ledger(WalletLedgerType.PLATFORM_FEE_REAL, WalletLedgerSource.PLATFORM_FEE_REAL, "16", null),
                ledger(WalletLedgerType.PLATFORM_FEE_PROMO_SINK, WalletLedgerSource.PLATFORM_FEE_PROMO_SINK, "7", null)
        ));
        when(walletRepository.findAll()).thenReturn(List.of(
                Wallet.builder()
                        .earnedWithdrawableBalance(new BigDecimal("40"))
                        .bonusBalance(new BigDecimal("5"))
                        .rewardBalance(new BigDecimal("6"))
                        .paidBalance(new BigDecimal("11"))
                        .earnedPromoBalance(new BigDecimal("8"))
                        .build(),
                Wallet.builder()
                        .earnedWithdrawableBalance(new BigDecimal("24"))
                        .bonusBalance(BigDecimal.ZERO)
                        .rewardBalance(BigDecimal.ZERO)
                        .paidBalance(new BigDecimal("19"))
                        .earnedPromoBalance(new BigDecimal("11"))
                        .build()
        ));

        AdminRevenueStatsDTO stats = service.getRevenueStats();

        assertThat(stats.getTotalTopupCoins()).isEqualByComparingTo("150");
        assertThat(stats.getTotalTopupVnd()).isEqualByComparingTo("20000");
        assertThat(stats.getAverageTopupRate()).isEqualByComparingTo("133.33");
        assertThat(stats.getAverageWithdrawalRate()).isEqualByComparingTo("90.00");
        assertThat(stats.getPaidBackedFeeCoins()).isEqualByComparingTo("16");
        assertThat(stats.getPromoSinkCoins()).isEqualByComparingTo("7");
        assertThat(stats.getPaidBackedFeeEstimatedVnd()).isEqualByComparingTo("3200");
        assertThat(stats.getRealRevenueVnd()).isEqualByComparingTo(stats.getPaidBackedFeeEstimatedVnd());
        assertThat(stats.getWithdrawableCoinCirculation()).isEqualByComparingTo("64");
        assertThat(stats.getPaidCoinCirculation()).isEqualByComparingTo("30");
        assertThat(stats.getNonWithdrawableCoinCirculation()).isEqualByComparingTo("60");
        assertThat(stats.getCashOutLiabilityVnd()).isEqualByComparingTo("5760");
        assertThat(stats.getNetCashAfterCurrentLiabilityVnd()).isEqualByComparingTo("12440");
        assertThat(stats.getGuaranteedProfitVnd()).isEqualByComparingTo(stats.getNetCashAfterCurrentLiabilityVnd());

        assertThat(stats.getPotentialLiabilityVnd()).isEqualByComparingTo(stats.getCashOutLiabilityVnd());
        assertThat(stats.getTotalCoinCirculation()).isEqualByComparingTo("124");
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
