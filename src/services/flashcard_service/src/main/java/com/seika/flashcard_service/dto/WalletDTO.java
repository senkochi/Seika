package com.seika.flashcard_service.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletDTO {
    private BigDecimal amount;
    private String description;
}
