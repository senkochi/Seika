package com.seika.flashcard_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeckCompletedEvent {
    private String eventId;
    private String correlationId;
    private String userId;
    private String deckId;
    private String completedAt;
}
