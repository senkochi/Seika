package com.seika.profile_service.event;

import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Published by marketplace-service when a purchase order is PAID (wallet.debit.succeeded).
 * Routing key: content.purchased
 * Exchange: marketplace.events
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ContentPurchasedEvent {
    String eventId;
    String orderId;
    String buyerUserId;    // student who purchased
    String teacherUserId;  // teacher who created the content (for incrementing totalStudentsReached)
    String productId;
    String productType;    // FLASHCARD_SET, QUIZ_SET
    java.math.BigDecimal price;
}

