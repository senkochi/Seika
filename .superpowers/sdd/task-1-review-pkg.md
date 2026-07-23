=== TASK 1 DIFF PACKAGE — C-1 Pair canonicalization ===

=== STATUS ===
Working-tree diff (no commits; user instructed no commits)
BASE: working tree before Task 1 (cuong/dev at e44fec1)
HEAD: working tree after Task 1 (un-staged)

=== git status --short (relevant lines only) ===
 M src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/CollusionFlagService.java

=== UNTRACKED test file ===
-rw-r--r-- 1 cuongnh domain users 4634 Jul 17 10:18 src/services/marketplace-service/src/test/java/com/seika/marketplace_service/service/CollusionFlagServiceReciprocalRatioTest.java

=== DIFF (modified CollusionFlagService.java) ===
diff --git a/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/CollusionFlagService.java b/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/CollusionFlagService.java
index 819c5de..cbb2f47 100644
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
@@ -390,5 +424,26 @@ public class CollusionFlagService {
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
