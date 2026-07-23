package com.cardy.walletService.dto.admin;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminTransactionDTO {
    private String id;
    private String userId;
    private String username;
    private String walletId;
    private String type;
    private String source;
    private String flowDirection;
    private BigDecimal amount;
    private BigDecimal amountVnd;
    private String description;
    private LocalDateTime createdAt;
}
