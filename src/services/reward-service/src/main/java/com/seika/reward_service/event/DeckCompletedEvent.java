package com.seika.reward_service.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeckCompletedEvent {
    private String eventId;
    private String correlationId;
    private String userId;
    private String deckId;
    private String completedAt;
}
