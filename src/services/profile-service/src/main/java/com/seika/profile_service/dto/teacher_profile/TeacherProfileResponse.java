package com.seika.profile_service.dto.teacher_profile;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TeacherProfileResponse {
    // --- Personal info (from UserProfile) ---
    String id;
    String userId;
    String fullName;
    LocalDate dateOfBirth;
    String gender;
    String profilePictureUrl;

    // --- Gamification (from GameProfile) ---
    long exp;
    int level;

    // --- Teacher stats (from TeacherProfile) ---
    int totalQuizCreated;
    int totalFlashcardsCreated;
    int totalStudentsReached;

    // --- Marketplace display mirror (marketplace-service remains source of truth) ---
    String teacherTier;
    BigDecimal teacherAverageRating;
    long teacherValidReviewCount;
    BigDecimal teacherTierFeePercent;
    Instant teacherTierUpdatedAt;
}
