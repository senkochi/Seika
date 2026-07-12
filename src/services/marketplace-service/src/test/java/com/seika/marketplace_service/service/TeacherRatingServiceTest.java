package com.seika.marketplace_service.service;

import com.seika.marketplace_service.enums.TeacherTier;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class TeacherRatingServiceTest {
    private final TeacherRatingService service = new TeacherRatingService(null, null, null, null, null);

    @Test
    void calculatesPhase2TierFromRatingAndValidReviewCountOnly() {
        assertThat(service.calculateTier(new BigDecimal("2.9"), 1000)).isEqualTo(TeacherTier.NEWBIE);
        assertThat(service.calculateTier(new BigDecimal("3.0"), 5)).isEqualTo(TeacherTier.BRONZE);
        assertThat(service.calculateTier(new BigDecimal("3.5"), 20)).isEqualTo(TeacherTier.SILVER);
        assertThat(service.calculateTier(new BigDecimal("4.0"), 100)).isEqualTo(TeacherTier.GOLD);
        assertThat(service.calculateTier(new BigDecimal("4.5"), 500)).isEqualTo(TeacherTier.ELITE);
    }

    @Test
    void returnsDefaultFeePercentByTier() {
        assertThat(service.feeForTier(TeacherTier.NEWBIE)).isEqualByComparingTo("20");
        assertThat(service.feeForTier(TeacherTier.BRONZE)).isEqualByComparingTo("15");
        assertThat(service.feeForTier(TeacherTier.SILVER)).isEqualByComparingTo("10");
        assertThat(service.feeForTier(TeacherTier.GOLD)).isEqualByComparingTo("5");
        assertThat(service.feeForTier(TeacherTier.ELITE)).isEqualByComparingTo("3");
    }
}
