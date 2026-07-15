package com.seika.marketplace_service.service;

import com.seika.marketplace_service.enums.TeacherTier;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class TeacherRatingServiceTest {
    private final TeacherRatingService service = new TeacherRatingService(null, null, null, null, null, null, null, null);

    @Test
    void calculatesPhase2TierFromRatingAndValidReviewCountOnly() {
        assertThat(service.calculateTier(new BigDecimal("2.9"), 1000)).isEqualTo(TeacherTier.NEWBIE);
        assertThat(service.calculateTier(new BigDecimal("3.0"), 5)).isEqualTo(TeacherTier.BRONZE);
        assertThat(service.calculateTier(new BigDecimal("3.5"), 20)).isEqualTo(TeacherTier.SILVER);
        assertThat(service.calculateTier(new BigDecimal("4.0"), 100)).isEqualTo(TeacherTier.GOLD);
        assertThat(service.calculateTier(new BigDecimal("4.5"), 500)).isEqualTo(TeacherTier.ELITE);
    }

    @Test
    void usesConfiguredPhase3MetricThresholds() {
        MarketplaceConfigService configService = org.mockito.Mockito.mock(MarketplaceConfigService.class);
        org.mockito.Mockito.when(configService.getValue(
                        org.mockito.ArgumentMatchers.eq(MarketplaceConfigService.KEY_TIER_CONSUME_RATE_MIN),
                        org.mockito.ArgumentMatchers.anyString()))
                .thenReturn("{\"SILVER\":0.35,\"GOLD\":0.90,\"ELITE\":0.95}");
        org.mockito.Mockito.when(configService.getValue(
                        org.mockito.ArgumentMatchers.eq(MarketplaceConfigService.KEY_TIER_REFUND_RATE_MAX),
                        org.mockito.ArgumentMatchers.anyString()))
                .thenReturn("{\"BRONZE\":0.20,\"SILVER\":0.15,\"GOLD\":0.10,\"ELITE\":0.05}");
        org.mockito.Mockito.when(configService.getValue(
                        org.mockito.ArgumentMatchers.eq(MarketplaceConfigService.KEY_TIER_APPROVAL_REJECTION_RATE_MAX),
                        org.mockito.ArgumentMatchers.anyString()))
                .thenReturn("{\"BRONZE\":0.50,\"SILVER\":0.30,\"GOLD\":0.15,\"ELITE\":0.08}");
        TeacherRatingService configuredService = new TeacherRatingService(null, null, null, null, null, null,
                new com.fasterxml.jackson.databind.ObjectMapper(), configService);

        assertThat(configuredService.calculateTier(new BigDecimal("4.6"), 600,
                new BigDecimal("0.70"), new BigDecimal("0.03"), new BigDecimal("0.05")))
                .isEqualTo(TeacherTier.SILVER);
    }

    @Test
    void returnsDefaultFeePercentByTier() {
        assertThat(service.feeForTier(TeacherTier.NEWBIE)).isEqualByComparingTo("20");
        assertThat(service.feeForTier(TeacherTier.BRONZE)).isEqualByComparingTo("15");
        assertThat(service.feeForTier(TeacherTier.SILVER)).isEqualByComparingTo("10");
        assertThat(service.feeForTier(TeacherTier.GOLD)).isEqualByComparingTo("5");
        assertThat(service.feeForTier(TeacherTier.ELITE)).isEqualByComparingTo("3");
    }

    @Test
    void calculatesPhase3TierWithFiveMetrics() {
        // ELITE requires >=500 reviews, >=4.5 rating, consumeRate >=0.65, refundRate <=0.05, approvalRejectionRate <=0.08
        assertThat(service.calculateTier(new BigDecimal("4.6"), 600,
                new BigDecimal("0.70"), new BigDecimal("0.03"), new BigDecimal("0.05")))
                .isEqualTo(TeacherTier.ELITE);

        // Fails ELITE due to refundRate > 0.05 (0.06), drops to GOLD (refundRate <= 0.10)
        assertThat(service.calculateTier(new BigDecimal("4.6"), 600,
                new BigDecimal("0.70"), new BigDecimal("0.06"), new BigDecimal("0.05")))
                .isEqualTo(TeacherTier.GOLD);

        // SILVER requires >=20 reviews, >=3.5 rating, consumeRate >=0.35, refundRate <=0.15
        assertThat(service.calculateTier(new BigDecimal("3.8"), 50,
                new BigDecimal("0.40"), new BigDecimal("0.10"), new BigDecimal("0.20")))
                .isEqualTo(TeacherTier.SILVER);

        // Fails SILVER due to consumeRate < 0.35 (0.20), drops to BRONZE
        assertThat(service.calculateTier(new BigDecimal("3.8"), 50,
                new BigDecimal("0.20"), new BigDecimal("0.10"), new BigDecimal("0.20")))
                .isEqualTo(TeacherTier.BRONZE);
    }
}

