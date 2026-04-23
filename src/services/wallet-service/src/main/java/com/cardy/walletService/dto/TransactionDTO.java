package com.cardy.walletService.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionDTO {
    private String id;
    private BigDecimal amount;
    private String description;
    private LocalDateTime createdAt;
}
