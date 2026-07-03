package com.seika.notification_service.event;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ContentPurchasedEvent {
    String eventId;
    String orderId;
    String buyerUserId;
    String teacherUserId;
    String productId;
    String productType;
    String productName;
    java.math.BigDecimal price;
}
