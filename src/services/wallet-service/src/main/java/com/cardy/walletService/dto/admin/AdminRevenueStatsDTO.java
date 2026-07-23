package com.cardy.walletService.dto.admin;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminRevenueStatsDTO {
    private BigDecimal totalTopupCoins;
    private BigDecimal totalTopupVnd;
    private BigDecimal totalWithdrawalCoins;
    private BigDecimal totalWithdrawalVnd;
    private BigDecimal averageTopupRate;
    private BigDecimal averageWithdrawalRate;
    private BigDecimal realRevenueVnd;
    private BigDecimal paidBackedFeeEstimatedVnd;
    private BigDecimal paidBackedFeeCoins;
    private BigDecimal promoSinkCoins;
    private BigDecimal cashOutLiabilityVnd;
    private BigDecimal withdrawableCoinCirculation;
    private BigDecimal paidCoinCirculation;
    private BigDecimal nonWithdrawableCoinCirculation;
    private BigDecimal netRevenueVnd;
    private BigDecimal totalCoinCirculation;
    private BigDecimal potentialLiabilityVnd;
    private BigDecimal guaranteedProfitVnd;
    private BigDecimal netCashAfterCurrentLiabilityVnd;
    private BigDecimal currentTopupRate;
    private BigDecimal currentWithdrawalRate;
}
