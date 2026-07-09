package com.cardy.walletService.service;

import com.cardy.walletService.domain.Wallet;
import com.cardy.walletService.enums.WalletLedgerSource;

import java.math.BigDecimal;
import java.util.EnumMap;
import java.util.function.Consumer;
import java.util.function.Supplier;

public final class WalletSourceAllocator {

    private WalletSourceAllocator() {
    }

    public static WalletDebitResult allocatePurchase(Wallet wallet, BigDecimal amount) {
        requirePositive(amount);
        requireActive(wallet);
        EnumMap<WalletLedgerSource, BigDecimal> allocation = new EnumMap<>(WalletLedgerSource.class);
        BigDecimal remaining = amount;

        remaining = take(remaining, wallet::getBonusBalance, wallet::setBonusBalance, WalletLedgerSource.BONUS, allocation);
        remaining = take(remaining, wallet::getRewardBalance, wallet::setRewardBalance, WalletLedgerSource.REWARD, allocation);
        remaining = take(remaining, wallet::getPaidBalance, wallet::setPaidBalance, WalletLedgerSource.PAID, allocation);
        remaining = take(remaining, wallet::getEarnedPromoBalance, wallet::setEarnedPromoBalance, WalletLedgerSource.EARNED_PROMO, allocation);

        if (remaining.compareTo(BigDecimal.ZERO) > 0) {
            throw new IllegalStateException("Số dư không đủ để thực hiện giao dịch!");
        }
        wallet.recalculateBalance();
        return new WalletDebitResult(allocation);
    }

    public static WalletDebitResult allocateCashOut(Wallet wallet, BigDecimal amount) {
        requirePositive(amount);
        requireActive(wallet);
        BigDecimal withdrawable = zeroIfNull(wallet.getEarnedWithdrawableBalance());
        if (withdrawable.compareTo(amount) < 0) {
            throw new IllegalStateException("Số dư có thể rút không đủ để thực hiện giao dịch!");
        }
        wallet.setEarnedWithdrawableBalance(withdrawable.subtract(amount));
        wallet.recalculateBalance();
        return new WalletDebitResult(Maps.of(WalletLedgerSource.EARNED_WITHDRAWABLE, amount));
    }

    private static BigDecimal take(BigDecimal remaining,
                                   Supplier<BigDecimal> getter,
                                   Consumer<BigDecimal> setter,
                                   WalletLedgerSource source,
                                   EnumMap<WalletLedgerSource, BigDecimal> allocation) {
        if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal current = zeroIfNull(getter.get());
        if (current.compareTo(BigDecimal.ZERO) <= 0) {
            setter.accept(BigDecimal.ZERO);
            return remaining;
        }
        BigDecimal used = current.min(remaining);
        setter.accept(current.subtract(used));
        allocation.put(source, used);
        return remaining.subtract(used);
    }

    private static void requirePositive(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("amount must be positive");
        }
    }

    private static void requireActive(Wallet wallet) {
        if (wallet != null && wallet.isFrozen()) {
            throw new IllegalStateException("Ví đang bị khóa, không thể thực hiện giao dịch.");
        }
    }

    private static BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private static final class Maps {
        private Maps() {
        }

        private static EnumMap<WalletLedgerSource, BigDecimal> of(WalletLedgerSource source, BigDecimal amount) {
            EnumMap<WalletLedgerSource, BigDecimal> map = new EnumMap<>(WalletLedgerSource.class);
            map.put(source, amount);
            return map;
        }
    }
}
