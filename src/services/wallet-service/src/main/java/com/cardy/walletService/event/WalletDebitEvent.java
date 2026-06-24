package com.cardy.walletService.event;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletDebitEvent {
    private String eventId;
    private String eventType;
    private String orderId;
}
