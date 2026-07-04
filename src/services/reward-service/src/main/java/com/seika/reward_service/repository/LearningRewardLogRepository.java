package com.seika.reward_service.repository;

import com.seika.reward_service.entity.LearningRewardLog;
import com.seika.reward_service.entity.RewardType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LearningRewardLogRepository extends JpaRepository<LearningRewardLog, Long> {
    Optional<LearningRewardLog> findByUserIdAndRewardTypeAndItemId(String userId, RewardType rewardType, String itemId);
}
