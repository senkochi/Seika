=== TASK 2 DIFF PACKAGE — R-1 lookback filter ===
BASE: working tree at start of Task 2 (after Task 1)
HEAD: working tree after Task 2 (un-staged)

=== git status --short ===
 M src/services/marketplace-service/mvnw
 M src/services/marketplace-service/src/main/java/com/seika/marketplace_service/repository/ReviewRepository.java
 M src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/CollusionFlagService.java
 M src/services/marketplace-service/src/test/java/com/seika/marketplace_service/service/CollusionFlagServiceTest.java

=== Diff (CollusionFlagService.java + ReviewRepository.java) ===
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
=== un-tracked test diff against HEAD's empty version (i.e. full file as new) ===
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
...
--- (the diff above shows the new test + the one added stub line) ---
