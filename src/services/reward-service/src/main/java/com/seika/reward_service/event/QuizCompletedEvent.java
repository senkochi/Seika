package com.seika.reward_service.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizCompletedEvent {
    private String eventId;
    private String correlationId;
    private String userId;
    private String quizId;
    private Boolean passed;
    private Double score;
    private String completedAt;
}
