package com.seika.marketplace_service.event;

import lombok.*;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContentConsumedEvent {
    private String eventId;
    private String eventType;
    private String userId;
    private String productId;
    private String referenceId;
    private String productType;
    private Instant consumedAt;
}
