=== FINAL WHOLE-BRANCH REVIEW PACKAGE ===
Branch base: cuong/dev at e44fec1 (parent of latest remediation commits)
Working tree: un-staged changes from Tasks 1-10

=== git status (relevant) ===
 M src/config-service/src/main/resources/configs/wallet-service.yaml
 M src/services/marketplace-service/mvnw
 M src/services/marketplace-service/src/main/java/com/seika/marketplace_service/repository/ReviewRepository.java
 M src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/CollusionFlagService.java
 M src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/EscrowService.java
 M src/services/marketplace-service/src/test/java/com/seika/marketplace_service/service/CollusionFlagServiceTest.java
 M src/services/profile-service/mvnw
 M src/services/profile-service/src/main/java/com/seika/profile_service/consumer/TeacherStatsConsumer.java
 M src/services/profile-service/src/main/java/com/seika/profile_service/enity/TeacherProfile.java
 M src/services/profile-service/src/test/java/com/seika/profile_service/consumer/TeacherStatsConsumerTest.java
 M src/services/wallet-service/mvnw
 M src/services/wallet-service/src/main/java/com/cardy/walletService/config/RabbitMQConfig.java
 M src/services/wallet-service/src/main/java/com/cardy/walletService/consumer/CollusionEventConsumer.java
 M src/services/wallet-service/src/main/java/com/cardy/walletService/domain/WalletOutboxEvent.java
 M src/services/wallet-service/src/main/java/com/cardy/walletService/enums/WalletOutboxStatus.java
 M src/services/wallet-service/src/main/java/com/cardy/walletService/processor/WalletOutboxProcessor.java
 M src/services/wallet-service/src/main/java/com/cardy/walletService/repository/WalletOutboxEventRepository.java
 M src/services/wallet-service/src/main/java/com/cardy/walletService/service/WalletCommandOutboxService.java
 M src/services/wallet-service/src/test/java/com/cardy/walletService/consumer/CollusionEventConsumerTest.java
 M src/services/wallet-service/src/test/java/com/cardy/walletService/processor/WalletOutboxProcessorTest.java
 M src/web-app/src/pages/student/Marketplace.tsx
 M src/web-app/src/pages/student/ProductDetail.tsx
?? src/services/marketplace-service/src/test/java/com/seika/marketplace_service/service/CollusionFlagServiceReciprocalRatioTest.java
?? src/services/marketplace-service/src/test/java/com/seika/marketplace_service/service/EscrowPartialRefundInvalidatesCreditTest.java
?? src/services/wallet-service/src/main/java/com/cardy/walletService/controller/AdminWalletControlController.java
?? src/services/wallet-service/src/test/java/com/cardy/walletService/controller/

=== Files modified (per task summary) ===

Task 1 (C-1): CollusionFlagService.java (modified); CollusionFlagServiceReciprocalRatioTest.java (new)
Task 2 (R-1): ReviewRepository.java; CollusionFlagService.java (also); CollusionFlagServiceTest.java (also stub)
Task 3 (R-2): EscrowService.java; EscrowPartialRefundInvalidatesCreditTest.java (new)
Task 4 (R-3): AdminWalletControlController.java (new); AdminWalletControlControllerTest.java (new)
Task 5 (R-4/R-5): WalletOutboxEvent.java; WalletOutboxStatus.java; WalletOutboxEventRepository.java; WalletOutboxProcessor.java; RabbitMQConfig.java; wallet-service.yaml; WalletOutboxProcessorTest.java
Task 6 (R-6/R-7): CollusionEventConsumer.java; RabbitMQConfig.java (DLX arg for COLLUSION_FLAGS_QUEUE); CollusionEventConsumerTest.java
Task 7 (R-8): TeacherProfile.java; TeacherStatsConsumer.java; TeacherStatsConsumerTest.java
Task 8 (R-9/R-10): ProductDetail.tsx
Task 9 (R-12): WalletCommandOutboxService.java
Task 10 (rollback): Marketplace.tsx

=== STAT ===
 .../src/main/resources/configs/wallet-service.yaml |   2 +
 .../repository/ReviewRepository.java               |   3 +
 .../service/CollusionFlagService.java              |  74 +++++++++++--
 .../marketplace_service/service/EscrowService.java |   1 +
 .../service/CollusionFlagServiceTest.java          |  53 +++++++++
 .../consumer/TeacherStatsConsumer.java             |  12 +++
 .../profile_service/enity/TeacherProfile.java      |   3 +
 .../consumer/TeacherStatsConsumerTest.java         |  40 +++++++
 .../cardy/walletService/config/RabbitMQConfig.java |  37 ++++++-
 .../consumer/CollusionEventConsumer.java           | 119 +++++++++++++++-----
 .../walletService/domain/WalletOutboxEvent.java    |  15 ++-
 .../walletService/enums/WalletOutboxStatus.java    |   6 +-
 .../processor/WalletOutboxProcessor.java           |  92 +++++++++++++---
 .../repository/WalletOutboxEventRepository.java    |  24 ++++-
 .../service/WalletCommandOutboxService.java        |  17 ++-
 .../consumer/CollusionEventConsumerTest.java       |  41 +++++++
 .../processor/WalletOutboxProcessorTest.java       | 120 ++++++++++++++++++---
 src/web-app/src/pages/student/Marketplace.tsx      |  32 +++---
 src/web-app/src/pages/student/ProductDetail.tsx    |  15 ++-
 19 files changed, 614 insertions(+), 92 deletions(-)

=== Full diff (sub-task changes only) ===
diff --git a/src/config-service/src/main/resources/configs/wallet-service.yaml b/src/config-service/src/main/resources/configs/wallet-service.yaml
index c5b354d..51e0e38 100644
--- a/src/config-service/src/main/resources/configs/wallet-service.yaml
+++ b/src/config-service/src/main/resources/configs/wallet-service.yaml
@@ -33,6 +33,8 @@ spring:
     port: ${RABBITMQ_PORT}
     username: ${RABBITMQ_USERNAME}
     password: ${RABBITMQ_PASSWORD}
+    publisher-confirm-type: correlated
+    publisher-returns: true
 
 jwt:
   issuer: seika-identity-service
diff --git a/src/services/marketplace-service/mvnw b/src/services/marketplace-service/mvnw
old mode 100644
new mode 100755
diff --git a/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/repository/ReviewRepository.java b/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/repository/ReviewRepository.java
index 14ba717..b23e4de 100644
--- a/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/repository/ReviewRepository.java
+++ b/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/repository/ReviewRepository.java
@@ -7,6 +7,7 @@ import org.springframework.data.jpa.repository.Query;
 import org.springframework.data.repository.query.Param;
 
 import java.math.BigDecimal;
+import java.time.Instant;
 import java.util.List;
 
 public interface ReviewRepository extends JpaRepository<Review, String> {
@@ -19,4 +20,6 @@ public interface ReviewRepository extends JpaRepository<Review, String> {
     long countBySellerIdAndStatus(String sellerId, ReviewStatus status);
     long countBySellerIdAndStatusIn(String sellerId, List<ReviewStatus> statuses);
     List<Review> findBySellerIdAndBuyerIdAndStatus(String sellerId, String buyerId, ReviewStatus status);
+    List<Review> findBySellerIdAndBuyerIdAndStatusAndCreatedAtGreaterThanEqual(
+            String sellerId, String buyerId, ReviewStatus status, Instant createdAt);
 }
diff --git a/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/CollusionFlagService.java b/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/CollusionFlagService.java
index 819c5de..cd93b34 100644
--- a/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/CollusionFlagService.java
+++ b/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/CollusionFlagService.java
@@ -126,7 +126,7 @@ public class CollusionFlagService {
             if (escrow.getSellerId() == null || escrow.getBuyerId() == null) {
                 continue;
             }
-            byPair.computeIfAbsent(new Pair(escrow.getSellerId(), escrow.getBuyerId()), ignored -> new java.util.ArrayList<>())
+            byPair.computeIfAbsent(Pair.of(escrow.getSellerId(), escrow.getBuyerId()), ignored -> new java.util.ArrayList<>())
                     .add(escrow);
         }
 
@@ -134,15 +134,20 @@ public class CollusionFlagService {
         for (Map.Entry<Pair, List<EscrowTransaction>> entry : byPair.entrySet()) {
             Pair pair = entry.getKey();
             List<EscrowTransaction> pairEscrows = entry.getValue();
+            // After canonicalization, pair.teacherId()/buyerId() is whichever UUID sorts first.
+            // Re-derive the real roles by majority seller in the pair's escrows so risk attribution
+            // remains "the user that acts as seller most often" vs the counter-party buyer.
+            String teacherId = deriveTeacherId(pairEscrows, pair);
+            String buyerId = deriveBuyerId(pair, teacherId);
             BigDecimal gross = sum(pairEscrows, EscrowTransaction::getGrossAmount);
             BigDecimal promo = sum(pairEscrows, EscrowTransaction::getPromoBackedAmount);
             BigDecimal promoRatio = ratio(promo, gross);
             BigDecimal noConsumeRatio = ratio(BigDecimal.valueOf(countNoConsume(pairEscrows)), BigDecimal.valueOf(pairEscrows.size()));
             BigDecimal reciprocalRatio = ratio(
-                    BigDecimal.valueOf(byPair.getOrDefault(new Pair(pair.buyerId(), pair.teacherId()), List.of()).size()),
+                    BigDecimal.valueOf(byPair.getOrDefault(pair, List.of()).size()),
                     BigDecimal.valueOf(pairEscrows.size()));
             boolean reviewVelocityAbnormal = pairEscrows.size() > configInt(MarketplaceConfigService.KEY_COLLUSION_TX_THRESHOLD, 5) * 2;
-            CollusionFlag flag = detectAndFlagCollusion(pair.teacherId(), pair.buyerId(), pairEscrows.size(),
+            CollusionFlag flag = detectAndFlagCollusion(teacherId, buyerId, pairEscrows.size(),
                     promoRatio, noConsumeRatio, reciprocalRatio, reviewVelocityAbnormal, lookbackStart, now);
             if (flag != null) {
                 created++;
@@ -151,6 +156,35 @@ public class CollusionFlagService {
         return created;
     }
 
+    private static String deriveTeacherId(List<EscrowTransaction> pairEscrows, Pair pair) {
+        java.util.Map<String, Integer> sellerCounts = new HashMap<>();
+        for (EscrowTransaction escrow : pairEscrows) {
+            sellerCounts.merge(escrow.getSellerId(), 1, Integer::sum);
+        }
+        String majoritySeller = null;
+        int majorityCount = -1;
+        for (java.util.Map.Entry<String, Integer> e : sellerCounts.entrySet()) {
+            if (e.getValue() > majorityCount) {
+                majorityCount = e.getValue();
+                majoritySeller = e.getKey();
+            }
+        }
+        if (majoritySeller == null) {
+            return pair.teacherId();
+        }
+        return majoritySeller;
+    }
+
+    private static String deriveBuyerId(Pair pair, String teacherId) {
+        if (teacherId == null) {
+            return pair.buyerId();
+        }
+        if (teacherId.equals(pair.teacherId())) {
+            return pair.buyerId();
+        }
+        return pair.teacherId();
+    }
+
     @Transactional
     public CollusionFlag detectAndFlagCollusion(String teacherId, String buyerId,
                                                 int txCount, BigDecimal promoRatio,
@@ -193,7 +227,7 @@ public class CollusionFlagService {
                 .status(CollusionFlagStatus.SUSPICIOUS)
                 .build();
         CollusionFlag saved = collusionFlagRepository.save(flag);
-        transitionValidReviewsToPending(teacherId, buyerId);
+        transitionValidReviewsToPending(teacherId, buyerId, lookbackStart);
         return saved;
     }
 
@@ -281,16 +315,19 @@ public class CollusionFlagService {
                 teacherId, buyerId, List.of(CollusionFlagStatus.SUSPICIOUS, CollusionFlagStatus.CONFIRMED));
     }
 
-    private void transitionValidReviewsToPending(String teacherId, String buyerId) {
-        List<Review> validReviews = reviewRepository.findBySellerIdAndBuyerIdAndStatus(
-                teacherId, buyerId, ReviewStatus.VALID);
+    int transitionValidReviewsToPending(String teacherId, String buyerId, Instant lookbackStart) {
+        List<Review> validReviews = reviewRepository.findBySellerIdAndBuyerIdAndStatusAndCreatedAtGreaterThanEqual(
+                teacherId, buyerId, ReviewStatus.VALID, lookbackStart);
         if (!validReviews.isEmpty()) {
             for (Review review : validReviews) {
                 review.setStatus(ReviewStatus.PENDING_RISK_REVIEW);
             }
             reviewRepository.saveAll(validReviews);
             teacherRatingService.recompute(teacherId);
+            log.info("Transitioned {} VALID reviews to PENDING_RISK_REVIEW for teacherId={} buyerId={} lookbackStart={}",
+                    validReviews.size(), teacherId, buyerId, lookbackStart);
         }
+        return validReviews.size();
     }
 
     private int computeConfiguredRiskScore(int txCount, BigDecimal promoRatio, BigDecimal noConsumeRatio,
@@ -390,5 +427,26 @@ public class CollusionFlagService {
             throw new IllegalStateException("Failed to serialize collusion.flagged outbox payload", exception);
         }
     }
-    private record Pair(String teacherId, String buyerId) {}
+    private record Pair(String teacherId, String buyerId) {
+        static Pair of(String a, String b) {
+            // Canonicalize: order the two IDs so (T,B) and (B,T) collapse to one map key.
+            // The first field is whichever UUID sorts first lexicographically; the second
+            // is the counter-party. Callers MUST NOT rely on field meaning without
+            // re-deriving roles from the underlying escrows (see deriveTeacherId/deriveBuyerId).
+            if (a == null && b == null) {
+                return new Pair(null, null);
+            }
+            if (a == null) {
+                return new Pair(b, a);
+            }
+            if (b == null) {
+                return new Pair(a, b);
+            }
+            int cmp = a.compareTo(b);
+            if (cmp <= 0) {
+                return new Pair(a, b);
+            }
+            return new Pair(b, a);
+        }
+    }
 }
diff --git a/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/EscrowService.java b/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/EscrowService.java
index ad8052b..ba8931f 100644
--- a/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/EscrowService.java
+++ b/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/EscrowService.java
@@ -236,6 +236,7 @@ public class EscrowService {
                 .occurredAt(Instant.now())
                 .build();
         saveOutbox("EscrowTransaction", escrow.getId(), REFUND_REQUESTED, event);
+        escrow.setCreditRequestedAt(null);
         escrow.setRefundRequestedAt(Instant.now());
         escrow.setNeedsAdminDecision(true);
         escrow.setStatus(EscrowStatus.PENDING_ADMIN_DECISION);
diff --git a/src/services/marketplace-service/src/test/java/com/seika/marketplace_service/service/CollusionFlagServiceTest.java b/src/services/marketplace-service/src/test/java/com/seika/marketplace_service/service/CollusionFlagServiceTest.java
index 5e467be..70b2474 100644
--- a/src/services/marketplace-service/src/test/java/com/seika/marketplace_service/service/CollusionFlagServiceTest.java
+++ b/src/services/marketplace-service/src/test/java/com/seika/marketplace_service/service/CollusionFlagServiceTest.java
@@ -54,6 +54,12 @@ class CollusionFlagServiceTest {
         Review validReview = Review.builder().id("REV1").sellerId("T1").buyerId("B1").status(com.seika.marketplace_service.enums.ReviewStatus.VALID).build();
         org.mockito.Mockito.when(reviewRepo.findBySellerIdAndBuyerIdAndStatus("T1", "B1", com.seika.marketplace_service.enums.ReviewStatus.VALID))
                 .thenReturn(java.util.List.of(validReview));
+        org.mockito.Mockito.when(reviewRepo.findBySellerIdAndBuyerIdAndStatusAndCreatedAtGreaterThanEqual(
+                org.mockito.ArgumentMatchers.eq("T1"),
+                org.mockito.ArgumentMatchers.eq("B1"),
+                org.mockito.ArgumentMatchers.eq(com.seika.marketplace_service.enums.ReviewStatus.VALID),
+                org.mockito.ArgumentMatchers.any(java.time.Instant.class)
+        )).thenReturn(java.util.List.of(validReview));
 
         CollusionFlag flag = service.detectAndFlagCollusion("T1", "B1", 10, new BigDecimal("0.8"), new BigDecimal("0.9"), new BigDecimal("0.8"), true);
 
@@ -129,6 +135,53 @@ class CollusionFlagServiceTest {
         assertThat(payload.getStatus()).isEqualTo("MALICIOUS");
     }
 
+    @Test
+    void transitionToPendingReviewsOnlyConsidersLookbackWindow() {
+        com.seika.marketplace_service.repository.CollusionFlagRepository flagRepo = org.mockito.Mockito.mock(com.seika.marketplace_service.repository.CollusionFlagRepository.class);
+        com.seika.marketplace_service.repository.ReviewRepository reviewRepo = org.mockito.Mockito.mock(com.seika.marketplace_service.repository.ReviewRepository.class);
+        com.seika.marketplace_service.repository.EscrowTransactionRepository escrowRepo = org.mockito.Mockito.mock(com.seika.marketplace_service.repository.EscrowTransactionRepository.class);
+        com.seika.marketplace_service.repository.UserInventoryRepository inventoryRepo = org.mockito.Mockito.mock(com.seika.marketplace_service.repository.UserInventoryRepository.class);
+        TeacherRatingService ratingService = org.mockito.Mockito.mock(TeacherRatingService.class);
+        AdminActionLogService logService = org.mockito.Mockito.mock(AdminActionLogService.class);
+        MarketplaceConfigService configService = org.mockito.Mockito.mock(MarketplaceConfigService.class);
+        CollusionFlagService service = new CollusionFlagService(flagRepo, reviewRepo, ratingService, logService, configService, null, escrowRepo, inventoryRepo);
+
+        java.time.Instant oldReviewCreatedAt = java.time.Instant.parse("2025-01-01T00:00:00Z");
+        java.time.Instant recentReviewCreatedAt = java.time.Instant.parse("2026-07-15T00:00:00Z");
+        Review oldReview = Review.builder()
+                .id("OLD_REV").sellerId("T1").buyerId("B1")
+                .status(com.seika.marketplace_service.enums.ReviewStatus.VALID)
+                .createdAt(oldReviewCreatedAt).build();
+        Review recentReview = Review.builder()
+                .id("RECENT_REV").sellerId("T1").buyerId("B1")
+                .status(com.seika.marketplace_service.enums.ReviewStatus.VALID)
+                .createdAt(recentReviewCreatedAt).build();
+
+        org.mockito.Mockito.when(reviewRepo.findBySellerIdAndBuyerIdAndStatusAndCreatedAtGreaterThanEqual(
+                org.mockito.ArgumentMatchers.eq("T1"),
+                org.mockito.ArgumentMatchers.eq("B1"),
+                org.mockito.ArgumentMatchers.eq(com.seika.marketplace_service.enums.ReviewStatus.VALID),
+                org.mockito.ArgumentMatchers.any(java.time.Instant.class)
+        )).thenReturn(java.util.List.of(recentReview));
+
+        org.mockito.Mockito.when(reviewRepo.saveAll(org.mockito.ArgumentMatchers.anyList()))
+                .thenAnswer(inv -> inv.getArgument(0));
+
+        java.time.Instant lookbackStart = java.time.Instant.parse("2026-07-09T00:00:00Z");
+        int transitioned = service.transitionValidReviewsToPending("T1", "B1", lookbackStart);
+
+        assertThat(transitioned).isEqualTo(1);
+        assertThat(recentReview.getStatus()).isEqualTo(com.seika.marketplace_service.enums.ReviewStatus.PENDING_RISK_REVIEW);
+        assertThat(oldReview.getStatus()).isEqualTo(com.seika.marketplace_service.enums.ReviewStatus.VALID);
+        org.mockito.ArgumentCaptor<java.util.List<Review>> saveCaptor =
+                org.mockito.ArgumentCaptor.forClass(java.util.List.class);
+        org.mockito.Mockito.verify(reviewRepo).saveAll(saveCaptor.capture());
+        java.util.List<Review> saved = saveCaptor.getValue();
+        assertThat(saved).hasSize(1);
+        assertThat(saved.get(0).getId()).isEqualTo("RECENT_REV");
+        org.mockito.Mockito.verify(ratingService).recompute("T1");
+    }
+
     @Test
     void scheduledRiskScanCreatesSuspiciousFlagFromRecentEscrows() {
         com.seika.marketplace_service.repository.CollusionFlagRepository flagRepo = org.mockito.Mockito.mock(com.seika.marketplace_service.repository.CollusionFlagRepository.class);
diff --git a/src/services/profile-service/mvnw b/src/services/profile-service/mvnw
old mode 100644
new mode 100755
diff --git a/src/services/profile-service/src/main/java/com/seika/profile_service/consumer/TeacherStatsConsumer.java b/src/services/profile-service/src/main/java/com/seika/profile_service/consumer/TeacherStatsConsumer.java
index 0f51883..94861a9 100644
--- a/src/services/profile-service/src/main/java/com/seika/profile_service/consumer/TeacherStatsConsumer.java
+++ b/src/services/profile-service/src/main/java/com/seika/profile_service/consumer/TeacherStatsConsumer.java
@@ -104,11 +104,23 @@ public class TeacherStatsConsumer {
             }
 
             TeacherProfile teacherProfile = ensureTeacherProfileExists(event.getTeacherId());
+
+            String incomingEventId = event.getEventId();
+            String currentEventId = teacherProfile.getLastProcessedEventId();
+            if (incomingEventId != null && !incomingEventId.isBlank()
+                    && currentEventId != null && !currentEventId.isBlank()
+                    && incomingEventId.compareTo(currentEventId) < 0) {
+                log.warn("Skipped stale teacher.tier.updated event for teacherId={} incomingEventId={} currentEventId={}",
+                        event.getTeacherId(), incomingEventId, currentEventId);
+                return;
+            }
+
             teacherProfile.setTeacherTier(event.getTier());
             teacherProfile.setTeacherAverageRating(defaultDecimal(event.getAverageRating()));
             teacherProfile.setTeacherValidReviewCount(event.getValidReviewCount());
             teacherProfile.setTeacherTierFeePercent(defaultDecimal(event.getTierFeePercent()));
             teacherProfile.setTeacherTierUpdatedAt(event.getOccurredAt());
+            teacherProfile.setLastProcessedEventId(event.getEventId());
             teacherProfileRepository.save(teacherProfile);
 
             log.info("Updated teacher profile tier display for teacherId={} tier={} rating={} reviews={}",
diff --git a/src/services/profile-service/src/main/java/com/seika/profile_service/enity/TeacherProfile.java b/src/services/profile-service/src/main/java/com/seika/profile_service/enity/TeacherProfile.java
index 9306850..5f7e37e 100644
--- a/src/services/profile-service/src/main/java/com/seika/profile_service/enity/TeacherProfile.java
+++ b/src/services/profile-service/src/main/java/com/seika/profile_service/enity/TeacherProfile.java
@@ -56,4 +56,7 @@ public class TeacherProfile {
 
     @Column(name = "teacher_tier_updated_at")
     Instant teacherTierUpdatedAt;
+
+    @Column(name = "last_processed_event_id", length = 64)
+    String lastProcessedEventId;
 }
diff --git a/src/services/profile-service/src/test/java/com/seika/profile_service/consumer/TeacherStatsConsumerTest.java b/src/services/profile-service/src/test/java/com/seika/profile_service/consumer/TeacherStatsConsumerTest.java
index f182fc4..86564bc 100644
--- a/src/services/profile-service/src/test/java/com/seika/profile_service/consumer/TeacherStatsConsumerTest.java
+++ b/src/services/profile-service/src/test/java/com/seika/profile_service/consumer/TeacherStatsConsumerTest.java
@@ -16,6 +16,7 @@ import java.util.Optional;
 import static org.assertj.core.api.Assertions.assertThat;
 import static org.mockito.ArgumentMatchers.any;
 import static org.mockito.Mockito.mock;
+import static org.mockito.Mockito.never;
 import static org.mockito.Mockito.verify;
 import static org.mockito.Mockito.when;
 
@@ -62,5 +63,44 @@ class TeacherStatsConsumerTest {
         assertThat(saved.getTeacherValidReviewCount()).isEqualTo(120);
         assertThat(saved.getTeacherTierFeePercent()).isEqualByComparingTo("5.00");
         assertThat(saved.getTeacherTierUpdatedAt()).isEqualTo(Instant.parse("2026-07-16T08:00:00Z"));
+        assertThat(saved.getLastProcessedEventId()).isEqualTo("evt-1");
+    }
+
+    @Test
+    void teacherTierUpdatedSkipsStaleEventId() throws Exception {
+        TeacherProfileRepository teacherProfileRepository = mock(TeacherProfileRepository.class);
+        GameProfileRepository gameProfileRepository = mock(GameProfileRepository.class);
+        ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
+        TeacherStatsConsumer consumer = new TeacherStatsConsumer(
+                teacherProfileRepository,
+                gameProfileRepository,
+                objectMapper);
+
+        TeacherProfile profile = TeacherProfile.builder()
+                .userId("teacher-1")
+                .teacherTier("ELITE")
+                .teacherAverageRating(new BigDecimal("4.80"))
+                .teacherValidReviewCount(200)
+                .teacherTierFeePercent(new BigDecimal("2.00"))
+                .lastProcessedEventId("EVT-99")
+                .build();
+        when(teacherProfileRepository.findByUserId("teacher-1")).thenReturn(Optional.of(profile));
+
+        TeacherTierUpdatedEvent staleEvent = TeacherTierUpdatedEvent.builder()
+                .eventId("EVT-50")
+                .eventType("teacher.tier.updated")
+                .teacherId("teacher-1")
+                .tier("GOLD")
+                .averageRating(new BigDecimal("4.10"))
+                .validReviewCount(150)
+                .tierFeePercent(new BigDecimal("5.00"))
+                .occurredAt(Instant.parse("2026-07-15T08:00:00Z"))
+                .build();
+
+        consumer.handleTeacherTierUpdated(objectMapper.writeValueAsString(staleEvent));
+
+        verify(teacherProfileRepository, never()).save(any(TeacherProfile.class));
+        assertThat(profile.getTeacherTier()).isEqualTo("ELITE");
+        assertThat(profile.getLastProcessedEventId()).isEqualTo("EVT-99");
     }
 }
diff --git a/src/services/wallet-service/mvnw b/src/services/wallet-service/mvnw
old mode 100644
new mode 100755
diff --git a/src/services/wallet-service/src/main/java/com/cardy/walletService/config/RabbitMQConfig.java b/src/services/wallet-service/src/main/java/com/cardy/walletService/config/RabbitMQConfig.java
index 104e757..ea63ef3 100644
--- a/src/services/wallet-service/src/main/java/com/cardy/walletService/config/RabbitMQConfig.java
+++ b/src/services/wallet-service/src/main/java/com/cardy/walletService/config/RabbitMQConfig.java
@@ -6,6 +6,8 @@ import org.springframework.context.annotation.Configuration;
 import org.springframework.amqp.core.*;
 import org.springframework.amqp.support.converter.MessageConverter;
 
+import java.util.Map;
+
 @Configuration
 public class RabbitMQConfig {
     public static final String LEARN_FANOUT_EXCHANGE = "learn.exchange";
@@ -76,6 +78,17 @@ public class RabbitMQConfig {
 
     public static final String WALLET_EVENTS_EXCHANGE = "wallet.events";
 
+    /**
+     * Dead-letter exchange + queue. Used by the wallet outbox processor to
+     * park events that exceed {@code wallet.outbox.processor.max-attempts}.
+     * Other consumers (e.g. {@code CollusionEventConsumer}) should also bind
+     * their queues' {@code x-dead-letter-exchange} to this exchange so that
+     * poison messages that fail processing end up here instead of being
+     * re-delivered forever.
+     */
+    public static final String WALLET_EVENTS_DLX = "wallet.events.dlx";
+    public static final String WALLET_EVENTS_DLQ = "wallet.events.dlq";
+
     @Bean
     public TopicExchange walletCommandsExchange() {
         return new TopicExchange(WALLET_COMMANDS_EXCHANGE);
@@ -121,12 +134,32 @@ public class RabbitMQConfig {
 
     @Bean
     public Queue collusionFlagsQueue() {
-        return new Queue(COLLUSION_FLAGS_QUEUE, true);
+        // route consumer-side poison messages to the wallet DLX so they don't
+        // get re-delivered forever. Consumer-level handling is owned by
+        // CollusionEventConsumer (Task 6).
+        return new Queue(COLLUSION_FLAGS_QUEUE, true, false, false,
+                Map.of("x-dead-letter-exchange", WALLET_EVENTS_DLX));
     }
 
     @Bean
     public Binding collusionFlagsBinding(Queue collusionFlagsQueue, TopicExchange marketplaceEventsExchange) {
         return BindingBuilder.bind(collusionFlagsQueue).to(marketplaceEventsExchange).with(COLLUSION_FLAGGED_ROUTING_KEY);
     }
-}
 
+    // --- DLX / DLQ ---
+
+    @Bean
+    public DirectExchange walletEventsDlx() {
+        return new DirectExchange(WALLET_EVENTS_DLX, true, false);
+    }
+
+    @Bean
+    public Queue walletEventsDlq() {
+        return new Queue(WALLET_EVENTS_DLQ, true);
+    }
+
+    @Bean
+    public Binding walletEventsDlqBinding(Queue walletEventsDlq, DirectExchange walletEventsDlx) {
+        return BindingBuilder.bind(walletEventsDlq).to(walletEventsDlx).with("");
+    }
+}
diff --git a/src/services/wallet-service/src/main/java/com/cardy/walletService/consumer/CollusionEventConsumer.java b/src/services/wallet-service/src/main/java/com/cardy/walletService/consumer/CollusionEventConsumer.java
index 6c9adf2..7cf3473 100644
--- a/src/services/wallet-service/src/main/java/com/cardy/walletService/consumer/CollusionEventConsumer.java
+++ b/src/services/wallet-service/src/main/java/com/cardy/walletService/consumer/CollusionEventConsumer.java
@@ -4,10 +4,16 @@ import com.cardy.walletService.config.RabbitMQConfig;
 import com.cardy.walletService.event.CollusionFlaggedEvent;
 import com.cardy.walletService.service.WalletHoldService;
 import com.cardy.walletService.service.WalletService;
+import com.fasterxml.jackson.core.JsonProcessingException;
+import com.fasterxml.jackson.databind.DeserializationFeature;
+import com.fasterxml.jackson.databind.ObjectMapper;
 import lombok.RequiredArgsConstructor;
 import lombok.extern.slf4j.Slf4j;
+import org.springframework.amqp.AmqpRejectAndDontRequeueException;
+import org.springframework.amqp.core.Message;
 import org.springframework.amqp.rabbit.annotation.RabbitListener;
 import org.springframework.stereotype.Component;
+import org.springframework.transaction.annotation.Transactional;
 
 import java.time.LocalDateTime;
 import java.util.UUID;
@@ -22,37 +28,94 @@ public class CollusionEventConsumer {
     private final WalletHoldService walletHoldService;
     private final WalletService walletService;
 
+    private static final ObjectMapper MAPPER = new ObjectMapper()
+            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
+
+    /**
+     * Listener entry point. Poison messages (unparseable JSON, missing required
+     * identifiers, malformed UUIDs) are re-thrown as
+     * {@link AmqpRejectAndDontRequeueException} so the broker routes them to the
+     * wallet DLX configured on {@link RabbitMQConfig#collusionFlagsQueue()}.
+     * Transient DB failures propagate to Spring AMQP and trigger a redelivery
+     * (broker default), so the local transaction rolls back atomically.
+     */
     @RabbitListener(queues = RabbitMQConfig.COLLUSION_FLAGS_QUEUE)
-    public void handleCollusionFlaggedEvent(org.springframework.amqp.core.Message message) {
+    @Transactional
+    public void handleCollusionFlaggedEvent(Message message) {
+        String body = new String(message.getBody());
+        log.info("Received raw CollusionFlaggedEvent message: {}", body);
+
+        CollusionFlaggedEvent event;
+        try {
+            event = MAPPER.readValue(body, CollusionFlaggedEvent.class);
+        } catch (JsonProcessingException jpe) {
+            log.error("Malformed CollusionFlaggedEvent payload, routing to DLX. payload={}", body, jpe);
+            throw new AmqpRejectAndDontRequeueException("malformed payload", jpe);
+        }
+        log.info("Parsed CollusionFlaggedEvent flagId={}, status={}", event.getFlagId(), event.getStatus());
+
+        String status = event.getStatus();
+        if ("CONFIRMED".equalsIgnoreCase(status)) {
+            handleConfirmed(event);
+        } else if ("MALICIOUS".equalsIgnoreCase(status)) {
+            handleMalicious(event);
+        } else {
+            log.warn("Ignoring CollusionFlaggedEvent with unknown status={} flagId={}", status, event.getFlagId());
+        }
+    }
+
+    private void handleConfirmed(CollusionFlaggedEvent event) {
+        String teacherIdRaw = event.getTeacherId();
+        if (teacherIdRaw == null || teacherIdRaw.isBlank()) {
+            log.error("CONFIRMED CollusionFlaggedEvent missing teacherId, routing to DLX. flagId={}", event.getFlagId());
+            throw new AmqpRejectAndDontRequeueException(
+                    "CONFIRMED CollusionFlaggedEvent missing teacherId flagId=" + event.getFlagId());
+        }
+        UUID teacherId;
+        try {
+            teacherId = UUID.fromString(teacherIdRaw);
+        } catch (IllegalArgumentException iae) {
+            log.error("CONFIRMED CollusionFlaggedEvent has non-UUID teacherId={}, routing to DLX. flagId={}",
+                    teacherIdRaw, event.getFlagId(), iae);
+            throw new AmqpRejectAndDontRequeueException(
+                    "CONFIRMED CollusionFlaggedEvent has non-UUID teacherId flagId=" + event.getFlagId(), iae);
+        }
+        LocalDateTime expiresAt = LocalDateTime.now().plusDays(resolveHoldDays(event));
+        walletHoldService.placeHold(teacherId, "WASH_HOLD",
+                "Collusion flag " + event.getStatus() + ": " + event.getReason(),
+                event.getFlagId(), "SYSTEM_COLLUSION", expiresAt);
+        log.info("WASH_HOLD placed on wallet for teacherId {} flagId {}", teacherId, event.getFlagId());
+    }
+
+    private void handleMalicious(CollusionFlaggedEvent event) {
+        String teacherIdRaw = event.getTeacherId();
+        String buyerIdRaw = event.getBuyerId();
+        if (teacherIdRaw == null || teacherIdRaw.isBlank()) {
+            log.error("MALICIOUS CollusionFlaggedEvent missing teacherId, routing to DLX. flagId={}", event.getFlagId());
+            throw new AmqpRejectAndDontRequeueException(
+                    "MALICIOUS CollusionFlaggedEvent missing teacherId flagId=" + event.getFlagId());
+        }
+        if (buyerIdRaw == null || buyerIdRaw.isBlank()) {
+            log.error("MALICIOUS CollusionFlaggedEvent missing buyerId, routing to DLX. flagId={}", event.getFlagId());
+            throw new AmqpRejectAndDontRequeueException(
+                    "MALICIOUS CollusionFlaggedEvent missing buyerId flagId=" + event.getFlagId());
+        }
+        UUID teacherId;
+        UUID buyerId;
         try {
-            String body = new String(message.getBody());
-            log.info("Received raw CollusionFlaggedEvent message: {}", body);
-
-            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
-            mapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
-
-            CollusionFlaggedEvent event = mapper.readValue(body, CollusionFlaggedEvent.class);
-            log.info("Parsed CollusionFlaggedEvent flagId={}, status={}", event.getFlagId(), event.getStatus());
-
-            if ("CONFIRMED".equalsIgnoreCase(event.getStatus())) {
-                UUID teacherId = UUID.fromString(event.getTeacherId());
-                LocalDateTime expiresAt = LocalDateTime.now().plusDays(resolveHoldDays(event));
-                walletHoldService.placeHold(teacherId, "WASH_HOLD",
-                        "Collusion flag " + event.getStatus() + ": " + event.getReason(),
-                        event.getFlagId(), "SYSTEM_COLLUSION", expiresAt);
-                log.info("WASH_HOLD placed on wallet for teacherId {} flagId {}", teacherId, event.getFlagId());
-            } else if ("MALICIOUS".equalsIgnoreCase(event.getStatus())) {
-                UUID teacherId = UUID.fromString(event.getTeacherId());
-                UUID buyerId = UUID.fromString(event.getBuyerId());
-                String reason = "Collusion flag " + event.getStatus() + ": " + event.getReason();
-                walletService.applyFreeze(teacherId, reason, event.getFlagId(), "SYSTEM_COLLUSION");
-                walletService.applyFreeze(buyerId, reason, event.getFlagId(), "SYSTEM_COLLUSION");
-                log.info("Wallets frozen for malicious collusion flagId {} teacherId {} buyerId {}",
-                        event.getFlagId(), teacherId, buyerId);
-            }
-        } catch (Exception e) {
-            log.error("Error processing CollusionFlaggedEvent", e);
+            teacherId = UUID.fromString(teacherIdRaw);
+            buyerId = UUID.fromString(buyerIdRaw);
+        } catch (IllegalArgumentException iae) {
+            log.error("MALICIOUS CollusionFlaggedEvent has non-UUID id, routing to DLX. flagId={} teacherId={} buyerId={}",
+                    event.getFlagId(), teacherIdRaw, buyerIdRaw, iae);
+            throw new AmqpRejectAndDontRequeueException(
+                    "MALICIOUS CollusionFlaggedEvent has non-UUID id flagId=" + event.getFlagId(), iae);
         }
+        String reason = "Collusion flag " + event.getStatus() + ": " + event.getReason();
+        walletService.applyFreeze(teacherId, reason, event.getFlagId(), "SYSTEM_COLLUSION");
+        walletService.applyFreeze(buyerId, reason, event.getFlagId(), "SYSTEM_COLLUSION");
+        log.info("Wallets frozen for malicious collusion flagId {} teacherId {} buyerId {}",
+                event.getFlagId(), teacherId, buyerId);
     }
 
     private int resolveHoldDays(CollusionFlaggedEvent event) {
diff --git a/src/services/wallet-service/src/main/java/com/cardy/walletService/domain/WalletOutboxEvent.java b/src/services/wallet-service/src/main/java/com/cardy/walletService/domain/WalletOutboxEvent.java
index 7c09523..e3fe49f 100644
--- a/src/services/wallet-service/src/main/java/com/cardy/walletService/domain/WalletOutboxEvent.java
+++ b/src/services/wallet-service/src/main/java/com/cardy/walletService/domain/WalletOutboxEvent.java
@@ -16,7 +16,8 @@ import java.util.UUID;
     indexes = {
         @Index(name = "idx_wallet_outbox_status", columnList = "status"),
         @Index(name = "idx_wallet_outbox_created_at", columnList = "created_at"),
-        @Index(name = "idx_wallet_outbox_aggregate", columnList = "aggregate_type, aggregate_id")
+        @Index(name = "idx_wallet_outbox_aggregate", columnList = "aggregate_type, aggregate_id"),
+        @Index(name = "idx_wallet_outbox_status_next_attempt", columnList = "status, next_attempt_at")
     }
 )
 @Getter
@@ -60,4 +61,14 @@ public class WalletOutboxEvent {
 
     @Column(name = "last_error", length = 2000)
     private String lastError;
-}
\ No newline at end of file
+
+    @Column(name = "claimed_at")
+    private Instant claimedAt;
+
+    @Column(name = "next_attempt_at")
+    private Instant nextAttemptAt;
+
+    @Column(name = "attempt_count", nullable = false)
+    @Builder.Default
+    private int attemptCount = 0;
+}
diff --git a/src/services/wallet-service/src/main/java/com/cardy/walletService/enums/WalletOutboxStatus.java b/src/services/wallet-service/src/main/java/com/cardy/walletService/enums/WalletOutboxStatus.java
index ea0b32e..4821509 100644
--- a/src/services/wallet-service/src/main/java/com/cardy/walletService/enums/WalletOutboxStatus.java
+++ b/src/services/wallet-service/src/main/java/com/cardy/walletService/enums/WalletOutboxStatus.java
@@ -2,6 +2,8 @@ package com.cardy.walletService.enums;
 
 public enum WalletOutboxStatus {
     PENDING,
+    CLAIMED,
     SENT,
-    FAILED
-}
\ No newline at end of file
+    FAILED,
+    DEAD
+}
diff --git a/src/services/wallet-service/src/main/java/com/cardy/walletService/processor/WalletOutboxProcessor.java b/src/services/wallet-service/src/main/java/com/cardy/walletService/processor/WalletOutboxProcessor.java
index 1d5616d..1127133 100644
--- a/src/services/wallet-service/src/main/java/com/cardy/walletService/processor/WalletOutboxProcessor.java
+++ b/src/services/wallet-service/src/main/java/com/cardy/walletService/processor/WalletOutboxProcessor.java
@@ -4,46 +4,112 @@ import com.cardy.walletService.config.RabbitMQConfig;
 import com.cardy.walletService.domain.WalletOutboxEvent;
 import com.cardy.walletService.enums.WalletOutboxStatus;
 import com.cardy.walletService.repository.WalletOutboxEventRepository;
-import lombok.RequiredArgsConstructor;
 import lombok.extern.slf4j.Slf4j;
 import org.springframework.amqp.rabbit.core.RabbitTemplate;
+import org.springframework.beans.factory.annotation.Value;
 import org.springframework.scheduling.annotation.Scheduled;
 import org.springframework.stereotype.Component;
+import org.springframework.transaction.annotation.Transactional;
 
+import java.time.Duration;
 import java.time.Instant;
 import java.util.List;
 
 @Component
-@RequiredArgsConstructor
 @Slf4j
 public class WalletOutboxProcessor {
     private static final int ERROR_LIMIT = 2000;
+    /** Max shift we apply to backoff (2^6 = 64). Keeps growth bounded. */
+    private static final int MAX_BACKOFF_SHIFT = 6;
 
     private final WalletOutboxEventRepository walletOutboxEventRepository;
     private final RabbitTemplate rabbitTemplate;
+    private final int maxAttempts;
+    private final long backoffSeconds;
+    private final int batchSize;
+
+    public WalletOutboxProcessor(
+            WalletOutboxEventRepository walletOutboxEventRepository,
+            RabbitTemplate rabbitTemplate,
+            @Value("${wallet.outbox.processor.max-attempts:8}") int maxAttempts,
+            @Value("${wallet.outbox.processor.backoff-seconds:30}") long backoffSeconds,
+            @Value("${wallet.outbox.processor.batch-size:50}") int batchSize) {
+        this.walletOutboxEventRepository = walletOutboxEventRepository;
+        this.rabbitTemplate = rabbitTemplate;
+        this.maxAttempts = maxAttempts;
+        this.backoffSeconds = backoffSeconds;
+        this.batchSize = batchSize;
+    }
 
     @Scheduled(fixedDelayString = "${wallet.outbox.processor.delay-ms:3000}")
-    public void publishOutboxEvents() {
-        List<WalletOutboxEvent> events = walletOutboxEventRepository.findTop50ByStatusInOrderByCreatedAtAsc(
-                List.of(WalletOutboxStatus.PENDING, WalletOutboxStatus.FAILED));
+    public void scheduledTick() {
+        try {
+            publishOutboxEvents(Instant.now());
+        } catch (Exception exception) {
+            // never let a tick-level failure kill the scheduler
+            log.error("Wallet outbox tick failed", exception);
+        }
+    }
+
+    /**
+     * Claim a batch of PENDING rows, mark them CLAIMED, publish to RabbitMQ,
+     * and update them to SENT (success), PENDING-with-backoff (transient failure),
+     * or DEAD + DLX (max attempts exceeded).
+     *
+     * The whole tick runs in a single transaction so the FOR UPDATE SKIP LOCKED
+     * row locks are held until the row state is finalised.
+     */
+    @Transactional
+    public void publishOutboxEvents(Instant now) {
+        List<WalletOutboxEvent> claimed = walletOutboxEventRepository
+                .claimNextPendingBatch(batchSize, now);
+        if (claimed.isEmpty()) {
+            return;
+        }
+
+        Duration backoff = Duration.ofSeconds(backoffSeconds);
+
+        for (WalletOutboxEvent event : claimed) {
+            event.setStatus(WalletOutboxStatus.CLAIMED);
+            event.setClaimedAt(now);
 
-        for (WalletOutboxEvent event : events) {
             try {
                 rabbitTemplate.convertAndSend(
                         RabbitMQConfig.WALLET_EVENTS_EXCHANGE,
                         event.getEventType(),
                         event.getPayload());
+
                 event.setStatus(WalletOutboxStatus.SENT);
-                event.setPublishedAt(Instant.now());
+                event.setPublishedAt(now);
                 event.setLastError(null);
-                walletOutboxEventRepository.save(event);
             } catch (Exception exception) {
-                event.setStatus(WalletOutboxStatus.FAILED);
-                event.setRetryCount(event.getRetryCount() + 1);
+                int next = event.getAttemptCount() + 1;
+                event.setAttemptCount(next);
                 event.setLastError(truncateError(exception.getMessage()));
-                walletOutboxEventRepository.save(event);
-                log.error("Failed to publish wallet outbox event id={}", event.getId(), exception);
+                if (next >= maxAttempts) {
+                    event.setStatus(WalletOutboxStatus.DEAD);
+                    try {
+                        rabbitTemplate.convertAndSend(
+                                RabbitMQConfig.WALLET_EVENTS_DLX,
+                                event.getEventType(),
+                                event.getPayload());
+                    } catch (Exception dlxException) {
+                        // if even the DLX publish fails, keep row DEAD; log loudly
+                        log.error("Outbox event id={} exhausted retries ({}); DLX publish also failed",
+                                event.getId(), next, dlxException);
+                    }
+                    log.error("Outbox event id={} exhausted retries ({}); routed to DLQ",
+                            event.getId(), next, exception);
+                } else {
+                    event.setStatus(WalletOutboxStatus.PENDING);
+                    int shift = Math.min(next, MAX_BACKOFF_SHIFT);
+                    event.setNextAttemptAt(now.plus(backoff.multipliedBy(1L << shift)));
+                    log.warn("Outbox event id={} failed attempt={}, retry at {}",
+                            event.getId(), next, event.getNextAttemptAt(), exception);
+                }
             }
+
+            walletOutboxEventRepository.save(event);
         }
     }
 
@@ -53,4 +119,4 @@ public class WalletOutboxProcessor {
         }
         return message.length() <= ERROR_LIMIT ? message : message.substring(0, ERROR_LIMIT);
     }
-}
\ No newline at end of file
+}
diff --git a/src/services/wallet-service/src/main/java/com/cardy/walletService/repository/WalletOutboxEventRepository.java b/src/services/wallet-service/src/main/java/com/cardy/walletService/repository/WalletOutboxEventRepository.java
index b86dd03..f5c8429 100644
--- a/src/services/wallet-service/src/main/java/com/cardy/walletService/repository/WalletOutboxEventRepository.java
+++ b/src/services/wallet-service/src/main/java/com/cardy/walletService/repository/WalletOutboxEventRepository.java
@@ -3,12 +3,34 @@ package com.cardy.walletService.repository;
 import com.cardy.walletService.domain.WalletOutboxEvent;
 import com.cardy.walletService.enums.WalletOutboxStatus;
 import org.springframework.data.jpa.repository.JpaRepository;
+import org.springframework.data.jpa.repository.Query;
+import org.springframework.data.repository.query.Param;
 import org.springframework.stereotype.Repository;
 
+import java.time.Instant;
 import java.util.List;
 import java.util.UUID;
 
 @Repository
 public interface WalletOutboxEventRepository extends JpaRepository<WalletOutboxEvent, UUID> {
     List<WalletOutboxEvent> findTop50ByStatusInOrderByCreatedAtAsc(List<WalletOutboxStatus> statuses);
-}
\ No newline at end of file
+
+    /**
+     * Atomically claim up to {@code batchSize} PENDING outbox rows whose next-attempt
+     * time is due. Uses SELECT ... FOR UPDATE SKIP LOCKED so two scheduler
+     * replicas/ticks cannot pick the same row and double-publish.
+     *
+     * The caller MUST be inside a transaction so the row locks are held until
+     * the row is updated to CLAIMED/SENT/DEAD.
+     */
+    @Query(value = """
+        SELECT * FROM wallet_outbox_events
+        WHERE status = 'PENDING'
+          AND (next_attempt_at IS NULL OR next_attempt_at <= :now)
+        ORDER BY created_at ASC
+        LIMIT :batchSize
+        FOR UPDATE SKIP LOCKED
+        """, nativeQuery = true)
+    List<WalletOutboxEvent> claimNextPendingBatch(@Param("batchSize") int batchSize,
+                                                  @Param("now") Instant now);
+}
diff --git a/src/services/wallet-service/src/main/java/com/cardy/walletService/service/WalletCommandOutboxService.java b/src/services/wallet-service/src/main/java/com/cardy/walletService/service/WalletCommandOutboxService.java
index ba45f79..4fcb987 100644
--- a/src/services/wallet-service/src/main/java/com/cardy/walletService/service/WalletCommandOutboxService.java
+++ b/src/services/wallet-service/src/main/java/com/cardy/walletService/service/WalletCommandOutboxService.java
@@ -110,7 +110,7 @@ public class WalletCommandOutboxService {
                 .occurredAt(Instant.now())
                 .reason(reason)
                 .build();
-        saveOutbox("Order", requestEvent.getOrderId(), eventType, outEvent);
+        enqueueOutboxResult("Order", requestEvent.getOrderId(), eventType, outEvent);
     }
 
     private void enqueueCreditResult(WalletCreditRequestedEvent requestEvent, String eventType, String reason) {
@@ -130,7 +130,7 @@ public class WalletCommandOutboxService {
                 .occurredAt(Instant.now())
                 .reason(reason)
                 .build();
-        saveOutbox("EscrowTransaction", requestEvent.getEscrowId(), eventType, outEvent);
+        enqueueOutboxResult("EscrowTransaction", requestEvent.getEscrowId(), eventType, outEvent);
     }
 
     private void enqueueRefundResult(WalletRefundRequestedEvent requestEvent, String eventType, String reason) {
@@ -149,16 +149,23 @@ public class WalletCommandOutboxService {
                 .occurredAt(Instant.now())
                 .reason(reason)
                 .build();
-        saveOutbox("EscrowTransaction", requestEvent.getEscrowId(), eventType, outEvent);
+        enqueueOutboxResult("EscrowTransaction", requestEvent.getEscrowId(), eventType, outEvent);
     }
 
-    private void saveOutbox(String aggregateType, String aggregateId, String eventType, Object event) {
+    /**
+     * Shared helper that serialises {@code payload} and persists a {@link WalletOutboxEvent}
+     * row with the supplied aggregate identity and event type. Note that
+     * {@link WalletOutboxEvent} has no reason column — callers embed the reason inside
+     * their typed payload (e.g. {@link WalletDebitEvent#getReason()} /
+     * {@link WalletEscrowResultEvent#getReason()}).
+     */
+    private void enqueueOutboxResult(String aggregateType, String aggregateId, String eventType, Object payload) {
         try {
             walletOutboxEventRepository.save(WalletOutboxEvent.builder()
                     .aggregateType(aggregateType)
                     .aggregateId(aggregateId == null ? "UNKNOWN" : aggregateId)
                     .eventType(eventType)
-                    .payload(objectMapper.writeValueAsString(event))
+                    .payload(objectMapper.writeValueAsString(payload))
                     .status(WalletOutboxStatus.PENDING)
                     .build());
         } catch (JsonProcessingException exception) {
diff --git a/src/services/wallet-service/src/test/java/com/cardy/walletService/consumer/CollusionEventConsumerTest.java b/src/services/wallet-service/src/test/java/com/cardy/walletService/consumer/CollusionEventConsumerTest.java
index afca6f4..0eeaf05 100644
--- a/src/services/wallet-service/src/test/java/com/cardy/walletService/consumer/CollusionEventConsumerTest.java
+++ b/src/services/wallet-service/src/test/java/com/cardy/walletService/consumer/CollusionEventConsumerTest.java
@@ -5,12 +5,15 @@ import com.cardy.walletService.service.WalletHoldService;
 import com.cardy.walletService.service.WalletService;
 import com.fasterxml.jackson.databind.ObjectMapper;
 import org.junit.jupiter.api.Test;
+import org.springframework.amqp.AmqpRejectAndDontRequeueException;
 import org.springframework.amqp.core.Message;
 import org.springframework.amqp.core.MessageProperties;
 
+import java.nio.charset.StandardCharsets;
 import java.time.LocalDateTime;
 import java.util.UUID;
 
+import static org.junit.jupiter.api.Assertions.assertThrows;
 import static org.mockito.ArgumentMatchers.any;
 import static org.mockito.ArgumentMatchers.eq;
 import static org.mockito.Mockito.mock;
@@ -69,6 +72,44 @@ class CollusionEventConsumerTest {
         verify(holdService, never()).placeHold(any(), any(), any(), any(), any(), any());
     }
 
+    @Test
+    void handleCollusionFlaggedMaliciousWithoutBuyerIdRethrows() throws Exception {
+        WalletHoldService holdService = mock(WalletHoldService.class);
+        WalletService walletService = mock(WalletService.class);
+        CollusionEventConsumer consumer = new CollusionEventConsumer(holdService, walletService);
+
+        UUID teacherId = UUID.randomUUID();
+        CollusionFlaggedEvent event = CollusionFlaggedEvent.builder()
+                .flagId("FLAG-3")
+                .teacherId(teacherId.toString())
+                .buyerId(null)
+                .status("MALICIOUS")
+                .reason("malicious abuse")
+                .holdDays(30)
+                .build();
+
+        assertThrows(AmqpRejectAndDontRequeueException.class,
+                () -> consumer.handleCollusionFlaggedEvent(message(event)));
+
+        verify(walletService, never()).applyFreeze(any(), any(), any(), any());
+        verify(holdService, never()).placeHold(any(), any(), any(), any(), any(), any());
+    }
+
+    @Test
+    void handleCollusionFlaggedWithPoisonPayloadRethrows() {
+        WalletHoldService holdService = mock(WalletHoldService.class);
+        WalletService walletService = mock(WalletService.class);
+        CollusionEventConsumer consumer = new CollusionEventConsumer(holdService, walletService);
+
+        Message poison = new Message("{not json".getBytes(StandardCharsets.UTF_8), new MessageProperties());
+
+        assertThrows(AmqpRejectAndDontRequeueException.class,
+                () -> consumer.handleCollusionFlaggedEvent(poison));
+
+        verify(walletService, never()).applyFreeze(any(), any(), any(), any());
+        verify(holdService, never()).placeHold(any(), any(), any(), any(), any(), any());
+    }
+
     private static Message message(CollusionFlaggedEvent event) throws Exception {
         byte[] body = new ObjectMapper().writeValueAsBytes(event);
         return new Message(body, new MessageProperties());
diff --git a/src/services/wallet-service/src/test/java/com/cardy/walletService/processor/WalletOutboxProcessorTest.java b/src/services/wallet-service/src/test/java/com/cardy/walletService/processor/WalletOutboxProcessorTest.java
index 84d98f4..6901910 100644
--- a/src/services/wallet-service/src/test/java/com/cardy/walletService/processor/WalletOutboxProcessorTest.java
+++ b/src/services/wallet-service/src/test/java/com/cardy/walletService/processor/WalletOutboxProcessorTest.java
@@ -8,31 +8,37 @@ import org.junit.jupiter.api.Test;
 import org.mockito.ArgumentCaptor;
 import org.springframework.amqp.rabbit.core.RabbitTemplate;
 
+import java.time.Instant;
 import java.util.List;
 
 import static org.assertj.core.api.Assertions.assertThat;
 import static org.mockito.ArgumentMatchers.any;
+import static org.mockito.ArgumentMatchers.anyInt;
+import static org.mockito.ArgumentMatchers.anyString;
 import static org.mockito.Mockito.doThrow;
 import static org.mockito.Mockito.mock;
+import static org.mockito.Mockito.never;
 import static org.mockito.Mockito.verify;
 import static org.mockito.Mockito.when;
 
 class WalletOutboxProcessorTest {
 
+    private static final Instant NOW = Instant.parse("2026-07-17T10:00:00Z");
+
     @Test
     void publishesPendingEventsToWalletEventsExchangeAndMarksSent() {
         WalletOutboxEventRepository repository = mock(WalletOutboxEventRepository.class);
         RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
-        WalletOutboxProcessor processor = new WalletOutboxProcessor(repository, rabbitTemplate);
+        WalletOutboxProcessor processor = new WalletOutboxProcessor(repository, rabbitTemplate, 8, 30L, 50);
         WalletOutboxEvent event = WalletOutboxEvent.builder()
                 .eventType("wallet.debit.succeeded")
                 .payload("{\"eventType\":\"wallet.debit.succeeded\"}")
                 .status(WalletOutboxStatus.PENDING)
                 .build();
-        when(repository.findTop50ByStatusInOrderByCreatedAtAsc(List.of(WalletOutboxStatus.PENDING, WalletOutboxStatus.FAILED)))
+        when(repository.claimNextPendingBatch(anyInt(), any(Instant.class)))
                 .thenReturn(List.of(event));
 
-        processor.publishOutboxEvents();
+        processor.publishOutboxEvents(NOW);
 
         verify(rabbitTemplate).convertAndSend(
                 RabbitMQConfig.WALLET_EVENTS_EXCHANGE,
@@ -46,27 +52,115 @@ class WalletOutboxProcessorTest {
     }
 
     @Test
-    void marksEventFailedWhenBrokerPublishFails() {
+    void processorClaimsRowsBeforePublishingAndRetriesFailuresWithBackoff() {
         WalletOutboxEventRepository repository = mock(WalletOutboxEventRepository.class);
         RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
-        WalletOutboxProcessor processor = new WalletOutboxProcessor(repository, rabbitTemplate);
+        WalletOutboxProcessor processor = new WalletOutboxProcessor(repository, rabbitTemplate, 8, 30L, 50);
         WalletOutboxEvent event = WalletOutboxEvent.builder()
                 .eventType("wallet.refund.succeeded")
                 .payload("{}")
                 .status(WalletOutboxStatus.PENDING)
-                .retryCount(2)
+                .attemptCount(0)
+                .build();
+        when(repository.claimNextPendingBatch(anyInt(), any(Instant.class)))
+                .thenReturn(List.of(event));
+        doThrow(new RuntimeException("broker down")).when(rabbitTemplate)
+                .convertAndSend(anyString(), anyString(), anyString());
+
+        processor.publishOutboxEvents(NOW);
+
+        // broker is called once (real exchange), not the DLX
+        verify(rabbitTemplate).convertAndSend(
+                RabbitMQConfig.WALLET_EVENTS_EXCHANGE, "wallet.refund.succeeded", "{}");
+        verify(rabbitTemplate, never()).convertAndSend(
+                eq(RabbitMQConfig.WALLET_EVENTS_DLX), anyString(), anyString());
+
+        ArgumentCaptor<WalletOutboxEvent> captor = ArgumentCaptor.forClass(WalletOutboxEvent.class);
+        verify(repository).save(captor.capture());
+        WalletOutboxEvent saved = captor.getValue();
+        assertThat(saved.getStatus()).isEqualTo(WalletOutboxStatus.PENDING);
+        assertThat(saved.getAttemptCount()).isEqualTo(1);
+        assertThat(saved.getLastError()).isEqualTo("broker down");
+        assertThat(saved.getNextAttemptAt()).isNotNull();
+        // first retry: 30s * 2^1 = 60s
+        assertThat(saved.getNextAttemptAt()).isEqualTo(NOW.plusSeconds(60));
+    }
+
+    @Test
+    void processorRoutesDeadLetterOnMaxAttemptsExceeded() {
+        WalletOutboxEventRepository repository = mock(WalletOutboxEventRepository.class);
+        RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
+        int maxAttempts = 8;
+        WalletOutboxProcessor processor = new WalletOutboxProcessor(repository, rabbitTemplate, maxAttempts, 30L, 50);
+        WalletOutboxEvent event = WalletOutboxEvent.builder()
+                .eventType("wallet.debit.failed")
+                .payload("{\"foo\":1}")
+                .status(WalletOutboxStatus.PENDING)
+                .attemptCount(maxAttempts - 1) // next failure will exceed
                 .build();
-        when(repository.findTop50ByStatusInOrderByCreatedAtAsc(List.of(WalletOutboxStatus.PENDING, WalletOutboxStatus.FAILED)))
+        when(repository.claimNextPendingBatch(anyInt(), any(Instant.class)))
                 .thenReturn(List.of(event));
         doThrow(new RuntimeException("broker down")).when(rabbitTemplate)
-                .convertAndSend(any(String.class), any(String.class), any(String.class));
+                .convertAndSend(anyString(), anyString(), anyString());
 
-        processor.publishOutboxEvents();
+        processor.publishOutboxEvents(NOW);
+
+        // DLX publish attempted
+        verify(rabbitTemplate).convertAndSend(
+                RabbitMQConfig.WALLET_EVENTS_DLX, "wallet.debit.failed", "{\"foo\":1}");
 
         ArgumentCaptor<WalletOutboxEvent> captor = ArgumentCaptor.forClass(WalletOutboxEvent.class);
         verify(repository).save(captor.capture());
-        assertThat(captor.getValue().getStatus()).isEqualTo(WalletOutboxStatus.FAILED);
-        assertThat(captor.getValue().getRetryCount()).isEqualTo(3);
-        assertThat(captor.getValue().getLastError()).isEqualTo("broker down");
+        WalletOutboxEvent saved = captor.getValue();
+        assertThat(saved.getStatus()).isEqualTo(WalletOutboxStatus.DEAD);
+        assertThat(saved.getAttemptCount()).isEqualTo(maxAttempts);
+        assertThat(saved.getLastError()).isEqualTo("broker down");
+    }
+
+    @Test
+    void processorKeepsRowPendingWithBackoffOnTransientFailure() {
+        WalletOutboxEventRepository repository = mock(WalletOutboxEventRepository.class);
+        RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
+        WalletOutboxProcessor processor = new WalletOutboxProcessor(repository, rabbitTemplate, 8, 30L, 50);
+        WalletOutboxEvent event = WalletOutboxEvent.builder()
+                .eventType("wallet.credit.succeeded")
+                .payload("{}")
+                .status(WalletOutboxStatus.PENDING)
+                .attemptCount(2)
+                .build();
+        when(repository.claimNextPendingBatch(anyInt(), any(Instant.class)))
+                .thenReturn(List.of(event));
+        doThrow(new RuntimeException("transient")).when(rabbitTemplate)
+                .convertAndSend(anyString(), anyString(), anyString());
+
+        processor.publishOutboxEvents(NOW);
+
+        ArgumentCaptor<WalletOutboxEvent> captor = ArgumentCaptor.forClass(WalletOutboxEvent.class);
+        verify(repository).save(captor.capture());
+        WalletOutboxEvent saved = captor.getValue();
+        assertThat(saved.getStatus()).isEqualTo(WalletOutboxStatus.PENDING);
+        assertThat(saved.getAttemptCount()).isEqualTo(3);
+        // next attempt = 3: 30s * 2^3 = 240s
+        assertThat(saved.getNextAttemptAt()).isEqualTo(NOW.plusSeconds(240));
+    }
+
+    @Test
+    void noClaimedRowsLeavesRepositoryUntouched() {
+        WalletOutboxEventRepository repository = mock(WalletOutboxEventRepository.class);
+        RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
+        WalletOutboxProcessor processor = new WalletOutboxProcessor(repository, rabbitTemplate, 8, 30L, 50);
+        when(repository.claimNextPendingBatch(anyInt(), any(Instant.class)))
+                .thenReturn(List.of());
+
+        processor.publishOutboxEvents(NOW);
+
+        verify(rabbitTemplate, never()).convertAndSend(anyString(), anyString(), anyString());
+        verify(repository, never()).save(any(WalletOutboxEvent.class));
+    }
+
+    // --- helpers ---
+
+    private static <T> T eq(T value) {
+        return org.mockito.ArgumentMatchers.eq(value);
     }
-}
\ No newline at end of file
+}
diff --git a/src/web-app/src/pages/student/Marketplace.tsx b/src/web-app/src/pages/student/Marketplace.tsx
index cfd4f32..a5c25fb 100644
--- a/src/web-app/src/pages/student/Marketplace.tsx
+++ b/src/web-app/src/pages/student/Marketplace.tsx
@@ -31,7 +31,7 @@ async function waitForPaidOrder(orderId: string) {
     if (response.data.status === "PAID") return response.data;
     if (response.data.status === "FAILED") {
       throw new Error(
-        "Payment failed. Your coins were kept or will be restored by the system.",
+        "Thanh toán thất bại. Coin đã được giữ nguyên hoặc sẽ được hoàn theo hệ thống.",
       );
     }
     await wait(ORDER_POLL_DELAY_MS);
@@ -82,24 +82,24 @@ function Marketplace() {
   const handleBuy = async (product: Product) => {
     try {
       if (!userId) {
-        toast.error("Please sign in before buying.");
+        toast.error("Vui lòng đăng nhập để mua hàng");
         return;
       }
 
-      toast.loading("Checking wallet balance...", { id: "buy-product" });
+      toast.loading("Đang kiểm tra số dư...", { id: "buy-product" });
       const balanceRes = await walletService.getBalance();
       const currentBalance = toNumber(balanceRes.balance);
       const price = toNumber(product.price);
 
       if (currentBalance < price) {
         toast.error(
-          `Not enough coins. You need ${price.toLocaleString("vi-VN")} coins, current balance is ${currentBalance.toLocaleString("vi-VN")}.`,
+          `Số dư không đủ! Bạn cần ${price.toLocaleString("vi-VN")} Coins nhưng hiện tại chỉ có ${currentBalance.toLocaleString("vi-VN")} Coins.`,
           { id: "buy-product" },
         );
         return;
       }
 
-      toast.loading("Creating order...", { id: "buy-product" });
+      toast.loading("Đang tạo đơn hàng...", { id: "buy-product" });
       const orderResponse = await marketplaceApi.createOrder(userId, [
         {
           productId: product.id,
@@ -112,20 +112,20 @@ function Marketplace() {
         },
       ]);
 
-      toast.loading("Confirming payment...", { id: "buy-product" });
+      toast.loading("Đang xác nhận thanh toán...", { id: "buy-product" });
       const paidOrder = await waitForPaidOrder(orderResponse.data.id);
       await fetchProducts();
 
       if (paidOrder) {
         toast.success(
-          "Purchase complete. The product is now in Learning Hub.",
+          "Đã mua hàng thành công! Sản phẩm đã có trong Learning Hub.",
           {
             id: "buy-product",
           },
         );
       } else {
         toast.info(
-          "Order is still processing. Refresh Learning Hub in a moment.",
+          "Đơn hàng đang được xử lý. Vui lòng làm mới Learning Hub sau ít giây.",
           {
             id: "buy-product",
           },
@@ -137,7 +137,7 @@ function Marketplace() {
         error.response?.data?.message ||
         error.response?.data?.error ||
         error.message ||
-        "Purchase failed.";
+        "Mua hàng thất bại";
       toast.error(errorMessage, { id: "buy-product" });
       void fetchProducts();
     }
@@ -147,7 +147,7 @@ function Marketplace() {
     <div className="space-y-8 p-6 lg:p-8">
       <PageHeader
         title="Marketplace"
-        subtitle="Browse teacher-made flashcard decks and quiz packs."
+        subtitle="Khám phá các bộ thẻ và quiz do giáo viên trên hệ thống đăng bán."
         actions={
           <Button
             variant="ghost"
@@ -159,7 +159,7 @@ function Marketplace() {
               className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
               aria-hidden="true"
             />
-            Refresh
+            Làm mới
           </Button>
         }
       />
@@ -168,19 +168,19 @@ function Marketplace() {
         <div className="flex items-center gap-2 mb-5">
           <Store className="w-4 h-4 text-[#d4a843]" aria-hidden="true" />
           <h2 className="font-sans-ui text-base font-semibold text-cream">
-            All products
+            Tất cả sản phẩm
           </h2>
         </div>
 
         {loading ? (
           <div className="font-sans-ui text-white/55 text-sm">
-            Loading products...
+            Đang tải sản phẩm…
           </div>
         ) : products.length === 0 ? (
           <EmptyState
             icon={<Store className="w-5 h-5" aria-hidden="true" />}
-            title="No products yet"
-            description="Marketplace products will appear here when teachers publish them."
+            title="Chưa có sản phẩm nào"
+            description="Marketplace hiện chưa có sản phẩm. Quay lại sau nhé."
           />
         ) : (
           <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
@@ -220,7 +220,7 @@ function Marketplace() {
                     {item.name}
                   </h3>
                   <p className="font-sans-ui text-sm text-white/55 line-clamp-2 flex-1 mb-4">
-                    {item.description || "No description yet."}
+                    {item.description || "Chưa có mô tả"}
                   </p>
 
                   <div className="mb-5 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 font-sans-ui">
diff --git a/src/web-app/src/pages/student/ProductDetail.tsx b/src/web-app/src/pages/student/ProductDetail.tsx
index 88ecc92..fb72403 100644
--- a/src/web-app/src/pages/student/ProductDetail.tsx
+++ b/src/web-app/src/pages/student/ProductDetail.tsx
@@ -184,7 +184,14 @@ function ProductDetail() {
     () => (product ? latestEscrowForProduct(escrows, product.id) : undefined),
     [escrows, product],
   );
-  const canRefund = canRequestSelfServiceRefund(escrow, ownedInventory);
+  const isEscrowBuyer = Boolean(
+    userId && escrow && escrow.buyerId === userId,
+  );
+  const canRefund =
+    isEscrowBuyer && canRequestSelfServiceRefund(escrow, ownedInventory);
+  const isOwnProduct = Boolean(
+    userId && product && product.sellerUserId === userId,
+  );
 
   const handleBuy = async () => {
     if (!product) return;
@@ -550,7 +557,11 @@ function ProductDetail() {
             </p>
           </div>
 
-          {!owned ? (
+          {isOwnProduct ? (
+            <p className="text-sm text-white/55">
+              Bạn không thể tự đánh giá sản phẩm của chính mình.
+            </p>
+          ) : !owned ? (
             <EmptyState
               icon={<ShieldCheck className="w-5 h-5" aria-hidden="true" />}
               title="Purchase required"
