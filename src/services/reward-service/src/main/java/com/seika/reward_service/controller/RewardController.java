package com.seika.reward_service.controller;

import com.seika.reward_service.dto.RewardStatusResponse;
import com.seika.reward_service.entity.LearningRewardLog;
import com.seika.reward_service.entity.RewardType;
import com.seika.reward_service.repository.LearningRewardLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Optional;

@RestController
@RequestMapping("/api/rewards")
@RequiredArgsConstructor
public class RewardController {

    private final LearningRewardLogRepository repository;

    @Value("${reward.flashcard.cooldown-days}")
    private Integer flashcardCooldownDays;

    @GetMapping("/status")
    public ResponseEntity<RewardStatusResponse> getRewardStatus(
            @RequestHeader("X-User-Id") String userId,
            @RequestParam("type") String type,
            @RequestParam("itemId") String itemId) {

        RewardType rewardType;
        try {
            rewardType = RewardType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }

        Optional<LearningRewardLog> logOptional = repository.findByUserIdAndRewardTypeAndItemId(userId, rewardType, itemId);

        if (logOptional.isEmpty()) {
            return ResponseEntity.ok(RewardStatusResponse.builder()
                    .eligible(true)
                    .nextEligibleAt(LocalDateTime.now())
                    .rewardCount(0)
                    .build());
        }

        LearningRewardLog rewardLog = logOptional.get();

        if (rewardType == RewardType.QUIZ) {
            // Quiz is one-time only
            return ResponseEntity.ok(RewardStatusResponse.builder()
                    .eligible(false)
                    .nextEligibleAt(null)
                    .rewardCount(rewardLog.getRewardCount())
                    .build());
        }

        if (rewardType == RewardType.FLASHCARD) {
            LocalDateTime nextEligibleAt = rewardLog.getLastRewardAt().plusDays(flashcardCooldownDays);
            boolean eligible = LocalDateTime.now().isAfter(nextEligibleAt);
            
            return ResponseEntity.ok(RewardStatusResponse.builder()
                    .eligible(eligible)
                    .nextEligibleAt(eligible ? LocalDateTime.now() : nextEligibleAt)
                    .rewardCount(rewardLog.getRewardCount())
                    .build());
        }

        return ResponseEntity.badRequest().build();
    }
}
