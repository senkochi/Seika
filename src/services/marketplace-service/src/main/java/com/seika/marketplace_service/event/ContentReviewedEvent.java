package com.seika.marketplace_service.event;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ContentReviewedEvent {
    String eventId;
    String productId;
    String productName;
    String productType;
    String teacherUserId;
    String status;
    String rejectionReason;
}
