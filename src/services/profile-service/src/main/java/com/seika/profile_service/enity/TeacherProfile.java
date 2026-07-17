package com.seika.profile_service.enity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(
    name = "teacher_profile",
    indexes = {
        @Index(name = "idx_teacher_profile_user_id", columnList = "user_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TeacherProfile {

    @Id
    @Column(name = "user_id")
    String userId;

    @Column(name = "total_quiz_created", nullable = false)
    @Builder.Default
    int totalQuizCreated = 0;

    @Column(name = "total_flashcards_created", nullable = false)
    @Builder.Default
    int totalFlashcardsCreated = 0;

    @Column(name = "total_students_reached", nullable = false)
    @Builder.Default
    int totalStudentsReached = 0;

    @Column(name = "teacher_tier", length = 32)
    @Builder.Default
    String teacherTier = "NEWBIE";

    @Column(name = "teacher_average_rating", precision = 4, scale = 2)
    @Builder.Default
    BigDecimal teacherAverageRating = BigDecimal.ZERO;

    @Column(name = "teacher_valid_review_count")
    @Builder.Default
    long teacherValidReviewCount = 0L;

    @Column(name = "teacher_tier_fee_percent", precision = 5, scale = 2)
    @Builder.Default
    BigDecimal teacherTierFeePercent = new BigDecimal("20.00");

    @Column(name = "teacher_tier_updated_at")
    Instant teacherTierUpdatedAt;

    @Column(name = "last_processed_event_id", length = 64)
    String lastProcessedEventId;
}
