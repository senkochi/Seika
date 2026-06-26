package com.seika.reward_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RewardStatusResponse {
    private boolean eligible;
    private LocalDateTime nextEligibleAt;
    private Integer rewardCount;
}
