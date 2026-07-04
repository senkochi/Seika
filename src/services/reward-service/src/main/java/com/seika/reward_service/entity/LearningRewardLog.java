package com.seika.reward_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "learning_reward_logs", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "reward_type", "item_id"})
}, indexes = {
        @Index(name = "idx_user_reward", columnList = "user_id, reward_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearningRewardLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "reward_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private RewardType rewardType;

    @Column(name = "item_id", nullable = false)
    private String itemId;

    @Column(name = "reward_count", nullable = false)
    private Integer rewardCount;

    @Column(name = "last_reward_at", nullable = false)
    private LocalDateTime lastRewardAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
