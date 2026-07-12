package com.seika.marketplace_service.entity;

import com.seika.marketplace_service.enums.TeacherTier;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "teacher_ratings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TeacherRating {
    @Id
    @Column(name = "teacher_id", nullable = false)
    String teacherId;

    @Column(name = "average_rating", nullable = false, precision = 4, scale = 2)
    @Builder.Default
    BigDecimal averageRating = BigDecimal.ZERO;

    @Column(name = "valid_review_count", nullable = false)
    @Builder.Default
    long validReviewCount = 0;

    @Column(name = "excluded_review_count", nullable = false)
    @Builder.Default
    long excludedReviewCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    TeacherTier tier = TeacherTier.NEWBIE;

    @Column(name = "tier_fee_percent", nullable = false, precision = 8, scale = 2)
    @Builder.Default
    BigDecimal tierFeePercent = new BigDecimal("20");

    @Column(name = "consume_rate", nullable = false, precision = 5, scale = 4)
    @Builder.Default
    BigDecimal consumeRate = BigDecimal.ZERO;

    @Column(name = "refund_rate", nullable = false, precision = 5, scale = 4)
    @Builder.Default
    BigDecimal refundRate = BigDecimal.ZERO;

    @Column(name = "approval_rejection_rate", nullable = false, precision = 5, scale = 4)
    @Builder.Default
    BigDecimal approvalRejectionRate = BigDecimal.ZERO;

    @UpdateTimestamp
    @Column(name = "updated_at")
    Instant updatedAt;
}
