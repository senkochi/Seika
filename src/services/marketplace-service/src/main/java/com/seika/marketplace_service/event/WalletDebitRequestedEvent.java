package com.seika.marketplace_service.event;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WalletDebitRequestedEvent {
    String eventId;
    String eventType;
    String orderId;
    String userId;
    BigDecimal amount;
    String description;
}
