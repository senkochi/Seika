package com.seika.profile_service.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RewardGrantedEvent {
    private String eventId;
    private String correlationId;
    private String userId;
    private Integer coins;
    private Integer exp;
    private String source;
    private String itemId;
}
