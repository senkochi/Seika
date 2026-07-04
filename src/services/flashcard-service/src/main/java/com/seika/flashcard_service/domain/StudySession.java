package com.seika.flashcard_service.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Records the moment a student completes (or partially completes) studying a
 * CardSet. Consumed by teacher Statistics endpoints to compute distinct
 * students per deck and completion time series.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "study_sessions")
@CompoundIndex(name = "study_cardset_user", def = "{'cardSetId': 1, 'userId': 1}")
public class StudySession {

    @Id
    private String id;

    @Indexed
    private String userId;

    @Indexed
    private String cardSetId;

    /** True when the student marked the deck as completed. */
    private boolean completed;

    /** 0-100 progress percentage at the moment of the request. */
    private double progress;

    private Instant studiedAt;
}