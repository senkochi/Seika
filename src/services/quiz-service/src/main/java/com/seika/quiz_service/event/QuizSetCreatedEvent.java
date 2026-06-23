package com.seika.quiz_service.event;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class QuizSetCreatedEvent {
    String eventId;
    String quizSetId;
    String createdBy;
}

