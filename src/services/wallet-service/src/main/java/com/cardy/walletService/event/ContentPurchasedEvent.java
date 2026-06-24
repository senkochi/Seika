package com.cardy.walletService.event;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContentPurchasedEvent {
    private String eventId;
    private String orderId;
    private String buyerUserId;
    private String teacherUserId;
    private String productId;
    private String productType;
    private BigDecimal price;
}
