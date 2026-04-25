package com.cardy.walletService.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionReqDTO {
    private BigDecimal amount;
    private String description;
}
