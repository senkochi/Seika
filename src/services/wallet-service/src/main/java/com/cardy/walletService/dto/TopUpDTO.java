package com.cardy.walletService.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopUpDTO {
    private BigDecimal coinsReceived;
    private BigDecimal amountVnd;
    private BigDecimal rate;
    private String message;
}
