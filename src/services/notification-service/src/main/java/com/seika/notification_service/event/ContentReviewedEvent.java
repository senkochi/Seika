package com.seika.notification_service.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonIgnoreProperties(ignoreUnknown = true)
public class ContentReviewedEvent {
    String eventId;
    String productId;
    String productType;
    String productName;
    String teacherUserId;
    String status;
    String rejectionReason;
}
