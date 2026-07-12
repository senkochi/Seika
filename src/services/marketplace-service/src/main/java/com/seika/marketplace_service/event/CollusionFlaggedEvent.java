package com.seika.marketplace_service.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CollusionFlaggedEvent {
    private String flagId;
    private String teacherId;
    private String buyerId;
    private int riskScore;
    private String status; // SUSPICIOUS, CONFIRMED, MALICIOUS
    private String reason;
}
