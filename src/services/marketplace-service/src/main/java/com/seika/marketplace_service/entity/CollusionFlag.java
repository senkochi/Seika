package com.seika.marketplace_service.entity;

import com.seika.marketplace_service.enums.CollusionFlagStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(
    name = "collusion_flags",
    indexes = {
        @Index(name = "idx_collusion_flags_pair", columnList = "teacher_id, buyer_id"),
        @Index(name = "idx_collusion_flags_status", columnList = "status")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CollusionFlag {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(name = "teacher_id", nullable = false)
    String teacherId;

    @Column(name = "buyer_id", nullable = false)
    String buyerId;

    @Column(name = "risk_score", nullable = false)
    int riskScore;

    @Column(name = "transaction_count", nullable = false)
    int transactionCount;

    @Column(name = "promo_backed_ratio", nullable = false, precision = 5, scale = 4)
    BigDecimal promoBackedRatio;

    @Column(name = "no_consume_ratio", nullable = false, precision = 5, scale = 4)
    BigDecimal noConsumeRatio;

    @Column(name = "reciprocal_ratio", nullable = false, precision = 5, scale = 4)
    BigDecimal reciprocalRatio;

    @Column(name = "review_velocity_abnormal", nullable = false)
    boolean reviewVelocityAbnormal;

    @Column(name = "lookback_start", nullable = false)
    Instant lookbackStart;

    @Column(name = "lookback_end", nullable = false)
    Instant lookbackEnd;

    @Column(name = "last_evaluated_at", nullable = false)
    Instant lastEvaluatedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    CollusionFlagStatus status;

    @Column(name = "admin_id")
    String adminId;

    @Column(name = "admin_reason", length = 1000)
    String adminReason;

    @Column(name = "resolved_at")
    Instant resolvedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    Instant updatedAt;
}
