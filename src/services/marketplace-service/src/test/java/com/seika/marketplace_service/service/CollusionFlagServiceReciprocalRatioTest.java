package com.seika.marketplace_service.service;

import com.seika.marketplace_service.entity.CollusionFlag;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class CollusionFlagServiceReciprocalRatioTest {

    @Test
    void reciprocalRatioCountsBilateralEscrows() {
        com.seika.marketplace_service.repository.CollusionFlagRepository flagRepo = org.mockito.Mockito.mock(com.seika.marketplace_service.repository.CollusionFlagRepository.class);
        com.seika.marketplace_service.repository.ReviewRepository reviewRepo = org.mockito.Mockito.mock(com.seika.marketplace_service.repository.ReviewRepository.class);
        com.seika.marketplace_service.repository.EscrowTransactionRepository escrowRepo = org.mockito.Mockito.mock(com.seika.marketplace_service.repository.EscrowTransactionRepository.class);
        com.seika.marketplace_service.repository.UserInventoryRepository inventoryRepo = org.mockito.Mockito.mock(com.seika.marketplace_service.repository.UserInventoryRepository.class);
        TeacherRatingService ratingService = org.mockito.Mockito.mock(TeacherRatingService.class);
        AdminActionLogService logService = org.mockito.Mockito.mock(AdminActionLogService.class);
        MarketplaceConfigService configService = org.mockito.Mockito.mock(MarketplaceConfigService.class);
        CollusionFlagService service = new CollusionFlagService(flagRepo, reviewRepo, ratingService, logService, configService, null, escrowRepo, inventoryRepo);

        org.mockito.Mockito.when(configService.getInt(MarketplaceConfigService.KEY_COLLUSION_LOOKBACK_DAYS, 30)).thenReturn(7);
        org.mockito.Mockito.when(configService.getInt(MarketplaceConfigService.KEY_COLLUSION_RISK_THRESHOLD, 50)).thenReturn(0);
        org.mockito.Mockito.when(configService.getInt(MarketplaceConfigService.KEY_COLLUSION_TX_THRESHOLD, 5)).thenReturn(1);
        org.mockito.Mockito.when(configService.getBigDecimal(MarketplaceConfigService.KEY_COLLUSION_PROMO_BACKED_RATIO_THRESHOLD, new BigDecimal("0.6"))).thenReturn(new BigDecimal("5.0"));
        org.mockito.Mockito.when(configService.getBigDecimal(MarketplaceConfigService.KEY_COLLUSION_NO_CONSUME_RATIO_THRESHOLD, new BigDecimal("0.7"))).thenReturn(new BigDecimal("5.0"));
        org.mockito.Mockito.when(flagRepo.existsByTeacherIdAndBuyerIdAndStatusIn(
                org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyList()))
                .thenReturn(false);
        org.mockito.Mockito.when(flagRepo.save(org.mockito.ArgumentMatchers.any(CollusionFlag.class))).thenAnswer(inv -> inv.getArgument(0));
        org.mockito.Mockito.when(reviewRepo.findBySellerIdAndBuyerIdAndStatus(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.any()))
                .thenReturn(java.util.List.of());

        java.time.Instant now = java.time.Instant.parse("2026-07-16T00:00:00Z");
        // Asymmetric escrow set: T1 is the seller in 3 escrows, B1 is the seller in 1.
        // With Pair canonicalization (T1 sorts before B1 lexicographically), the surviving
        // Pair has teacherId="B1", buyerId="T1" by construction — which is the WRONG
        // attribution. deriveTeacherId must therefore re-derive by majority seller and
        // pick T1 (3 > 1); deriveBuyerId then picks B1. This makes the test load-bearing
        // for the role-attribution semantics, not just for the reciprocalRatio formula.
        java.util.List<com.seika.marketplace_service.entity.EscrowTransaction> escrows = java.util.List.of(
                com.seika.marketplace_service.entity.EscrowTransaction.builder()
                        .id("E1").sellerId("T1").buyerId("B1").orderId("O1").productId("P1")
                        .grossAmount(new BigDecimal("100")).promoBackedAmount(new BigDecimal("0"))
                        .createdAt(now.minusSeconds(300)).build(),
                com.seika.marketplace_service.entity.EscrowTransaction.builder()
                        .id("E2").sellerId("T1").buyerId("B1").orderId("O2").productId("P2")
                        .grossAmount(new BigDecimal("100")).promoBackedAmount(new BigDecimal("0"))
                        .createdAt(now.minusSeconds(240)).build(),
                com.seika.marketplace_service.entity.EscrowTransaction.builder()
                        .id("E3").sellerId("T1").buyerId("B1").orderId("O3").productId("P3")
                        .grossAmount(new BigDecimal("100")).promoBackedAmount(new BigDecimal("0"))
                        .createdAt(now.minusSeconds(180)).build(),
                com.seika.marketplace_service.entity.EscrowTransaction.builder()
                        .id("E4").sellerId("B1").buyerId("T1").orderId("O4").productId("P4")
                        .grossAmount(new BigDecimal("100")).promoBackedAmount(new BigDecimal("0"))
                        .createdAt(now.minusSeconds(120)).build()
        );
        org.mockito.Mockito.when(escrowRepo.findByCreatedAtBetween(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any()))
                .thenReturn(escrows);
        org.mockito.Mockito.when(inventoryRepo.findByOrderIdAndProductIdAndActiveTrue(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyString()))
                .thenReturn(java.util.Optional.empty());

        int created = service.scanRecentEscrowsForCollusion(now);

        assertThat(created).isEqualTo(1);
        org.mockito.ArgumentCaptor<CollusionFlag> captor = org.mockito.ArgumentCaptor.forClass(CollusionFlag.class);
        org.mockito.Mockito.verify(flagRepo).save(captor.capture());
        CollusionFlag saved = captor.getValue();
        // Pin the attributed teacher/buyer roles: deriveTeacherId must pick T1 (majority seller),
        // and deriveBuyerId must pick the counter-party B1. Without the re-derivation helpers
        // the canonicalized Pair would attribute teacherId="B1", buyerId="T1" — a real bug
        // that flips risk attribution for every bilateral wash-trade.
        assertThat(saved.getTeacherId()).isEqualTo("T1");
        assertThat(saved.getBuyerId()).isEqualTo("B1");
        assertThat(saved.getReciprocalRatio()).isGreaterThan(new BigDecimal("0.5"));
    }
}