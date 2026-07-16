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
    @Test
    void maliciousFlagQueuesConfiguredWashHoldDaysInOutbox() throws Exception {
        com.seika.marketplace_service.repository.CollusionFlagRepository flagRepo = org.mockito.Mockito.mock(com.seika.marketplace_service.repository.CollusionFlagRepository.class);
        com.seika.marketplace_service.repository.ReviewRepository reviewRepo = org.mockito.Mockito.mock(com.seika.marketplace_service.repository.ReviewRepository.class);
        com.seika.marketplace_service.repository.OutboxEventRepository outboxRepo = org.mockito.Mockito.mock(com.seika.marketplace_service.repository.OutboxEventRepository.class);
        TeacherRatingService ratingService = org.mockito.Mockito.mock(TeacherRatingService.class);
        AdminActionLogService logService = org.mockito.Mockito.mock(AdminActionLogService.class);
        MarketplaceConfigService configService = org.mockito.Mockito.mock(MarketplaceConfigService.class);
        com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper().findAndRegisterModules();
        CollusionFlagService service = new CollusionFlagService(flagRepo, reviewRepo, ratingService, logService,
                configService, objectMapper, outboxRepo, null, null);

        CollusionFlag flag = CollusionFlag.builder()
                .id("FLAG2")
                .teacherId("T1")
                .buyerId("B1")
                .riskScore(80)
                .status(CollusionFlagStatus.SUSPICIOUS)
                .build();
        org.mockito.Mockito.when(flagRepo.findById("FLAG2")).thenReturn(java.util.Optional.of(flag));
        org.mockito.Mockito.when(flagRepo.save(org.mockito.ArgumentMatchers.any(CollusionFlag.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        org.mockito.Mockito.when(outboxRepo.save(org.mockito.ArgumentMatchers.any(com.seika.marketplace_service.entity.OutboxEvent.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        org.mockito.Mockito.when(reviewRepo.findBySellerIdAndBuyerIdAndStatus(
                "T1", "B1", com.seika.marketplace_service.enums.ReviewStatus.PENDING_RISK_REVIEW))
                .thenReturn(java.util.List.of());
        org.mockito.Mockito.when(configService.getInt(MarketplaceConfigService.KEY_WASH_HOLD_DAYS, 30))
                .thenReturn(14);

        service.markMalicious("FLAG2", "admin1", "malicious abuse");

        org.mockito.ArgumentCaptor<com.seika.marketplace_service.entity.OutboxEvent> captor =
                org.mockito.ArgumentCaptor.forClass(com.seika.marketplace_service.entity.OutboxEvent.class);
        org.mockito.Mockito.verify(outboxRepo).save(captor.capture());
        com.seika.marketplace_service.entity.OutboxEvent outbox = captor.getValue();
        assertThat(outbox.getAggregateType()).isEqualTo("CollusionFlag");
        assertThat(outbox.getAggregateId()).isEqualTo("FLAG2");
        assertThat(outbox.getEventType()).isEqualTo(com.seika.marketplace_service.config.RabbitMQConfig.COLLUSION_FLAGGED_ROUTING_KEY);
        assertThat(outbox.getStatus()).isEqualTo(com.seika.marketplace_service.enums.OutboxStatus.PENDING);

        com.seika.marketplace_service.event.CollusionFlaggedEvent payload =
                objectMapper.readValue(outbox.getPayload(), com.seika.marketplace_service.event.CollusionFlaggedEvent.class);
        assertThat(payload.getHoldDays()).isEqualTo(14);
        assertThat(payload.getStatus()).isEqualTo("MALICIOUS");
    }

    @Test
    void scheduledRiskScanCreatesSuspiciousFlagFromRecentEscrows() {
        com.seika.marketplace_service.repository.CollusionFlagRepository flagRepo = org.mockito.Mockito.mock(com.seika.marketplace_service.repository.CollusionFlagRepository.class);
        com.seika.marketplace_service.repository.ReviewRepository reviewRepo = org.mockito.Mockito.mock(com.seika.marketplace_service.repository.ReviewRepository.class);
        com.seika.marketplace_service.repository.EscrowTransactionRepository escrowRepo = org.mockito.Mockito.mock(com.seika.marketplace_service.repository.EscrowTransactionRepository.class);
        com.seika.marketplace_service.repository.UserInventoryRepository inventoryRepo = org.mockito.Mockito.mock(com.seika.marketplace_service.repository.UserInventoryRepository.class);
        TeacherRatingService ratingService = org.mockito.Mockito.mock(TeacherRatingService.class);
        AdminActionLogService logService = org.mockito.Mockito.mock(AdminActionLogService.class);
        MarketplaceConfigService configService = org.mockito.Mockito.mock(MarketplaceConfigService.class);
        CollusionFlagService service = new CollusionFlagService(flagRepo, reviewRepo, ratingService, logService, configService, null, escrowRepo, inventoryRepo);

        org.mockito.Mockito.when(configService.getInt(MarketplaceConfigService.KEY_COLLUSION_LOOKBACK_DAYS, 30)).thenReturn(7);
        org.mockito.Mockito.when(configService.getInt(MarketplaceConfigService.KEY_COLLUSION_RISK_THRESHOLD, 50)).thenReturn(50);
        org.mockito.Mockito.when(configService.getInt(MarketplaceConfigService.KEY_COLLUSION_TX_THRESHOLD, 5)).thenReturn(1);
        org.mockito.Mockito.when(configService.getBigDecimal(MarketplaceConfigService.KEY_COLLUSION_PROMO_BACKED_RATIO_THRESHOLD, new BigDecimal("0.6"))).thenReturn(new BigDecimal("0.5"));
        org.mockito.Mockito.when(configService.getBigDecimal(MarketplaceConfigService.KEY_COLLUSION_NO_CONSUME_RATIO_THRESHOLD, new BigDecimal("0.7"))).thenReturn(new BigDecimal("0.5"));
        org.mockito.Mockito.when(flagRepo.existsByTeacherIdAndBuyerIdAndStatusIn(
                org.mockito.ArgumentMatchers.eq("T1"), org.mockito.ArgumentMatchers.eq("B1"), org.mockito.ArgumentMatchers.anyList()))
                .thenReturn(false);
        org.mockito.Mockito.when(flagRepo.save(org.mockito.ArgumentMatchers.any(CollusionFlag.class))).thenAnswer(inv -> inv.getArgument(0));
        org.mockito.Mockito.when(reviewRepo.findBySellerIdAndBuyerIdAndStatus("T1", "B1", com.seika.marketplace_service.enums.ReviewStatus.VALID))
                .thenReturn(java.util.List.of());

        java.time.Instant now = java.time.Instant.parse("2026-07-16T00:00:00Z");
        java.util.List<com.seika.marketplace_service.entity.EscrowTransaction> escrows = java.util.List.of(
                com.seika.marketplace_service.entity.EscrowTransaction.builder()
                        .id("E1").sellerId("T1").buyerId("B1").orderId("O1").productId("P1")
                        .grossAmount(new BigDecimal("100")).promoBackedAmount(new BigDecimal("80"))
                        .createdAt(now.minusSeconds(60)).build(),
                com.seika.marketplace_service.entity.EscrowTransaction.builder()
                        .id("E2").sellerId("T1").buyerId("B1").orderId("O2").productId("P2")
                        .grossAmount(new BigDecimal("100")).promoBackedAmount(new BigDecimal("90"))
                        .createdAt(now.minusSeconds(30)).build()
        );
        org.mockito.Mockito.when(escrowRepo.findByCreatedAtBetween(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any()))
                .thenReturn(escrows);
        org.mockito.Mockito.when(inventoryRepo.findByOrderIdAndProductIdAndActiveTrue(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyString()))
                .thenReturn(java.util.Optional.empty());

        int created = service.scanRecentEscrowsForCollusion(now);

        assertThat(created).isEqualTo(1);
        org.mockito.ArgumentCaptor<CollusionFlag> captor = org.mockito.ArgumentCaptor.forClass(CollusionFlag.class);
        org.mockito.Mockito.verify(flagRepo).save(captor.capture());
        assertThat(captor.getValue().getTeacherId()).isEqualTo("T1");
        assertThat(captor.getValue().getBuyerId()).isEqualTo("B1");
        assertThat(captor.getValue().getStatus()).isEqualTo(CollusionFlagStatus.SUSPICIOUS);
    }

}

