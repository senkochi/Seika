package com.cardy.walletService.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopUpReqDTO {
    private BigDecimal amountVnd;
}
