package com.seika.profile_service.event;

import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Published by flashcard-service when a CardSet is created.
 * Routing key: flashcard.set.created
 * Exchange: content.events
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FlashcardSetCreatedEvent {
    String eventId;
    String cardSetId;
    String createdBy;   // userId of the teacher who created the flashcard set
    String title;
    String description;
    java.math.BigDecimal price;
}

