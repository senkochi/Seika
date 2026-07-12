package com.seika.marketplace_service.service;

import com.seika.marketplace_service.entity.CollusionFlag;
import com.seika.marketplace_service.entity.Review;
import com.seika.marketplace_service.enums.CollusionFlagStatus;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class CollusionFlagServiceTest {

    @Test
    void calculatesRiskScoreCorrectly() {
        // All thresholds exceeded: 25 + 25 + 20 + 15 + 15 = 100
        int maxScore = CollusionFlagService.computeRiskScore(
                10, new BigDecimal("0.8"), new BigDecimal("0.9"), new BigDecimal("0.8"), true
        );
        assertThat(maxScore).isEqualTo(100);

        // Below thresholds: 0
        int zeroScore = CollusionFlagService.computeRiskScore(
                3, new BigDecimal("0.2"), new BigDecimal("0.3"), new BigDecimal("0.1"), false
        );
        assertThat(zeroScore).isEqualTo(0);

        // Partial thresholds (e.g., txCount > 5 (+25), promoRatio > 0.6 (+25) -> 50)
        int partialScore = CollusionFlagService.computeRiskScore(
                6, new BigDecimal("0.65"), new BigDecimal("0.2"), new BigDecimal("0.1"), false
        );
        assertThat(partialScore).isEqualTo(50);
    }

    @Test
    void detectAndFlagCollusionTransitionsValidReviewsAndRecomputesRating() {
        // Test logic using mock objects or verifications
        com.seika.marketplace_service.repository.CollusionFlagRepository flagRepo = org.mockito.Mockito.mock(com.seika.marketplace_service.repository.CollusionFlagRepository.class);
        com.seika.marketplace_service.repository.ReviewRepository reviewRepo = org.mockito.Mockito.mock(com.seika.marketplace_service.repository.ReviewRepository.class);
        TeacherRatingService ratingService = org.mockito.Mockito.mock(TeacherRatingService.class);
        AdminActionLogService logService = org.mockito.Mockito.mock(AdminActionLogService.class);

        CollusionFlagService service = new CollusionFlagService(flagRepo, reviewRepo, ratingService, logService);

        org.mockito.Mockito.when(flagRepo.existsByTeacherIdAndBuyerIdAndStatusIn(
                org.mockito.ArgumentMatchers.eq("T1"),
                org.mockito.ArgumentMatchers.eq("B1"),
                org.mockito.ArgumentMatchers.anyList()
        )).thenReturn(false);

        org.mockito.Mockito.when(flagRepo.save(org.mockito.ArgumentMatchers.any(CollusionFlag.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        Review validReview = Review.builder().id("REV1").sellerId("T1").buyerId("B1").status(com.seika.marketplace_service.enums.ReviewStatus.VALID).build();
        org.mockito.Mockito.when(reviewRepo.findBySellerIdAndBuyerIdAndStatus("T1", "B1", com.seika.marketplace_service.enums.ReviewStatus.VALID))
                .thenReturn(java.util.List.of(validReview));

        CollusionFlag flag = service.detectAndFlagCollusion("T1", "B1", 10, new BigDecimal("0.8"), new BigDecimal("0.9"), new BigDecimal("0.8"), true);

        assertThat(flag).isNotNull();
        assertThat(flag.getStatus()).isEqualTo(CollusionFlagStatus.SUSPICIOUS);
        assertThat(validReview.getStatus()).isEqualTo(com.seika.marketplace_service.enums.ReviewStatus.PENDING_RISK_REVIEW);
        org.mockito.Mockito.verify(reviewRepo).saveAll(java.util.List.of(validReview));
        org.mockito.Mockito.verify(ratingService).recompute("T1");
    }

    @Test
    void adminConfirmCollusionIsIdempotent() {
        com.seika.marketplace_service.repository.CollusionFlagRepository flagRepo = org.mockito.Mockito.mock(com.seika.marketplace_service.repository.CollusionFlagRepository.class);
        AdminActionLogService logService = org.mockito.Mockito.mock(AdminActionLogService.class);
        CollusionFlagService service = new CollusionFlagService(flagRepo, null, null, logService);

        CollusionFlag confirmedFlag = CollusionFlag.builder()
                .id("FLAG1")
                .teacherId("T1")
                .buyerId("B1")
                .status(CollusionFlagStatus.CONFIRMED)
                .build();
        org.mockito.Mockito.when(flagRepo.findById("FLAG1")).thenReturn(java.util.Optional.of(confirmedFlag));

        CollusionFlag result = service.confirmCollusion("FLAG1", "admin1", "Already confirmed");
        assertThat(result.getStatus()).isEqualTo(CollusionFlagStatus.CONFIRMED);
        org.mockito.Mockito.verifyNoMoreInteractions(logService);
    }
}

