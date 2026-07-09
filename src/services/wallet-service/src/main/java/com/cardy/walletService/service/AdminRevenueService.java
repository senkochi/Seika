package com.cardy.walletService.service;

import com.cardy.walletService.domain.Transaction;
import com.cardy.walletService.domain.Wallet;
import com.cardy.walletService.domain.WalletLedgerEntry;
import com.cardy.walletService.dto.admin.AdminRevenueStatsDTO;
import com.cardy.walletService.dto.admin.AdminTransactionDTO;
import com.cardy.walletService.enums.TransactionType;
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
import java.util.Objects;
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

        for (WalletLedgerEntry entry : allLedgerEntries) {
            if (entry.getType() == WalletLedgerType.TOP_UP) {
                BigDecimal coins = entry.getAmount() != null ? entry.getAmount() : BigDecimal.ZERO;
                totalTopupCoins = totalTopupCoins.add(coins);
                totalTopupVnd = totalTopupVnd.add(resolveLedgerVnd(entry, currentTopupRate));
            } else if (entry.getType() == WalletLedgerType.CASH_OUT) {
                BigDecimal absAmount = entry.getAmount() != null ? entry.getAmount().abs() : BigDecimal.ZERO;
                totalWithdrawalCoins = totalWithdrawalCoins.add(absAmount);
                totalWithdrawalVnd = totalWithdrawalVnd.add(resolveLedgerVnd(entry, currentWithdrawalRate));
            }
        }

        BigDecimal netRevenueVnd = totalTopupVnd.subtract(totalWithdrawalVnd);

        BigDecimal totalCoinCirculation = walletRepository.findAll().stream()
                .map(Wallet::getBalance)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal potentialLiabilityVnd = totalCoinCirculation.multiply(currentWithdrawalRate);
        BigDecimal guaranteedProfitVnd = netRevenueVnd.subtract(potentialLiabilityVnd);

        return AdminRevenueStatsDTO.builder()
                .totalTopupCoins(totalTopupCoins)
                .totalTopupVnd(totalTopupVnd)
                .totalWithdrawalCoins(totalWithdrawalCoins)
                .totalWithdrawalVnd(totalWithdrawalVnd)
                .netRevenueVnd(netRevenueVnd)
                .totalCoinCirculation(totalCoinCirculation)
                .potentialLiabilityVnd(potentialLiabilityVnd)
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
                    .amount(entry.getAmount())
                    .amountVnd(vnd)
                    .description(entry.getDescription())
                    .createdAt(entry.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    private BigDecimal resolveLedgerVnd(WalletLedgerEntry entry, BigDecimal defaultRate) {
        if (entry.getAmountVnd() != null) {
            return entry.getAmountVnd();
        }
        BigDecimal absAmount = entry.getAmount() != null ? entry.getAmount().abs() : BigDecimal.ZERO;
        BigDecimal rate = entry.getRateVndPerCoin() != null ? entry.getRateVndPerCoin() : defaultRate;
        return absAmount.multiply(rate);
    }
}
