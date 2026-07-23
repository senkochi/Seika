package com.cardy.walletService.service;

import com.cardy.walletService.enums.WalletLedgerSource;

import java.math.BigDecimal;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

public record WalletDebitResult(Map<WalletLedgerSource, BigDecimal> amounts, List<String> ledgerEntryIds) {

    public WalletDebitResult(Map<WalletLedgerSource, BigDecimal> amounts) {
        this(amounts, List.of());
    }

    public WalletDebitResult {
        EnumMap<WalletLedgerSource, BigDecimal> normalized = new EnumMap<>(WalletLedgerSource.class);
        if (amounts != null) {
            amounts.forEach((source, amount) -> {
                if (source != null && amount != null && amount.compareTo(BigDecimal.ZERO) > 0) {
                    normalized.put(source, amount);
                }
            });
        }
        amounts = Map.copyOf(normalized);
        ledgerEntryIds = ledgerEntryIds == null ? List.of() : List.copyOf(ledgerEntryIds);
    }

    public BigDecimal amountFor(WalletLedgerSource source) {
        return amounts.getOrDefault(source, BigDecimal.ZERO);
    }

    public BigDecimal bonusAmount() {
        return amountFor(WalletLedgerSource.BONUS);
    }

    public BigDecimal rewardAmount() {
        return amountFor(WalletLedgerSource.REWARD);
    }

    public BigDecimal earnedPromoAmount() {
        return amountFor(WalletLedgerSource.EARNED_PROMO);
    }

    public BigDecimal paidAmount() {
        return amountFor(WalletLedgerSource.PAID);
    }

    public BigDecimal promoBackedAmount() {
        return bonusAmount().add(rewardAmount()).add(earnedPromoAmount());
    }
}
