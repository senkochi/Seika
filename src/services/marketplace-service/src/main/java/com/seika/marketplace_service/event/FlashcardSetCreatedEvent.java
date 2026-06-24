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
public class FlashcardSetCreatedEvent {
    String eventId;
    String cardSetId;
    String createdBy;
    String title;
    String description;
    BigDecimal price;
}
