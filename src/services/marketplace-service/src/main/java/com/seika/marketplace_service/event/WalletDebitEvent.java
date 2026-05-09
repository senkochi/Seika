package com.seika.marketplace_service.event;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WalletDebitEvent {
    String eventId;
    String eventType;
    String orderId;
    String userId;
    String reason;
}
