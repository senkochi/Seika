package com.seika.profile_service.event;

import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Published by quiz-service when a QuizSet is created.
 * Routing key: quiz.set.created
 * Exchange: content.events
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class QuizSetCreatedEvent {
    String eventId;
    String quizSetId;
    String createdBy;   // userId of the teacher who created the quiz set
    String title;
    String description;
    java.math.BigDecimal price;
}

