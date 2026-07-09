package com.cardy.walletService.service;

import com.cardy.walletService.domain.Wallet;
import com.cardy.walletService.enums.WalletLedgerSource;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class WalletSourceAllocatorTest {

    @Test
    void allocatesPurchaseDebitFromAppOnlyCoinBeforePaidCoin() {
        Wallet wallet = Wallet.builder()
                .bonusBalance(new BigDecimal("50"))
                .rewardBalance(new BigDecimal("20"))
                .earnedPromoBalance(new BigDecimal("10"))
                .paidBalance(new BigDecimal("100"))
                .build();

        WalletDebitResult result = WalletSourceAllocator.allocatePurchase(wallet, new BigDecimal("90"));

        assertThat(result.amountFor(WalletLedgerSource.BONUS)).isEqualByComparingTo("50");
        assertThat(result.amountFor(WalletLedgerSource.REWARD)).isEqualByComparingTo("20");
        assertThat(result.amountFor(WalletLedgerSource.EARNED_PROMO)).isEqualByComparingTo("10");
        assertThat(result.amountFor(WalletLedgerSource.PAID)).isEqualByComparingTo("10");
        assertThat(result.promoBackedAmount()).isEqualByComparingTo("80");
        assertThat(result.paidAmount()).isEqualByComparingTo("10");

        assertThat(wallet.getBonusBalance()).isEqualByComparingTo("0");
        assertThat(wallet.getRewardBalance()).isEqualByComparingTo("0");
        assertThat(wallet.getEarnedPromoBalance()).isEqualByComparingTo("0");
        assertThat(wallet.getPaidBalance()).isEqualByComparingTo("90");
    }

    @Test
    void rejectsPurchaseDebitWhenSourceBalancesCannotCoverAmount() {
        Wallet wallet = Wallet.builder()
                .bonusBalance(new BigDecimal("5"))
                .paidBalance(new BigDecimal("4"))
                .build();

        assertThatThrownBy(() -> WalletSourceAllocator.allocatePurchase(wallet, new BigDecimal("10")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Số dư không đủ");
    }

    @Test
    void debitsCashOutOnlyFromWithdrawableEarnings() {
        Wallet wallet = Wallet.builder()
                .earnedWithdrawableBalance(new BigDecimal("25"))
                .paidBalance(new BigDecimal("100"))
                .earnedPromoBalance(new BigDecimal("100"))
                .build();

        WalletDebitResult result = WalletSourceAllocator.allocateCashOut(wallet, new BigDecimal("20"));

        assertThat(result.amounts()).isEqualTo(Map.of(WalletLedgerSource.EARNED_WITHDRAWABLE, new BigDecimal("20")));
        assertThat(wallet.getEarnedWithdrawableBalance()).isEqualByComparingTo("5");
        assertThat(wallet.getPaidBalance()).isEqualByComparingTo("100");
        assertThat(wallet.getEarnedPromoBalance()).isEqualByComparingTo("100");
    }
}
