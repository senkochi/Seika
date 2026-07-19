package com.cardy.walletService.service;

import com.cardy.walletService.domain.Wallet;
import com.cardy.walletService.domain.WalletLedgerEntry;
import com.cardy.walletService.dto.admin.AdminRevenueStatsDTO;
import com.cardy.walletService.dto.admin.AdminTransactionDTO;
import com.cardy.walletService.enums.WalletLedgerType;
import com.cardy.walletService.repository.TransactionRepository;
import com.cardy.walletService.repository.WalletLedgerEntryRepository;
import com.cardy.walletService.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminRevenueService {

    private final TransactionRepository transactionRepository;
    private final WalletLedgerEntryRepository walletLedgerEntryRepository;
    private final WalletRepository walletRepository;
    private final SystemConfigService systemConfigService;

    @Transactional(readOnly = true)
    public AdminRevenueStatsDTO getRevenueStats() {
        BigDecimal currentTopupRate = systemConfigService.getBigDecimal(
                SystemConfigService.KEY_TOPUP_VND_PER_COIN, new BigDecimal("100"));
        BigDecimal currentWithdrawalRate = systemConfigService.getBigDecimal(
                SystemConfigService.KEY_WITHDRAWAL_VND_PER_COIN, new BigDecimal("90"));

        List<WalletLedgerEntry> allLedgerEntries = walletLedgerEntryRepository.findAll();

        BigDecimal totalTopupCoins = BigDecimal.ZERO;
        BigDecimal totalTopupVnd = BigDecimal.ZERO;
        BigDecimal totalWithdrawalCoins = BigDecimal.ZERO;
        BigDecimal totalWithdrawalVnd = BigDecimal.ZERO;
        BigDecimal paidBackedFeeCoins = BigDecimal.ZERO;
        BigDecimal promoSinkCoins = BigDecimal.ZERO;

        for (WalletLedgerEntry entry : allLedgerEntries) {
            if (entry.getType() == WalletLedgerType.TOP_UP) {
                BigDecimal coins = zeroIfNull(entry.getAmount());
                totalTopupCoins = totalTopupCoins.add(coins);
                totalTopupVnd = totalTopupVnd.add(resolveLedgerVnd(entry, currentTopupRate));
            } else if (entry.getType() == WalletLedgerType.CASH_OUT) {
                BigDecimal absAmount = absAmount(entry);
                totalWithdrawalCoins = totalWithdrawalCoins.add(absAmount);
                totalWithdrawalVnd = totalWithdrawalVnd.add(resolveLedgerVnd(entry, currentWithdrawalRate));
            } else if (entry.getType() == WalletLedgerType.PLATFORM_FEE_REAL) {
                paidBackedFeeCoins = paidBackedFeeCoins.add(absAmount(entry));
            } else if (entry.getType() == WalletLedgerType.PLATFORM_FEE_PROMO_SINK) {
                promoSinkCoins = promoSinkCoins.add(absAmount(entry));
            }
        }

        List<Wallet> wallets = walletRepository.findAll();
        BigDecimal withdrawableCoinCirculation = wallets.stream()
                .map(wallet -> zeroIfNull(wallet.getEarnedWithdrawableBalance()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal nonWithdrawableCoinCirculation = wallets.stream()
                .map(wallet -> zeroIfNull(wallet.getBonusBalance())
                        .add(zeroIfNull(wallet.getRewardBalance()))
                        .add(zeroIfNull(wallet.getPaidBalance()))
                        .add(zeroIfNull(wallet.getEarnedPromoBalance())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netRevenueVnd = totalTopupVnd.subtract(totalWithdrawalVnd);
        BigDecimal realRevenueVnd = paidBackedFeeCoins.multiply(currentTopupRate);
        BigDecimal cashOutLiabilityVnd = withdrawableCoinCirculation.multiply(currentWithdrawalRate);
        BigDecimal totalCoinCirculation = withdrawableCoinCirculation.add(nonWithdrawableCoinCirculation);
        BigDecimal guaranteedProfitVnd = netRevenueVnd.subtract(cashOutLiabilityVnd);

        return AdminRevenueStatsDTO.builder()
                .totalTopupCoins(totalTopupCoins)
                .totalTopupVnd(totalTopupVnd)
                .totalWithdrawalCoins(totalWithdrawalCoins)
                .totalWithdrawalVnd(totalWithdrawalVnd)
                .realRevenueVnd(realRevenueVnd)
                .paidBackedFeeCoins(paidBackedFeeCoins)
                .promoSinkCoins(promoSinkCoins)
                .cashOutLiabilityVnd(cashOutLiabilityVnd)
                .withdrawableCoinCirculation(withdrawableCoinCirculation)
                .nonWithdrawableCoinCirculation(nonWithdrawableCoinCirculation)
                .netRevenueVnd(netRevenueVnd)
                .totalCoinCirculation(totalCoinCirculation)
                .potentialLiabilityVnd(cashOutLiabilityVnd)
                .guaranteedProfitVnd(guaranteedProfitVnd)
                .currentTopupRate(currentTopupRate)
                .currentWithdrawalRate(currentWithdrawalRate)
                .build();
    }

    @Transactional(readOnly = true)
    public List<AdminTransactionDTO> getSystemTransactions(String typeFilter) {
        List<WalletLedgerEntry> ledgerEntries;
        if ("TOP_UP".equalsIgnoreCase(typeFilter)) {
            ledgerEntries = walletLedgerEntryRepository.findByTypeInOrderByCreatedAtDesc(List.of(WalletLedgerType.TOP_UP));
        } else if ("CASH_OUT".equalsIgnoreCase(typeFilter)) {
            ledgerEntries = walletLedgerEntryRepository.findByTypeInOrderByCreatedAtDesc(List.of(WalletLedgerType.CASH_OUT));
        } else {
            ledgerEntries = walletLedgerEntryRepository.findAllByOrderByCreatedAtDesc();
        }

        BigDecimal currentTopupRate = systemConfigService.getBigDecimal(
                SystemConfigService.KEY_TOPUP_VND_PER_COIN, new BigDecimal("100"));
        BigDecimal currentWithdrawalRate = systemConfigService.getBigDecimal(
                SystemConfigService.KEY_WITHDRAWAL_VND_PER_COIN, new BigDecimal("90"));

        return ledgerEntries.stream().map(entry -> {
            BigDecimal rate = entry.getType() == WalletLedgerType.CASH_OUT ? currentWithdrawalRate : currentTopupRate;
            BigDecimal vnd = resolveLedgerVnd(entry, rate);

            String userIdStr = entry.getUserId() != null ? entry.getUserId().toString() : "N/A";
            String walletIdStr = (entry.getWallet() != null && entry.getWallet().getId() != null)
                    ? entry.getWallet().getId().toString() : "N/A";

            return AdminTransactionDTO.builder()
                    .id(entry.getId() != null ? entry.getId().toString() : "")
                    .userId(userIdStr)
                    .walletId(walletIdStr)
                    .type(entry.getType() != null ? entry.getType().toString() : "")
                    .flowDirection(resolveAdminFlowDirection(entry.getType()))
                    .amount(entry.getAmount())
                    .amountVnd(vnd)
                    .description(entry.getDescription())
                    .createdAt(entry.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    private String resolveAdminFlowDirection(WalletLedgerType type) {
        if (type == null) {
            return "NEUTRAL";
        }

        // The admin report follows the platform economic perspective, not the user wallet balance.
        return switch (type) {
            case TOP_UP, PLATFORM_FEE_REAL -> "INFLOW";
            case INITIAL_BONUS, LEARNING_REWARD, ESCROW_RELEASE_CREDIT,
                    ESCROW_REFUND_CREDIT, CASH_OUT -> "OUTFLOW";
            case PURCHASE_DEBIT, PLATFORM_FEE_PROMO_SINK, WALLET_HOLD,
                    WALLET_FREEZE, WALLET_UNFREEZE -> "NEUTRAL";
        };
    }

    private BigDecimal resolveLedgerVnd(WalletLedgerEntry entry, BigDecimal defaultRate) {
        if (entry.getAmountVnd() != null) {
            return entry.getAmountVnd();
        }
        BigDecimal absAmount = absAmount(entry);
        BigDecimal rate = entry.getRateVndPerCoin() != null ? entry.getRateVndPerCoin() : defaultRate;
        return absAmount.multiply(rate);
    }

    private BigDecimal absAmount(WalletLedgerEntry entry) {
        return entry.getAmount() == null ? BigDecimal.ZERO : entry.getAmount().abs();
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
