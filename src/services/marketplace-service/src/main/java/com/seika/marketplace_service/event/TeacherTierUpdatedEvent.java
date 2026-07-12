package com.seika.marketplace_service.event;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherTierUpdatedEvent {
    private String eventId;
    private String eventType;
    private String teacherId;
    private String tier;
    private BigDecimal averageRating;
    private long validReviewCount;
    private BigDecimal tierFeePercent;
    private Instant occurredAt;
}
