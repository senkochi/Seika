package com.cardy.walletService.event;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletDebitRequestedEvent {
    private String eventId;
    private String eventType;
    private String orderId;
    private String userId;
    private BigDecimal amount;
    private String description;
}
