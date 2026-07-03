package com.cardy.walletService.service;

import com.cardy.walletService.domain.Transaction;
import com.cardy.walletService.domain.Wallet;
import com.cardy.walletService.dto.admin.AdminRevenueStatsDTO;
import com.cardy.walletService.dto.admin.AdminTransactionDTO;
import com.cardy.walletService.enums.TransactionType;
import com.cardy.walletService.repository.TransactionRepository;
import com.cardy.walletService.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminRevenueService {

    private final TransactionRepository transactionRepository;
    private final WalletRepository walletRepository;
    private final SystemConfigService systemConfigService;

    private static final Pattern TOPUP_VND_PATTERN = Pattern.compile("Nạp tiền:\\s*([0-9.]+)\\s*VNĐ");
    private static final Pattern CASHOUT_VND_PATTERN = Pattern.compile("=\\s*([0-9.]+)\\s*VNĐ");
    private static final Pattern GENERIC_VND_PATTERN = Pattern.compile("([0-9.]+)\\s*VNĐ");

    @Transactional(readOnly = true)
    public AdminRevenueStatsDTO getRevenueStats() {
        BigDecimal currentTopupRate = systemConfigService.getBigDecimal(
                SystemConfigService.KEY_TOPUP_VND_PER_COIN, new BigDecimal("100"));
        BigDecimal currentWithdrawalRate = systemConfigService.getBigDecimal(
                SystemConfigService.KEY_WITHDRAWAL_VND_PER_COIN, new BigDecimal("90"));

        List<Transaction> allTransactions = transactionRepository.findAll();

        BigDecimal totalTopupCoins = BigDecimal.ZERO;
        BigDecimal totalTopupVnd = BigDecimal.ZERO;
        BigDecimal totalWithdrawalCoins = BigDecimal.ZERO;
        BigDecimal totalWithdrawalVnd = BigDecimal.ZERO;

        for (Transaction tx : allTransactions) {
            if (tx.getType() == TransactionType.TOP_UP) {
                totalTopupCoins = totalTopupCoins.add(tx.getAmount());
                BigDecimal vnd = resolveVnd(tx, currentTopupRate, true);
                totalTopupVnd = totalTopupVnd.add(vnd);
            } else if (tx.getType() == TransactionType.CASH_OUT) {
                BigDecimal absAmount = tx.getAmount() != null ? tx.getAmount().abs() : BigDecimal.ZERO;
                totalWithdrawalCoins = totalWithdrawalCoins.add(absAmount);
                BigDecimal vnd = resolveVnd(tx, currentWithdrawalRate, false);
                totalWithdrawalVnd = totalWithdrawalVnd.add(vnd);
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
        List<Transaction> transactions;
        if ("TOP_UP".equalsIgnoreCase(typeFilter)) {
            transactions = transactionRepository.findByTypeInOrderByCreatedAtDesc(List.of(TransactionType.TOP_UP));
        } else if ("CASH_OUT".equalsIgnoreCase(typeFilter)) {
            transactions = transactionRepository.findByTypeInOrderByCreatedAtDesc(List.of(TransactionType.CASH_OUT));
        } else {
            transactions = transactionRepository.findAllByOrderByCreatedAtDesc();
        }

        BigDecimal currentTopupRate = systemConfigService.getBigDecimal(
                SystemConfigService.KEY_TOPUP_VND_PER_COIN, new BigDecimal("100"));
        BigDecimal currentWithdrawalRate = systemConfigService.getBigDecimal(
                SystemConfigService.KEY_WITHDRAWAL_VND_PER_COIN, new BigDecimal("90"));

        return transactions.stream().map(tx -> {
            BigDecimal vnd = BigDecimal.ZERO;
            if (tx.getType() == TransactionType.TOP_UP) {
                vnd = resolveVnd(tx, currentTopupRate, true);
            } else if (tx.getType() == TransactionType.CASH_OUT) {
                vnd = resolveVnd(tx, currentWithdrawalRate, false);
            }

            String userIdStr = (tx.getWallet() != null && tx.getWallet().getUserId() != null)
                    ? tx.getWallet().getUserId().toString() : "N/A";
            String walletIdStr = (tx.getWallet() != null && tx.getWallet().getId() != null)
                    ? tx.getWallet().getId().toString() : "N/A";

            return AdminTransactionDTO.builder()
                    .id(tx.getId() != null ? tx.getId().toString() : "")
                    .userId(userIdStr)
                    .walletId(walletIdStr)
                    .type(tx.getType() != null ? tx.getType().toString() : "")
                    .amount(tx.getAmount())
                    .amountVnd(vnd)
                    .description(tx.getDescription())
                    .createdAt(tx.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    private BigDecimal resolveVnd(Transaction tx, BigDecimal defaultRate, boolean isTopUp) {
        if (tx.getDescription() != null) {
            Matcher m = isTopUp ? TOPUP_VND_PATTERN.matcher(tx.getDescription()) : CASHOUT_VND_PATTERN.matcher(tx.getDescription());
            if (m.find()) {
                try {
                    return new BigDecimal(m.group(1));
                } catch (Exception ignored) {}
            }
            Matcher generic = GENERIC_VND_PATTERN.matcher(tx.getDescription());
            if (generic.find()) {
                try {
                    return new BigDecimal(generic.group(1));
                } catch (Exception ignored) {}
            }
        }
        BigDecimal absAmount = tx.getAmount() != null ? tx.getAmount().abs() : BigDecimal.ZERO;
        return absAmount.multiply(defaultRate);
    }
}
