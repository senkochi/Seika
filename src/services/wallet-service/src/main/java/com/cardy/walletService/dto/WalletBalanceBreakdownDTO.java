package com.cardy.walletService.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletBalanceBreakdownDTO {
    private BigDecimal balance;
    private BigDecimal bonusBalance;
    private BigDecimal rewardBalance;
    private BigDecimal paidBalance;
    private BigDecimal earnedWithdrawableBalance;
    private BigDecimal earnedPromoBalance;
    private BigDecimal heldBalance;
    private boolean frozen;
}
