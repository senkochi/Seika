package com.cardy.walletService.event;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletUpdatedEvent {
    private String eventId;
    private String userId;
    private BigDecimal amount;
    private String transactionType;
    private String description;
    private Instant createdAt;
}
