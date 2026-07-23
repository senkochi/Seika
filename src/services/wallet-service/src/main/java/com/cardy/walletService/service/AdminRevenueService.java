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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
        BigDecimal paidCoinCirculation = wallets.stream()
                .map(wallet -> zeroIfNull(wallet.getPaidBalance()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal nonWithdrawableCoinCirculation = wallets.stream()
                .map(wallet -> zeroIfNull(wallet.getBonusBalance())
                        .add(zeroIfNull(wallet.getRewardBalance()))
                        .add(zeroIfNull(wallet.getPaidBalance()))
                        .add(zeroIfNull(wallet.getEarnedPromoBalance())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netRevenueVnd = totalTopupVnd.subtract(totalWithdrawalVnd);
        BigDecimal averageTopupRate = averageRate(totalTopupVnd, totalTopupCoins);
        BigDecimal averageWithdrawalRate = averageRate(totalWithdrawalVnd, totalWithdrawalCoins);
        BigDecimal paidBackedFeeEstimatedVnd = paidBackedFeeCoins.multiply(currentTopupRate);
        BigDecimal cashOutLiabilityVnd = withdrawableCoinCirculation.multiply(currentWithdrawalRate);
        BigDecimal totalCoinCirculation = withdrawableCoinCirculation.add(nonWithdrawableCoinCirculation);
        BigDecimal netCashAfterCurrentLiabilityVnd = netRevenueVnd.subtract(cashOutLiabilityVnd);

        return AdminRevenueStatsDTO.builder()
                .totalTopupCoins(totalTopupCoins)
                .totalTopupVnd(totalTopupVnd)
                .totalWithdrawalCoins(totalWithdrawalCoins)
                .totalWithdrawalVnd(totalWithdrawalVnd)
                .averageTopupRate(averageTopupRate)
                .averageWithdrawalRate(averageWithdrawalRate)
                // Compatibility alias: historical clients still read realRevenueVnd.
                .realRevenueVnd(paidBackedFeeEstimatedVnd)
                .paidBackedFeeEstimatedVnd(paidBackedFeeEstimatedVnd)
                .paidBackedFeeCoins(paidBackedFeeCoins)
                .promoSinkCoins(promoSinkCoins)
                .cashOutLiabilityVnd(cashOutLiabilityVnd)
                .withdrawableCoinCirculation(withdrawableCoinCirculation)
                .paidCoinCirculation(paidCoinCirculation)
                .nonWithdrawableCoinCirculation(nonWithdrawableCoinCirculation)
                .netRevenueVnd(netRevenueVnd)
                .totalCoinCirculation(totalCoinCirculation)
                .potentialLiabilityVnd(cashOutLiabilityVnd)
                // Compatibility alias: this is a current snapshot, not guaranteed profit.
                .guaranteedProfitVnd(netCashAfterCurrentLiabilityVnd)
                .netCashAfterCurrentLiabilityVnd(netCashAfterCurrentLiabilityVnd)
                .currentTopupRate(currentTopupRate)
                .currentWithdrawalRate(currentWithdrawalRate)
                .build();
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<AdminTransactionDTO> getSystemTransactions(String typeFilter, int page, int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        org.springframework.data.domain.Page<WalletLedgerEntry> ledgerEntriesPage;
        
        if ("TOP_UP".equalsIgnoreCase(typeFilter)) {
            ledgerEntriesPage = walletLedgerEntryRepository.findByTypeInOrderByCreatedAtDesc(List.of(WalletLedgerType.TOP_UP), pageable);
        } else if ("CASH_OUT".equalsIgnoreCase(typeFilter)) {
            ledgerEntriesPage = walletLedgerEntryRepository.findByTypeInOrderByCreatedAtDesc(List.of(WalletLedgerType.CASH_OUT), pageable);
        } else {
            ledgerEntriesPage = walletLedgerEntryRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        BigDecimal currentTopupRate = systemConfigService.getBigDecimal(
                SystemConfigService.KEY_TOPUP_VND_PER_COIN, new BigDecimal("100"));
        BigDecimal currentWithdrawalRate = systemConfigService.getBigDecimal(
                SystemConfigService.KEY_WITHDRAWAL_VND_PER_COIN, new BigDecimal("90"));

        return ledgerEntriesPage.map(entry -> {
            BigDecimal vnd = resolveAdminTransactionVnd(entry, currentTopupRate, currentWithdrawalRate);

            String userIdStr = entry.getUserId() != null ? entry.getUserId().toString() : "N/A";
            String username = entry.getWallet() != null
                    ? entry.getWallet().getUsername() : null;
            String walletIdStr = (entry.getWallet() != null && entry.getWallet().getId() != null)
                    ? entry.getWallet().getId().toString() : "N/A";

            return AdminTransactionDTO.builder()
                    .id(entry.getId() != null ? entry.getId().toString() : "")
                    .userId(userIdStr)
                    .username(username)
                    .walletId(walletIdStr)
                    .type(entry.getType() != null ? entry.getType().toString() : "")
                    .source(entry.getSource() != null ? entry.getSource().toString() : "")
                    .flowDirection(resolveAdminFlowDirection(entry.getType(), entry.getSource()))
                    .amount(entry.getAmount())
                    .amountVnd(vnd)
                    .description(entry.getDescription())
                    .createdAt(entry.getCreatedAt())
                    .build();
        });
    }

    private String resolveAdminFlowDirection(WalletLedgerType type, WalletLedgerSource source) {
        if (type == null) {
            return "NEUTRAL";
        }

        // The admin report follows the platform economic perspective, not the user wallet balance.
        return switch (type) {
            case TOP_UP, PLATFORM_FEE_REAL -> "INFLOW";
            case CASH_OUT -> "OUTFLOW";
            case ESCROW_RELEASE_CREDIT -> source == WalletLedgerSource.EARNED_WITHDRAWABLE
                    ? "OUTFLOW" : "NEUTRAL";
            case INITIAL_BONUS, LEARNING_REWARD, PURCHASE_DEBIT, ESCROW_REFUND_CREDIT,
                    PLATFORM_FEE_PROMO_SINK, WALLET_HOLD, WALLET_FREEZE, WALLET_UNFREEZE -> "NEUTRAL";
        };
    }

    private BigDecimal resolveAdminTransactionVnd(WalletLedgerEntry entry,
                                                   BigDecimal currentTopupRate,
                                                   BigDecimal currentWithdrawalRate) {
        if (entry.getType() == null) {
            return null;
        }

        return switch (entry.getType()) {
            case TOP_UP -> resolveLedgerVnd(entry, currentTopupRate);
            case CASH_OUT -> resolveLedgerVnd(entry, currentWithdrawalRate);
            case PLATFORM_FEE_REAL -> resolveLedgerVnd(entry, currentTopupRate);
            case ESCROW_RELEASE_CREDIT -> entry.getSource() == WalletLedgerSource.EARNED_WITHDRAWABLE
                    ? resolveLedgerVnd(entry, currentWithdrawalRate) : null;
            default -> null;
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

    private BigDecimal averageRate(BigDecimal totalVnd, BigDecimal totalCoins) {
        if (totalCoins.signum() == 0) {
            return BigDecimal.ZERO.setScale(2);
        }
        return totalVnd.divide(totalCoins, 2, RoundingMode.HALF_UP);
    }
}
