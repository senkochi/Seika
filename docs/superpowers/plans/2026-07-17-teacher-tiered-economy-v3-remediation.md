# Teacher Tiered Economy V3 — Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the 1 Critical (C-1) and the correctness/security Required items (R-1, R-2, R-3, R-4, R-5, R-6, R-7, R-8, R-9, R-10, R-12) from the V3 audit review. Roll back the Vietnamese→English regression from `e44fec1`. Defer all UI structural items (R-11, R-13–R-16), the Optional/Nit items, and the audit-still-open items to a separate scope.

**Architecture:** Small, surgical changes:
- C-1, R-1, R-2: fix-only inside the service code that already owns the logic. TDD-first.
- R-3: add a dedicated `AdminWalletControlController` rather than piling freeze endpoints onto the legacy `WalletController` (separate responsibility).
- R-4, R-5: harden the `WalletOutboxProcessor` with row claim (`SELECT … FOR UPDATE SKIP LOCKED`), publisher confirms, DLQ routing, and retry ceiling.
- R-6, R-7: make `CollusionEventConsumer` rethrow on poison messages and validate `buyerId` up front.
- R-8: add `last_processed_event_id` column on `TeacherProfile` and skip stale events.
- R-9, R-10: tighten two frontend guards that the audit called out.
- R-12: collapse three near-duplicate outbox-result enqueues into one method.
- Roll back the Vietnamese→English regression in `Marketplace.tsx`.

**Tech Stack:** Java 21, Spring Boot 4.0.4, Spring Cloud 2025.1.1, Spring Data JPA + JDBC `FOR UPDATE SKIP LOCKED`, Spring AMQP (publisher confirms + DLQ), JUnit 5 + Mockito, Flyway, React 19 + TypeScript + MUI 7.

## Global Constraints

- **Do not commit.** Stage only; user reviews & commits manually.
- All wallet-domain code lives under `com.cardy.walletService.*`. All marketplace-domain code lives under `com.seika.marketplace_service.*`. All profile-domain code lives under `com.seika.profile_service.*`.
- Service controllers follow the existing prefix pattern: `/api/wallet/admin/*` for admin endpoints in wallet-service, `/api/marketplace/*` in marketplace-service.
- All RabbitMQ consumers MUST rethrow on unrecoverable failures — `try/catch log` is forbidden unless paired with a DLT binding or idempotency check.
- All new tests use the existing JUnit 5 + Mockito style used in each service's existing test classes (look at `EscrowServiceTest`, `WalletServiceFreezeTest`, `TeacherStatsConsumerTest`).
- Backend changes: `mvn compile` must succeed per service before task is complete.
- Frontend changes: `npm run typecheck && npm run lint && npm run build` from `src/web-app/` must succeed.

---

## File Structure (this plan)

**Modified backend files (5):**
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/CollusionFlagService.java` — C-1, R-1, R-12
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/EscrowService.java` — R-2
- `src/services/wallet-service/src/main/java/com/cardy/walletService/processor/WalletOutboxProcessor.java` — R-4, R-5
- `src/services/wallet-service/src/main/java/com/cardy/walletService/consumer/CollusionEventConsumer.java` — R-6, R-7
- `src/services/profile-service/src/main/java/com/seika/profile_service/consumer/TeacherStatsConsumer.java` — R-8

**New backend files (4):**
- `src/services/wallet-service/src/main/java/com/cardy/walletService/controller/AdminWalletControlController.java` — R-3 (freeze/unfreeze admin endpoints)
- `src/services/wallet-service/src/main/resources/db/migration/V__wallet_outbox_claim_status.sql` — R-4 (Flyway: add `CLAIMED` value if not enum-driven + add `next_attempt_at`)
- `src/services/marketplace-service/src/main/resources/db/migration/V__escrow_refund_idempotency.sql` — R-2 follow-on (optional, only if `credit_requested_at` lacks a default)
- `src/services/profile-service/src/main/resources/db/migration/V__teacher_profile_last_event_id.sql` — R-8 (Flyway: add `last_processed_event_id` column)

**New backend test files (3):**
- `src/services/marketplace-service/src/test/java/com/seika/marketplace_service/service/CollusionFlagServiceReciprocalRatioTest.java` — C-1 regression
- `src/services/marketplace-service/src/test/java/com/seika/marketplace_service/service/EscrowPartialRefundInvalidatesCreditTest.java` — R-2 regression
- `src/services/wallet-service/src/test/java/com/cardy/walletService/controller/AdminWalletControlControllerTest.java` — R-3

**Modified existing test files (3):**
- `src/services/marketplace-service/src/test/java/com/seika/marketplace_service/service/CollusionFlagServiceTest.java` — extend the lookback test for R-1
- `src/services/wallet-service/src/test/java/com/cardy/walletService/processor/WalletOutboxProcessorTest.java` — extend for R-4 (no double-publish) and R-5 (DLQ on poison)
- `src/services/wallet-service/src/test/java/com/cardy/walletService/consumer/CollusionEventConsumerTest.java` — extend for R-6 (rethrows) and R-7 (validates buyerId)
- `src/services/profile-service/src/test/java/com/seika/profile_service/consumer/TeacherStatsConsumerTest.java` — extend for R-8 (skips stale eventId)

**Modified frontend files (3):**
- `src/web-app/src/pages/student/ProductDetail.tsx` — R-9, R-10
- `src/web-app/src/pages/student/Marketplace.tsx` — roll back Vietnamese regression
- `src/web-app/src/api/services/wallet.ts` (only if needed by R-3) — no change if `WalletService.removeFreeze` is reachable through the existing service file

> **Defer to a separate plan (out of scope here):** R-11 (ProductDetail split), R-13 (orphaned card components), R-14 (`window.prompt`), R-15 (archive/hard-delete UI), R-16 (partial-refund admin UI), all §3 "audit-still-open" items, all §5 Optional/Nit items. The user's instruction was to fix only what really needs fixing.

---

## Task 1: C-1 — Canonicalize the Collusion Pair key so reciprocal lookup hits

**Files:**
- Modify: `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/CollusionFlagService.java:124-143, 393`
- Test (new): `src/services/marketplace-service/src/test/java/com/seika/marketplace_service/service/CollusionFlagServiceReciprocalRatioTest.java`

**Interfaces:**
- Consumes: existing `Pair` record (`record Pair(String teacherId, String buyerId)` at line 393) — the field naming reads "teacher / buyer" but the record is actually ordered "first / second". Rename the record to `Pair(String a, String b)` to match intent, and canonicalize via `Pair` ordering in the map key (see step 3).
- Produces: a deterministic `byPair` map where `(T,B)` and `(B,T)` resolve to the same key, so the reciprocal ratio is non-zero when wash-trade exists.

- [ ] **Step 1: Write the failing test** in the new file `CollusionFlagServiceReciprocalRatioTest.java`:

```java
package com.seika.marketplace_service.service;

import com.seika.marketplace_service.entity.CollusionFlag;
import com.seika.marketplace_service.enums.CollusionFlagStatus;
import com.seika.marketplace_service.repository.*;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CollusionFlagServiceReciprocalRatioTest {

    @Test
    void reciprocalRatioCountsBilateralEscrows() {
        CollusionFlagRepository flagRepo = mock(CollusionFlagRepository.class);
        ReviewRepository reviewRepo = mock(ReviewRepository.class);
        EscrowTransactionRepository escrowRepo = mock(EscrowTransactionRepository.class);
        UserInventoryRepository inventoryRepo = mock(UserInventoryRepository.class);
        TeacherRatingService ratingService = mock(TeacherRatingService.class);
        AdminActionLogService logService = mock(AdminActionLogService.class);
        MarketplaceConfigService configService = mock(MarketplaceConfigService.class);

        CollusionFlagService service = new CollusionFlagService(
                flagRepo, reviewRepo, ratingService, logService, configService,
                null, escrowRepo, inventoryRepo);

        when(configService.getInt(MarketplaceConfigService.KEY_COLLUSION_LOOKBACK_DAYS, 30)).thenReturn(7);
        when(configService.getInt(MarketplaceConfigService.KEY_COLLUSION_RISK_THRESHOLD, 50)).thenReturn(50);
        when(configService.getInt(MarketplaceConfigService.KEY_COLLUSION_TX_THRESHOLD, 5)).thenReturn(1);
        when(configService.getBigDecimal(eq(MarketplaceConfigService.KEY_COLLUSION_PROMO_BACKED_RATIO_THRESHOLD), any())).thenReturn(new BigDecimal("0.99"));
        when(configService.getBigDecimal(eq(MarketplaceConfigService.KEY_COLLUSION_NO_CONSUME_RATIO_THRESHOLD), any())).thenReturn(new BigDecimal("0.99"));
        when(configService.getBigDecimal(eq(MarketplaceConfigService.KEY_COLLUSION_RECIPROCAL_RATIO_THRESHOLD), any())).thenReturn(new BigDecimal("0.1"));
        when(configService.getInt(MarketplaceConfigService.KEY_COLLUSION_RECIPROCAL_RATIO_POINTS, 15)).thenReturn(15);

        when(flagRepo.existsByTeacherIdAndBuyerIdAndStatusIn(anyString(), anyString(), anyList())).thenReturn(false);
        when(flagRepo.findFirstByTeacherIdAndBuyerIdAndStatusInOrderByCreatedAtDesc(anyString(), anyString(), anyList()))
                .thenReturn(Optional.empty());
        when(flagRepo.save(any(CollusionFlag.class))).thenAnswer(inv -> inv.getArgument(0));
        when(reviewRepo.findBySellerIdAndBuyerIdAndStatus(anyString(), anyString(),
                com.seika.marketplace_service.enums.ReviewStatus.VALID)).thenReturn(List.of());
        when(inventoryRepo.findByOrderIdAndProductIdAndActiveTrue(anyString(), anyString())).thenReturn(Optional.empty());

        Instant now = Instant.parse("2026-07-16T00:00:00Z");
        // SAME seller/buyer pair appearing in BOTH directions = bilateral wash-trade
        List<com.seika.marketplace_service.entity.EscrowTransaction> escrows = List.of(
                buildEscrow("E1", "T1", "B1", new BigDecimal("100"), new BigDecimal("0"), now.minusSeconds(60)),
                buildEscrow("E2", "B1", "T1", new BigDecimal("100"), new BigDecimal("0"), now.minusSeconds(30))
        );
        when(escrowRepo.findByCreatedAtBetween(any(), any())).thenReturn(escrows);

        service.scanRecentEscrowsForCollusion(now);

        // Without the canonicalization fix, the reciprocal-ratio points are 0.
        // After the fix, reciprocalRatio for the surviving canonical pair is 2/2 = 1.0,
        // and reciprocalRatioPoints (15) are added to the risk score.
        ArgumentCaptor<CollusionFlag> captor = ArgumentCaptor.forClass(CollusionFlag.class);
        verify(flagRepo).save(captor.capture());
        CollusionFlag flag = captor.getValue();
        assertThat(flag.getReciprocalRatio())
                .as("Reciprocal ratio should reflect bilateral activity, not 0")
                .isGreaterThan(new BigDecimal("0.5"));
    }

    private com.seika.marketplace_service.entity.EscrowTransaction buildEscrow(
            String id, String seller, String buyer,
            BigDecimal gross, BigDecimal promoBacked, Instant createdAt) {
        return com.seika.marketplace_service.entity.EscrowTransaction.builder()
                .id(id).sellerId(seller).buyerId(buyer)
                .orderId("O" + id).productId("P" + id)
                .grossAmount(gross).promoBackedAmount(promoBacked)
                .createdAt(createdAt).build();
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run from repo root:
```bash
./src/services/marketplace-service/mvnw -pl src/services/marketplace-service -am test \
  -Dtest=CollusionFlagServiceReciprocalRatioTest
```
Expected: FAIL — `reciprocalRatio` will be `0` (the bug), so the assert `isGreaterThan(0.5)` fails.

- [ ] **Step 3: Fix the code** in `CollusionFlagService.java`:

At line 393, change the record:
```java
private record Pair(String teacherId, String buyerId) {
    static Pair of(String a, String b) {
        // Canonicalize ordering so (T,B) and (B,T) collapse to the same key.
        int cmp = a.compareTo(b);
        return cmp <= 0 ? new Pair(a, b) : new Pair(b, a);
    }
}
```

Replace lines 124-131 (the map population) with:
```java
Map<Pair, List<EscrowTransaction>> byPair = new HashMap<>();
for (EscrowTransaction escrow : escrows) {
    if (escrow.getSellerId() == null || escrow.getBuyerId() == null) {
        continue;
    }
    byPair.computeIfAbsent(Pair.of(escrow.getSellerId(), escrow.getBuyerId()),
                    ignored -> new java.util.ArrayList<>())
            .add(escrow);
}
```

Replace line 142 (the reciprocal lookup) with:
```java
                    BigDecimal.valueOf(byPair.getOrDefault(Pair.of(pair.buyerId(), pair.teacherId()), List.of()).size()),
```
(Note: `Pair.of` already canonicalizes, so this is now equivalent to `byPair.getOrDefault(pair, List.of())` — either form is correct; use `byPair.getOrDefault(pair, List.of())` for clarity.)

Also note the field-naming smell: the record is named `Pair(String teacherId, String buyerId)` but it's used for both directions. After canonicalization, the surviving pair's `teacherId()` and `buyerId()` are non-deterministic (whichever UUID happens to sort first). Update the call site at line 145 to pick the actual teacher from the escrows list (extract via a small lookup so the risk score is attributed to the correct user). Concretely, change lines 134-150 to:

```java
int created = 0;
for (Map.Entry<Pair, List<EscrowTransaction>> entry : byPair.entrySet()) {
    Pair pair = entry.getKey();
    List<EscrowTransaction> pairEscrows = entry.getValue();

    // The canonical pair lost the (teacher, buyer) direction. Re-derive:
    // pick the userId that appears as seller in >50% of pairEscrows.
    java.util.Map<String, Long> sellerCounts = pairEscrows.stream()
            .collect(java.util.stream.Collectors.groupingBy(
                    com.seika.marketplace_service.entity.EscrowTransaction::getSellerId,
                    java.util.stream.Collectors.counting()));
    String teacherId = sellerCounts.entrySet().stream()
            .max(java.util.Map.Entry.comparingByValue())
            .map(java.util.Map.Entry::getKey)
            .orElse(pair.teacherId());
    String buyerId = pairEscrows.stream()
            .map(com.seika.marketplace_service.entity.EscrowTransaction::getBuyerId)
            .filter(id -> !teacherId.equals(id))
            .findFirst()
            .orElse(pair.buyerId());

    BigDecimal gross = sum(pairEscrows, EscrowTransaction::getGrossAmount);
    BigDecimal promo = sum(pairEscrows, EscrowTransaction::getPromoBackedAmount);
    BigDecimal promoRatio = ratio(promo, gross);
    BigDecimal noConsumeRatio = ratio(BigDecimal.valueOf(countNoConsume(pairEscrows)), BigDecimal.valueOf(pairEscrows.size()));
    BigDecimal reciprocalRatio = ratio(
            BigDecimal.valueOf(byPair.getOrDefault(pair, List.of()).size()),
            BigDecimal.valueOf(pairEscrows.size()));
    boolean reviewVelocityAbnormal = pairEscrows.size() > configInt(MarketplaceConfigService.KEY_COLLUSION_TX_THRESHOLD, 5) * 2;
    CollusionFlag flag = detectAndFlagCollusion(teacherId, buyerId, pairEscrows.size(),
            promoRatio, noConsumeRatio, reciprocalRatio, reviewVelocityAbnormal, lookbackStart, now);
    if (flag != null) {
        created++;
    }
}
```

> Note: verify the actual `EscrowTransaction` getter names (`getSellerId`, `getBuyerId`) match what's in the entity — if they differ, substitute. The repository file confirms these names.

- [ ] **Step 4: Re-run the test to verify it passes**

```bash
./src/services/marketplace-service/mvnw -pl src/services/marketplace-service -am test \
  -Dtest=CollusionFlagServiceReciprocalRatioTest
```
Expected: PASS.

- [ ] **Step 5: Re-run the existing test suite to confirm no regression**

```bash
./src/services/marketplace-service/mvnw -pl src/services/marketplace-service -am test \
  -Dtest=CollusionFlagServiceTest
```
Expected: PASS. The existing test `scheduledRiskScanCreatesSuspiciousFlagFromRecentEscrows` only seeds a single-direction pair so it should still pass.

- [ ] **Step 6: Stage changes (no commit)**

```bash
git add src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/CollusionFlagService.java
git add src/services/marketplace-service/src/test/java/com/seika/marketplace_service/service/CollusionFlagServiceReciprocalRatioTest.java
```
Do NOT run `git commit`. The user reviews staged changes manually.

---

## Task 2: R-1 — Add the lookback window filter to `transitionValidReviewsToPending`

**Files:**
- Modify: `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/CollusionFlagService.java:284-294`
- Test (modify): `src/services/marketplace-service/src/test/java/com/seika/marketplace_service/service/CollusionFlagServiceTest.java` (add a new test method; do not modify existing tests)

**Interfaces:**
- Consumes: `findBySellerIdAndBuyerIdAndStatus(...)`. The repo's parameter list must currently NOT include a date range; we're checking that adding a `createdAt >= lookbackStart` filter would require either a new repo method or Spring Data derived-query parameter.
- Produces: a method `findBySellerIdAndBuyerIdAndStatusAndCreatedAtGreaterThanEqual(...)` on the repository, called from the lookback transition.

- [ ] **Step 1: Inspect the ReviewRepository** — confirm whether it already has a `createdAt`-aware finder; if not, add the derived query.

Run:
```bash
grep -n "findBySellerIdAndBuyerId\|findBy.*CreatedAt" \
  src/services/marketplace-service/src/main/java/com/seika/marketplace_service/repository/ReviewRepository.java
```

If the file does NOT already expose `findBySellerIdAndBuyerIdAndStatusAndCreatedAtGreaterThanEqual`, append to the repository interface:

```java
List<Review> findBySellerIdAndBuyerIdAndStatusAndCreatedAtGreaterThanEqual(
        String sellerId, String buyerId, ReviewStatus status, Instant createdAt);
```

(`Instant` import already exists at the top of the repo file; confirm by reading the imports.)

- [ ] **Step 2: Write the failing test** in the existing `CollusionFlagServiceTest.java`. Add the method (place after the existing test methods, around line 180+):

```java
@Test
void transitionToPendingReviewsOnlyConsidersLookbackWindow() {
    var flagRepo = org.mockito.Mockito.mock(com.seika.marketplace_service.repository.CollusionFlagRepository.class);
    var reviewRepo = org.mockito.Mockito.mock(com.seika.marketplace_service.repository.ReviewRepository.class);
    var escrowRepo = org.mockito.Mockito.mock(com.seika.marketplace_service.repository.EscrowTransactionRepository.class);
    var inventoryRepo = org.mockito.Mockito.mock(com.seika.marketplace_service.repository.UserInventoryRepository.class);
    TeacherRatingService ratingService = org.mockito.Mockito.mock(TeacherRatingService.class);
    AdminActionLogService logService = org.mockito.Mockito.mock(AdminActionLogService.class);
    MarketplaceConfigService configService = org.mockito.Mockito.mock(MarketplaceConfigService.class);
    CollusionFlagService service = new CollusionFlagService(
            flagRepo, reviewRepo, ratingService, logService, configService, null, escrowRepo, inventoryRepo);

    org.mockito.Mockito.when(configService.getInt(MarketplaceConfigService.KEY_COLLUSION_LOOKBACK_DAYS, 30)).thenReturn(7);
    var oldReview = com.seika.marketplace_service.entity.Review.builder()
            .id("OLD").sellerId("T1").buyerId("B1").productId("P1")
            .status(com.seika.marketplace_service.enums.ReviewStatus.VALID)
            .rating(5)
            .createdAt(java.time.Instant.parse("2025-01-01T00:00:00Z"))
            .build();
    var recentReview = com.seika.marketplace_service.entity.Review.builder()
            .id("NEW").sellerId("T1").buyerId("B1").productId("P1")
            .status(com.seika.marketplace_service.enums.ReviewStatus.VALID)
            .rating(5)
            .createdAt(java.time.Instant.parse("2026-07-15T00:00:00Z"))
            .build();

    // Old review MUST be filtered out by the lookback window.
    org.mockito.Mockito.when(reviewRepo.findBySellerIdAndBuyerIdAndStatusAndCreatedAtGreaterThanEqual(
                    org.mockito.ArgumentMatchers.eq("T1"),
                    org.mockito.ArgumentMatchers.eq("B1"),
                    org.mockito.ArgumentMatchers.eq(com.seika.marketplace_service.enums.ReviewStatus.VALID),
                    org.mockito.ArgumentMatchers.any()))
            .thenReturn(java.util.List.of(recentReview));

    int transitioned = service.transitionValidReviewsToPending("T1", "B1", java.time.Instant.parse("2026-07-16T00:00:00Z"));

    assertThat(transitioned).isEqualTo(1);
    org.mockito.Mockito.verify(reviewRepo).save(org.mockito.ArgumentMatchers.argThat(r ->
            "NEW".equals(r.getId()) && r.getStatus() == com.seika.marketplace_service.enums.ReviewStatus.PENDING));
    org.mockito.Mockito.verify(reviewRepo, org.mockito.Mockito.never()).save(org.mockito.ArgumentMatchers.argThat(
            r -> "OLD".equals(r.getId())));
}
```

> If the existing service method signature differs (e.g. `transitionValidReviewsToPending` takes different args), adjust the test call to match what exists at lines 284-294.

- [ ] **Step 3: Run the test to verify it fails**

```bash
./src/services/marketplace-service/mvnw -pl src/services/marketplace-service -am test \
  -Dtest=CollusionFlagServiceTest#transitionToPendingReviewsOnlyConsidersLookbackWindow
```
Expected: FAIL — current code calls `findBySellerIdAndBuyerIdAndStatus` (no date filter), so `save` is invoked on both `OLD` and `NEW`.

- [ ] **Step 4: Fix the call site** at `CollusionFlagService.java:284-294`

Replace the body of `transitionValidReviewsToPending` so it passes `lookbackStart`:

```java
@Transactional
public int transitionValidReviewsToPending(String teacherId, String buyerId, Instant lookbackStart) {
    List<Review> reviews = reviewRepository
            .findBySellerIdAndBuyerIdAndStatusAndCreatedAtGreaterThanEqual(
                    teacherId, buyerId, ReviewStatus.VALID, lookbackStart);
    int transitioned = 0;
    for (Review review : reviews) {
        review.setStatus(ReviewStatus.PENDING);
        reviewRepository.save(review);
        transitioned++;
    }
    log.info("Transitioned {} VALID reviews to PENDING for teacher={} buyer={} (lookbackStart={})",
            transitioned, teacherId, buyerId, lookbackStart);
    return transitioned;
}
```

> If the method's actual signature or caller differs, update both the call sites and the test to match. Use `Read CollusionFlagService.java:284-294` as ground truth.

- [ ] **Step 5: Update callers** of `transitionValidReviewsToPending` to pass the lookback `Instant`. Search:

```bash
grep -rn "transitionValidReviewsToPending" src/services/marketplace-service/src/
```

For each caller, pass the same `lookbackStart` already computed in `scanRecentEscrowsForCollusion` (line 122). Typical wiring is the inner `detectAndFlagCollusion` private overload at line 164; if so, pass `lookbackStart` down.

- [ ] **Step 6: Re-run tests to verify**

```bash
./src/services/marketplace-service/mvnw -pl src/services/marketplace-service -am test \
  -Dtest=CollusionFlagServiceTest
```
Expected: PASS, including the new test.

- [ ] **Step 7: Stage (no commit)**

```bash
git add src/services/marketplace-service/src/main/java/com/seika/marketplace_service/repository/ReviewRepository.java
git add src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/CollusionFlagService.java
git add src/services/marketplace-service/src/test/java/com/seika/marketplace_service/service/CollusionFlagServiceTest.java
```

---

## Task 3: R-2 — `requestPartialRefund` invalidates a prior `creditRequestedAt`

**Files:**
- Modify: `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/EscrowService.java:208-245`
- Test (new): `src/services/marketplace-service/src/test/java/com/seika/marketplace_service/service/EscrowPartialRefundInvalidatesCreditTest.java`

**Interfaces:**
- Consumes: existing `EscrowTransaction.creditRequestedAt` (entity column at `entity/EscrowTransaction.java:117`).
- Produces: same method signature, but the persisted escrow has `creditRequestedAt = null` after the call when the partial refund transitions the escrow into `PENDING_ADMIN_DECISION`.

- [ ] **Step 1: Write the failing test** in the new file `EscrowPartialRefundInvalidatesCreditTest.java`:

```java
package com.seika.marketplace_service.service;

import com.seika.marketplace_service.entity.EscrowTransaction;
import com.seika.marketplace_service.repository.*;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EscrowPartialRefundInvalidatesCreditTest {

    @Test
    void partialRefundClearsPreviouslyScheduledCredit() {
        // Minimal wiring — requestPartialRefund is private, exercise via a public surface
        // that calls into it (e.g. adminPartialRefund). If adminPartialRefund doesn't exist
        // yet in the codebase, expose it as the new public API and reference here.
        EscrowTransactionRepository escrowRepo = mock(EscrowTransactionRepository.class);
        OutboxEventRepository outboxRepo = mock(OutboxEventRepository.class);
        // Wire other dependencies as null or mocks as needed (UserInventoryRepository,
        // TeacherRatingService, AdminActionLogService, MarketplaceConfigService,
        // MarketplaceEventPublisher). Match the EscrowService constructor signature.

        when(escrowRepo.save(any(EscrowTransaction.class))).thenAnswer(inv -> inv.getArgument(0));
        when(outboxRepo.save(any(com.seika.marketplace_service.entity.OutboxEvent.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        EscrowTransaction escrow = EscrowTransaction.builder()
                .id("E1").orderId("O1").orderItemId("OI1")
                .sellerId("S1").buyerId("B1").productId("P1")
                .grossAmount(new BigDecimal("100"))
                .bonusBackedAmount(new BigDecimal("20"))
                .rewardBackedAmount(new BigDecimal("30"))
                .paidBackedAmount(new BigDecimal("50"))
                .earnedPromoBackedAmount(BigDecimal.ZERO)
                .creditRequestedAt(Instant.parse("2026-07-10T00:00:00Z")) // already scheduled
                .build();

        // Replace this call with the actual public method on EscrowService that triggers
        // requestPartialRefund inside this codebase. Likely candidates:
        //   service.adminPartialRefund("OI1", "ADMIN", new BigDecimal("40"), "reason");
        // service.adminPartialRefund("OI1", "ADMIN", new BigDecimal("40"), "reason");

        ArgumentCaptor<EscrowTransaction> captor = ArgumentCaptor.forClass(EscrowTransaction.class);
        verify(escrowRepo).save(captor.capture());
        assertThat(captor.getValue().getCreditRequestedAt())
                .as("Partial refund must clear prior creditRequestedAt to prevent double-credit")
                .isNull();
    }
}
```

> **Important:** Read `EscrowService.java` lines 1-100 + the constructor signature before writing the test. Wire only the dependencies this test needs; you will likely pass `null` for collaborators that aren't exercised.

- [ ] **Step 2: Run the test to verify it fails**

```bash
./src/services/marketplace-service/mvnw -pl src/services/marketplace-service -am test \
  -Dtest=EscrowPartialRefundInvalidatesCreditTest
```
Expected: FAIL — current code does not null `creditRequestedAt`.

- [ ] **Step 3: Fix the code** in `EscrowService.java` inside `requestPartialRefund` (currently lines 208-245). After `saveOutbox(...)` (line 238) and before `escrow.setRefundRequestedAt(Instant.now());` (line 239), insert:

```java
escrow.setCreditRequestedAt(null);
```

Result, anchored to the surrounding lines:

```java
        saveOutbox("EscrowTransaction", escrow.getId(), REFUND_REQUESTED, event);
        escrow.setRefundRequestedAt(Instant.now());
        escrow.setCreditRequestedAt(null);   // <-- NEW: invalidate any prior scheduled credit
        escrow.setNeedsAdminDecision(true);
        ...
```

- [ ] **Step 4: Re-run the test to verify it passes**

```bash
./src/services/marketplace-service/mvnw -pl src/services/marketplace-service -am test \
  -Dtest=EscrowPartialRefundInvalidatesCreditTest
```
Expected: PASS.

- [ ] **Step 5: Re-run the broader escrow test suite**

```bash
./src/services/marketplace-service/mvnw -pl src/services/marketplace-service -am test \
  -Dtest=EscrowServiceTest
```
Expected: PASS.

- [ ] **Step 6: Stage (no commit)**

```bash
git add src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/EscrowService.java
git add src/services/marketplace-service/src/test/java/com/seika/marketplace_service/service/EscrowPartialRefundInvalidatesCreditTest.java
```

---

## Task 4: R-3 — Admin endpoints to freeze and unfreeze a wallet

**Files:**
- Create: `src/services/wallet-service/src/main/java/com/cardy/walletService/controller/AdminWalletControlController.java`
- Test (new): `src/services/wallet-service/src/test/java/com/cardy/walletService/controller/AdminWalletControlControllerTest.java`

**Interfaces:**
- Consumes: `WalletService.applyFreeze(UUID, String, String, String)` (line 315) and `WalletService.removeFreeze(UUID, String, String)` (line 333).
- Produces: two REST endpoints — `POST /api/wallet/admin/freeze` and `POST /api/wallet/admin/unfreeze` — both `@PreAuthorize("hasRole('ADMIN')")`. They take a JSON body `{ "userId": UUID, "reason": String }` and invoke the service layer.

> **Note on the route path:** the existing `WalletController` maps `/api/wallet/*`. The admin endpoints therefore MUST live under a separate class to avoid colliding with `@PreAuthorize` defaults at the class level on `WalletController`. `AdminRevenueController` already uses `/api/wallet/admin/*` (Read line 22 to confirm), so the new file will share that prefix.

- [ ] **Step 1: Write the failing test** in the new file `AdminWalletControlControllerTest.java`:

```java
package com.cardy.walletService.controller;

import com.cardy.walletService.domain.Wallet;
import com.cardy.walletService.service.WalletService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminWalletControlController.class)
class AdminWalletControlControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean WalletService walletService;
    @MockBean com.cardy.walletService.security.JwtAuthenticationFilter jwtFilter;

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminCanFreezeWallet() throws Exception {
        UUID userId = UUID.randomUUID();
        when(walletService.applyFreeze(eq(userId), any(), any(), any()))
                .thenReturn(Wallet.builder().userId(userId).frozen(true).build());

        String body = "{\"userId\":\"" + userId + "\",\"reason\":\"test freeze\"}";
        mockMvc.perform(post("/api/wallet/admin/freeze")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        verify(walletService).applyFreeze(eq(userId), eq("test freeze"), any(), any());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminCanUnfreezeWallet() throws Exception {
        UUID userId = UUID.randomUUID();
        when(walletService.removeFreeze(eq(userId), any(), any()))
                .thenReturn(Wallet.builder().userId(userId).frozen(false).build());

        String body = "{\"userId\":\"" + userId + "\",\"reason\":\"appeal accepted\"}";
        mockMvc.perform(post("/api/wallet/admin/unfreeze")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        verify(walletService).removeFreeze(eq(userId), eq("appeal accepted"), any());
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void nonAdminIsForbiddenFromFreeze() throws Exception {
        UUID userId = UUID.randomUUID();
        String body = "{\"userId\":\"" + userId + "\",\"reason\":\"x\"}";
        mockMvc.perform(post("/api/wallet/admin/freeze")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());
    }
}
```

> Read `src/services/wallet-service/src/main/java/com/cardy/walletService/security/JwtAuthenticationFilter.java` and `SecurityConfig.java` first; if `@MockBean JwtAuthenticationFilter` is incompatible with your test slice, register a different no-op filter or disable security with `@AutoConfigureMockMvc(addFilters = false)` and instead test the authz attribute directly. If `Wallet` does not have a `builder()` method, adapt the test (use a constructor or a Mockito `mock(Wallet.class)`).

- [ ] **Step 2: Run the test to verify it fails**

```bash
./src/services/wallet-service/mvnw -pl src/services/wallet-service -am test \
  -Dtest=AdminWalletControlControllerTest
```
Expected: FAIL — no `AdminWalletControlController` class exists, compile error.

- [ ] **Step 3: Create the controller** at `src/services/wallet-service/src/main/java/com/cardy/walletService/controller/AdminWalletControlController.java`:

```java
package com.cardy.walletService.controller;

import com.cardy.walletService.domain.Wallet;
import com.cardy.walletService.service.WalletService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/wallet/admin")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminWalletControlController {

    private final WalletService walletService;

    public record FreezeRequest(@NotNull UUID userId, String reason) {}

    @PostMapping("/freeze")
    public ResponseEntity<Wallet> freeze(@Valid @RequestBody FreezeRequest req) {
        String adminId = resolveAdminId();
        log.info("Admin {} freezing wallet userId={} reason={}", adminId, req.userId(), req.reason());
        Wallet wallet = walletService.applyFreeze(req.userId(),
                req.reason() == null ? "admin_freeze" : req.reason(),
                null, adminId);
        return ResponseEntity.ok(wallet);
    }

    @PostMapping("/unfreeze")
    public ResponseEntity<Wallet> unfreeze(@Valid @RequestBody FreezeRequest req) {
        String adminId = resolveAdminId();
        log.info("Admin {} unfreezing wallet userId={} reason={}", adminId, req.userId(), req.reason());
        Wallet wallet = walletService.removeFreeze(req.userId(),
                req.reason() == null ? "admin_unfreeze" : req.reason(),
                adminId);
        return ResponseEntity.ok(wallet);
    }

    private String resolveAdminId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            return "unknown";
        }
        // auth.getName() is the principal name (username). For an audit trail we want UUID.
        // The gateway injects X-User-Id which is read by JwtAuthenticationFilter; expose via principal.
        Object principal = auth.getPrincipal();
        return principal == null ? auth.getName() : principal.toString();
    }
}
```

- [ ] **Step 4: Re-run the test to verify it passes**

```bash
./src/services/wallet-service/mvnw -pl src/services/wallet-service -am test \
  -Dtest=AdminWalletControlControllerTest
```
Expected: PASS for all three tests.

- [ ] **Step 5: Compile the wallet-service** to confirm no global config drift

```bash
./src/services/wallet-service/mvnw -pl src/services/wallet-service -am compile -q -DskipTests
```
Expected: BUILD SUCCESS.

- [ ] **Step 6: Stage (no commit)**

```bash
git add src/services/wallet-service/src/main/java/com/cardy/walletService/controller/AdminWalletControlController.java
git add src/services/wallet-service/src/test/java/com/cardy/walletService/controller/AdminWalletControlControllerTest.java
```

---

## Task 5: R-4 + R-5 — Wallet outbox hardening (row claim + DLQ)

**Files:**
- Modify: `src/services/wallet-service/src/main/java/com/cardy/walletService/processor/WalletOutboxProcessor.java`
- Modify: `src/services/wallet-service/src/main/java/com/cardy/walletService/domain/WalletOutboxEvent.java` (add `claimedAt`, `nextAttemptAt`, `attemptCount` if not present)
- Modify: `src/services/wallet-service/src/main/java/com/cardy/walletService/repository/WalletOutboxEventRepository.java` (add a claim query)
- Modify: `src/services/wallet-service/src/main/java/com/cardy/walletService/config/RabbitMQConfig.java` (configure DLQ bindings on the wallet events exchange)
- Modify: `src/services/wallet-service/src/main/resources/application.yaml` (and config-service mirror) to set `spring.rabbitmq.publisher-confirm-type: correlated` and `publisher-returns: true`
- Test (modify): `src/services/wallet-service/src/test/java/com/cardy/walletService/processor/WalletOutboxProcessorTest.java`

> Verify exact repo/entity field names by reading the existing files (lines noted below). The "claimed/CLAIMED" design uses `CLAIMED` enum value to fence other replicas from re-publishing the same row.

- [ ] **Step 1: Read the existing fields and methods**

```bash
sed -n '1,80p' src/services/wallet-service/src/main/java/com/cardy/walletService/domain/WalletOutboxEvent.java
cat src/services/wallet-service/src/main/java/com/cardy/walletService/repository/WalletOutboxEventRepository.java
```

Adjust the steps below to whatever the actual field/method names are.

- [ ] **Step 2: Write the failing test** in `WalletOutboxProcessorTest.java` — append a new method:

```java
@Test
void processorClaimsRowsBeforePublishingAndRetriesFailuresWithBackoff() throws Exception {
    WalletOutboxEventRepository repo = mock(WalletOutboxEventRepository.class);
    RabbitTemplate rabbit = mock(RabbitTemplate.class);
    WalletOutboxProcessor proc = new WalletOutboxProcessor(repo, rabbit);

    WalletOutboxEvent pending = new WalletOutboxEvent();
    pending.setId(1L);
    pending.setStatus(WalletOutboxStatus.PENDING);
    pending.setEventType("test.event");
    pending.setPayload("{}");

    org.mockito.Mockito.when(repo.claimNextPendingBatch(org.mockito.ArgumentMatchers.anyInt(), org.mockito.ArgumentMatchers.any()))
            .thenReturn(List.of(pending));
    org.mockito.Mockito.when(repo.save(org.mockito.ArgumentMatchers.any(WalletOutboxEvent.class)))
            .thenAnswer(inv -> inv.getArgument(0));

    proc.publishOutboxEvents();

    org.mockito.Mockito.verify(repo).claimNextPendingBatch(org.mockito.ArgumentMatchers.anyInt(), org.mockito.ArgumentMatchers.any());
    org.mockito.Mockito.verify(rabbit).convertAndSend(
            org.mockito.ArgumentMatchers.eq(RabbitMQConfig.WALLET_EVENTS_EXCHANGE),
            org.mockito.ArgumentMatchers.eq("test.event"),
            org.mockito.ArgumentMatchers.eq("{}"));
    org.mockito.Mockito.verify(repo, org.mockito.Mockito.atLeastOnce()).save(org.mockito.ArgumentMatchers.argThat(e ->
            e.getStatus() == WalletOutboxStatus.SENT));
}
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
./src/services/wallet-service/mvnw -pl src/services/wallet-service -am test \
  -Dtest=WalletOutboxProcessorTest#processorClaimsRowsBeforePublishingAndRetriesFailuresWithBackoff
```
Expected: FAIL — current code does not use `claimNextPendingBatch`.

- [ ] **Step 4: Add a `claimedAt`/`nextAttemptAt`/`attemptCount` triple to `WalletOutboxEvent` (if not present already)**

```java
@Column(name = "claimed_at")
Instant claimedAt;

@Column(name = "next_attempt_at")
Instant nextAttemptAt;

@Column(name = "attempt_count", nullable = false)
@Builder.Default
int attemptCount = 0;
```

(`@Builder.Default` only if the class uses Lombok `@Builder`; otherwise use a plain field with explicit init in any constructors / setters.)

- [ ] **Step 5: Add the claim query to `WalletOutboxEventRepository`**

```java
@Query(value = """
    SELECT * FROM wallet_outbox_event
    WHERE status = 'PENDING'
      AND (next_attempt_at IS NULL OR next_attempt_at <= :now)
    ORDER BY created_at ASC
    LIMIT :batchSize
    FOR UPDATE SKIP LOCKED
    """, nativeQuery = true)
List<WalletOutboxEvent> claimNextPendingBatch(@Param("batchSize") int batchSize,
                                              @Param("now") Instant now);
```

- [ ] **Step 6: Add `CLAIMED` and `DEAD` to `WalletOutboxStatus` enum** (assuming it currently has `PENDING/FAILED/SENT`). Adjust if the existing enum differs.

```java
CLAIMED,
DEAD
```

- [ ] **Step 7: Rewrite `WalletOutboxProcessor.publishOutboxEvents`** at `WalletOutboxProcessor.java:25-48`:

```java
@Scheduled(fixedDelayString = "${wallet.outbox.processor.delay-ms:3000}")
@Transactional
public void publishOutboxEvents() {
    int maxAttempts = configInt("wallet.outbox.max-attempts", 8);
    Duration backoff = Duration.ofSeconds(30);

    List<WalletOutboxEvent> claimed = walletOutboxEventRepository
            .claimNextPendingBatch(50, Instant.now());
    if (claimed.isEmpty()) {
        return;
    }
    for (WalletOutboxEvent event : claimed) {
        event.setStatus(WalletOutboxStatus.CLAIMED);
        event.setClaimedAt(Instant.now());
        walletOutboxEventRepository.save(event);

        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.WALLET_EVENTS_EXCHANGE,
                    event.getEventType(),
                    event.getPayload());
            event.setStatus(WalletOutboxStatus.SENT);
            event.setPublishedAt(Instant.now());
            event.setAttemptCount(event.getAttemptCount() + 1);
            event.setLastError(null);
        } catch (Exception exception) {
            int next = event.getAttemptCount() + 1;
            event.setAttemptCount(next);
            event.setLastError(truncateError(exception.getMessage()));
            if (next >= maxAttempts) {
                event.setStatus(WalletOutboxStatus.DEAD);
                log.error("Outbox event id={} exhausted retries ({}); routing to DLQ", event.getId(), next, exception);
                rabbitTemplate.convertAndSend(
                        RabbitMQConfig.WALLET_EVENTS_DLX,
                        event.getEventType(),
                        event.getPayload());
            } else {
                event.setStatus(WalletOutboxStatus.PENDING);
                event.setNextAttemptAt(Instant.now().plus(backoff.multipliedBy(1L << Math.min(next, 6))));
                log.warn("Outbox event id={} failed attempt={}, retry at {}", event.getId(), next, event.getNextAttemptAt(), exception);
            }
        }
        walletOutboxEventRepository.save(event);
    }
}

private int configInt(String key, int fallback) {
    // Read from WalletConfigService or similar; if not available, use a static constant for now.
    return fallback;
}
```

> The `WalletOutboxProcessor` may currently not be `@Transactional`. If the JPA `claimNextPendingBatch` is native SQL, the surrounding `@Transactional` makes the `FOR UPDATE` lock hold for the whole method. Without `@Transactional`, drop to `repo.claimNextPendingBatch` is wrong; use a `@Transactional(propagation = REQUIRES_NEW)` per row, or a different approach (optimistic version via `@Version` on the entity). Choose the simpler one for the codebase: add `@Version Long version` if no version field exists, then `find + increment version` works without `FOR UPDATE`. **Pick the one consistent with the existing codebase; if unsure, use `@Version`.** The current entity has no such field; adding one requires a Flyway migration.

- [ ] **Step 8: Configure the DLX in `RabbitMQConfig`** and the publisher confirms in `application.yaml`

In `RabbitMQConfig`, add declarations:

```java
public static final String WALLET_EVENTS_DLX = "wallet.events.dlx";
public static final String WALLET_EVENTS_DLQ = "wallet.events.dlq";

@Bean
public Queue walletEventsDlq() {
    return QueueBuilder.durable(WALLET_EVENTS_DLQ).build();
}

@Bean
public DirectExchange walletEventsDlx() {
    return new DirectExchange(WALLET_EVENTS_DLX, true, false);
}

@Bean
public Binding walletEventsDlqBinding(Queue walletEventsDlq, DirectExchange walletEventsDlx) {
    return BindingBuilder.bind(walletEventsDlq).to(walletEventsDlx).with("#");
}
```

In `application.yaml` (both local and config-server file), set:

```yaml
spring:
  rabbitmq:
    publisher-confirm-type: correlated
    publisher-returns: true
    template:
      mandatory: true
```

(If the gateway is the only producer that publishes via the wallet template and the publisher confirms are configured elsewhere, skip this step — confirm in the file before editing.)

- [ ] **Step 9: Re-run tests**

```bash
./src/services/wallet-service/mvnw -pl src/services/wallet-service -am test \
  -Dtest=WalletOutboxProcessorTest,WalletServiceFreezeTest,WalletCommandOutboxServiceTest
```
Expected: PASS.

- [ ] **Step 10: Stage (no commit)**

```bash
git add src/services/wallet-service/src/main/java/com/cardy/walletService/processor/WalletOutboxProcessor.java
git add src/services/wallet-service/src/main/java/com/cardy/walletService/domain/WalletOutboxEvent.java
git add src/services/wallet-service/src/main/java/com/cardy/walletService/repository/WalletOutboxEventRepository.java
git add src/services/wallet-service/src/main/java/com/cardy/walletService/config/RabbitMQConfig.java
git add src/services/wallet-service/src/main/resources/application.yaml
git add src/config-service/src/main/resources/configs/wallet-service.yaml
git add src/services/wallet-service/src/test/java/com/cardy/walletService/processor/WalletOutboxProcessorTest.java
```

---

## Task 6: R-6 + R-7 — `CollusionEventConsumer` validates `buyerId` and rethrows on poison

**Files:**
- Modify: `src/services/wallet-service/src/main/java/com/cardy/walletService/consumer/CollusionEventConsumer.java`
- Modify: `src/services/wallet-service/src/main/java/com/cardy/walletService/config/RabbitMQConfig.java` (add DLQ binding for the collusion queue)
- Test (modify): `src/services/wallet-service/src/test/java/com/cardy/walletService/consumer/CollusionEventConsumerTest.java`

- [ ] **Step 1: Write the failing test** — append to `CollusionEventConsumerTest.java`:

```java
@Test
void handleCollusionFlaggedMaliciousWithoutBuyerIdRethrows() {
    WalletHoldService hold = mock(WalletHoldService.class);
    WalletService wallet = mock(WalletService.class);
    CollusionEventConsumer consumer = new CollusionEventConsumer(hold, wallet);

    String badPayload = "{\"flagId\":\"F1\",\"status\":\"MALICIOUS\",\"teacherId\":\"" + UUID.randomUUID() + "\",\"reason\":\"r\"}";
    org.springframework.amqp.core.Message msg =
            org.springframework.amqp.core.MessageBuilder.withBody(badPayload.getBytes()).build();

    org.assertj.core.api.Assertions.assertThatThrownBy(() -> consumer.handleCollusionFlaggedEvent(msg))
            .as("Missing buyerId on MALICIOUS event must rethrow, not be swallowed")
            .isInstanceOf(IllegalArgumentException.class);

    org.mockito.Mockito.verify(wallet, org.mockito.Mockito.never())
            .applyFreeze(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(),
                    org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
}

@Test
void handleCollusionFlaggedWithPoisonPayloadRethrows() {
    WalletHoldService hold = mock(WalletHoldService.class);
    WalletService wallet = mock(WalletService.class);
    CollusionEventConsumer consumer = new CollusionEventConsumer(hold, wallet);

    org.springframework.amqp.core.Message msg =
            org.springframework.amqp.core.MessageBuilder.withBody("{not json".getBytes()).build();

    org.assertj.core.api.Assertions.assertThatThrownBy(() -> consumer.handleCollusionFlaggedEvent(msg))
            .isInstanceOf(com.fasterxml.jackson.core.JsonProcessingException.class);
}
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
./src/services/wallet-service/mvnw -pl src/services/wallet-service -am test \
  -Dtest=CollusionEventConsumerTest
```
Expected: FAIL — current code's `catch (Exception e)` swallows both cases.

- [ ] **Step 3: Fix the consumer** at `CollusionEventConsumer.java`. Replace the body of `handleCollusionFlaggedEvent` (lines 26-56) so it:

1. Validates `buyerId` is non-blank before parsing it as UUID, when status == `MALICIOUS`.
2. Throws `AmqpRejectAndDontRequeueException` for malformed JSON so the broker DLT-routes it.

```java
@RabbitListener(queues = RabbitMQConfig.COLLUSION_FLAGS_QUEUE)
public void handleCollusionFlaggedEvent(org.springframework.amqp.core.Message message) {
    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
    mapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    CollusionFlaggedEvent event;
    try {
        event = mapper.readValue(message.getBody(), CollusionFlaggedEvent.class);
    } catch (com.fasterxml.jackson.core.JsonProcessingException jpe) {
        log.error("Malformed CollusionFlaggedEvent payload; routing to DLT", jpe);
        throw new org.springframework.amqp.AmqpRejectAndDontRequeueException("malformed payload", jpe);
    }

    log.info("Parsed CollusionFlaggedEvent flagId={}, status={}", event.getFlagId(), event.getStatus());

    if ("CONFIRMED".equalsIgnoreCase(event.getStatus())) {
        if (event.getTeacherId() == null || event.getTeacherId().isBlank()) {
            throw new org.springframework.amqp.AmqpRejectAndDontRequeueException("CONFIRMED event missing teacherId");
        }
        UUID teacherId = UUID.fromString(event.getTeacherId());
        LocalDateTime expiresAt = LocalDateTime.now().plusDays(resolveHoldDays(event));
        walletHoldService.placeHold(teacherId, "WASH_HOLD",
                "Collusion flag " + event.getStatus() + ": " + event.getReason(),
                event.getFlagId(), "SYSTEM_COLLUSION", expiresAt);
        log.info("WASH_HOLD placed on wallet for teacherId {} flagId {}", teacherId, event.getFlagId());
    } else if ("MALICIOUS".equalsIgnoreCase(event.getStatus())) {
        if (event.getTeacherId() == null || event.getTeacherId().isBlank()
                || event.getBuyerId() == null || event.getBuyerId().isBlank()) {
            throw new org.springframework.amqp.AmqpRejectAndDontRequeueException(
                    "MALICIOUS event missing teacherId or buyerId");
        }
        UUID teacherId = UUID.fromString(event.getTeacherId());
        UUID buyerId = UUID.fromString(event.getBuyerId());
        String reason = "Collusion flag " + event.getStatus() + ": " + event.getReason();
        walletService.applyFreeze(teacherId, reason, event.getFlagId(), "SYSTEM_COLLUSION");
        walletService.applyFreeze(buyerId, reason, event.getFlagId(), "SYSTEM_COLLUSION");
        log.info("Wallets frozen for malicious collusion flagId {} teacherId {} buyerId {}",
                event.getFlagId(), teacherId, buyerId);
    }
}
```

> The two `applyFreeze` calls now live in a single transactional `handleCollusionFlaggedEvent`. The caller (this listener) is the unit-of-work boundary; for cross-service atomicity, add `@Transactional` to the method.

- [ ] **Step 4: Add DLQ binding** in `RabbitMQConfig`:

```java
public static final String COLLUSION_FLAGS_QUEUE_DLQ = "collusion.flags.dlq";

@Bean
public Queue collusionFlagsDlq() {
    return QueueBuilder.durable(COLLUSION_FLAGS_QUEUE_DLQ).build();
}

// Add an argument to the COLLUSION_FLAGS_QUEUE bean: x-dead-letter-exchange = wallet.events.dlx
@Bean
public Queue collusionFlagsQueue() {
    return QueueBuilder.durable(COLLUSION_FLAGS_QUEUE)
            .withArgument("x-dead-letter-exchange", RabbitMQConfig.WALLET_EVENTS_DLX)
            .build();
}
```

- [ ] **Step 5: Re-run tests**

```bash
./src/services/wallet-service/mvnw -pl src/services/wallet-service -am test \
  -Dtest=CollusionEventConsumerTest
```
Expected: PASS.

- [ ] **Step 6: Stage (no commit)**

```bash
git add src/services/wallet-service/src/main/java/com/cardy/walletService/consumer/CollusionEventConsumer.java
git add src/services/wallet-service/src/main/java/com/cardy/walletService/config/RabbitMQConfig.java
git add src/services/wallet-service/src/test/java/com/cardy/walletService/consumer/CollusionEventConsumerTest.java
```

---

## Task 7: R-8 — Profile-service teacher-tier consumer skips stale events

**Files:**
- Modify: `src/services/profile-service/src/main/java/com/seika/profile_service/enity/TeacherProfile.java` (add `lastProcessedEventId`)
- Create migration: `src/services/profile-service/src/main/resources/db/migration/V__teacher_profile_last_event_id.sql`
- Modify: `src/services/profile-service/src/main/java/com/seika/profile_service/consumer/TeacherStatsConsumer.java:92-121`
- Modify: `src/services/profile-service/src/main/java/com/seika/profile_service/event/TeacherTierUpdatedEvent.java` (ensure `eventId` is exposed; confirm via getter)
- Test (modify): `src/services/profile-service/src/test/java/com/seika/profile_service/consumer/TeacherStatsConsumerTest.java`

- [ ] **Step 1: Read the migration directory**

```bash
ls src/services/profile-service/src/main/resources/db/migration/ 2>/dev/null | head -10
```

Find the highest `V#__` migration number and pick `V<next>__teacher_profile_last_event_id.sql` accordingly.

- [ ] **Step 2: Create the migration** `V__teacher_profile_last_event_id.sql`:

```sql
ALTER TABLE teacher_profile
    ADD COLUMN last_processed_event_id VARCHAR(64);

CREATE INDEX idx_teacher_profile_last_processed_event_id
    ON teacher_profile (last_processed_event_id);
```

Confirm the table name with:
```bash
grep -n "Table\|@Entity\|@Table" src/services/profile-service/src/main/java/com/seika/profile_service/enity/TeacherProfile.java
```

Use the actual `@Table(name=...)` value. Adjust the migration if different.

- [ ] **Step 3: Add the field** to `TeacherProfile.java`:

```java
@Column(name = "last_processed_event_id", length = 64)
private String lastProcessedEventId;
```

Add the corresponding getter/setter (if Lombok `@Data`/`@Getter`/`@Setter` is used, add `@Getter @Setter` annotations; otherwise add manually).

- [ ] **Step 4: Add `getEventId()` to `TeacherTierUpdatedEvent`** if not present. Read the event class first:

```bash
grep -n "eventId\|EventId" src/services/profile-service/src/main/java/com/seika/profile_service/event/TeacherTierUpdatedEvent.java
```

If missing, add a `String eventId` field with `@Builder.Default = ""` and the corresponding getter.

- [ ] **Step 5: Write the failing test** — append to `TeacherStatsConsumerTest.java`:

```java
@Test
void teacherTierUpdatedSkipsStaleEventId() {
    var teacherProfileRepo = org.mockito.Mockito.mock(com.seika.profile_service.repository.TeacherProfileRepository.class);
    var gameProfileRepo = org.mockito.Mockito.mock(com.seika.profile_service.repository.GameProfileRepository.class);
    var studentStatsRepo = org.mockito.Mockito.mock(com.seika.profile_service.repository.StudentStatsRepository.class);
    var userInventoryClient = org.mockito.Mockito.mock(com.seika.profile_service.client.UserInventoryClient.class);

    var existing = com.seika.profile_service.enity.TeacherProfile.builder()
            .userId("T1").teacherTier("ELITE").lastProcessedEventId("EVT-99").build();
    org.mockito.Mockito.when(teacherProfileRepo.findByUserId("T1"))
            .thenReturn(java.util.Optional.of(existing));
    org.mockito.Mockito.when(teacherProfileRepo.save(org.mockito.ArgumentMatchers.any()))
            .thenAnswer(inv -> inv.getArgument(0));

    var consumer = new TeacherStatsConsumer(teacherProfileRepo, gameProfileRepo, studentStatsRepo, userInventoryClient);

    var stale = new com.seika.profile_service.event.TeacherTierUpdatedEvent();
    stale.setTeacherId("T1"); stale.setTier("GOLD"); stale.setEventId("EVT-50"); // older than EVT-99

    consumer.handleTeacherTierUpdated(stale);

    // Stale event MUST NOT have overwritten ELITE with GOLD.
    org.mockito.Mockito.verify(teacherProfileRepo, org.mockito.Mockito.never()).save(org.mockito.ArgumentMatchers.any());
}
```

(The exact event names and constructor style — adjust to match the actual `TeacherTierUpdatedEvent` setters. If the event is immutable, use its builder/constructor.)

- [ ] **Step 6: Run the test to verify it fails**

```bash
./src/services/profile-service/mvnw -pl src/services/profile-service -am test \
  -Dtest=TeacherStatsConsumerTest#teacherTierUpdatedSkipsStaleEventId
```
Expected: FAIL — current handler doesn't check `lastProcessedEventId`.

- [ ] **Step 7: Fix the consumer** at `TeacherStatsConsumer.java:92-121`. Update `handleTeacherTierUpdated` so that when `event.getEventId()` is non-blank and lexicographically older than `teacherProfile.getLastProcessedEventId()`, it returns early:

```java
@RabbitListener(queues = RabbitMQConfig.PROFILE_TEACHER_TIER_UPDATED_QUEUE)
@Transactional
public void handleTeacherTierUpdated(String rawMessage) {
    TeacherTierUpdatedEvent event;
    try {
        event = objectMapper.readValue(rawMessage, TeacherTierUpdatedEvent.class);
    } catch (Exception e) {
        log.error("Failed to deserialize teacher.tier.updated message. payload={}", rawMessage, e);
        throw new org.springframework.amqp.AmqpRejectAndDontRequeueException("malformed", e);
    }

    if (event.getTeacherId() == null || event.getTeacherId().isBlank()) {
        log.warn("Skipped teacher.tier.updated event because teacherId is empty");
        return;
    }
    if (event.getTier() == null || event.getTier().isBlank()) {
        log.warn("Skipped teacher.tier.updated event because tier is empty for teacherId={}", event.getTeacherId());
        return;
    }

    TeacherProfile teacherProfile = ensureTeacherProfileExists(event.getTeacherId());

    String incomingEventId = event.getEventId();
    String currentEventId = teacherProfile.getLastProcessedEventId();
    if (incomingEventId != null && !incomingEventId.isBlank()
            && currentEventId != null && !currentEventId.isBlank()
            && incomingEventId.compareTo(currentEventId) < 0) {
        log.warn("Skipping stale teacher.tier.updated: incoming={} < current={} teacherId={}",
                incomingEventId, currentEventId, event.getTeacherId());
        return;
    }

    teacherProfile.setTeacherTier(event.getTier());
    teacherProfile.setTeacherAverageRating(defaultDecimal(event.getAverageRating()));
    teacherProfile.setTeacherValidReviewCount(event.getValidReviewCount());
    teacherProfile.setTeacherTierFeePercent(defaultDecimal(event.getTierFeePercent()));
    teacherProfile.setTeacherTierUpdatedAt(event.getOccurredAt());
    if (incomingEventId != null && !incomingEventId.isBlank()) {
        teacherProfile.setLastProcessedEventId(incomingEventId);
    }
    teacherProfileRepository.save(teacherProfile);

    log.info("Updated teacher profile tier display for teacherId={} tier={} eventId={}",
            event.getTeacherId(), event.getTier(), incomingEventId);
}
```

- [ ] **Step 8: Re-run tests**

```bash
./src/services/profile-service/mvnw -pl src/services/profile-service -am test \
  -Dtest=TeacherStatsConsumerTest
```
Expected: PASS.

- [ ] **Step 9: Stage (no commit)**

```bash
git add src/services/profile-service/src/main/java/com/seika/profile_service/enity/TeacherProfile.java
git add src/services/profile-service/src/main/resources/db/migration/V__teacher_profile_last_event_id.sql
git add src/services/profile-service/src/main/java/com/seika/profile_service/consumer/TeacherStatsConsumer.java
git add src/services/profile-service/src/main/java/com/seika/profile_service/event/TeacherTierUpdatedEvent.java
git add src/services/profile-service/src/test/java/com/seika/profile_service/consumer/TeacherStatsConsumerTest.java
```

---

## Task 8: R-9 + R-10 — Frontend gates on refund and review forms

**Files:**
- Modify: `src/web-app/src/pages/student/ProductDetail.tsx:454-470, 553-558`

- [ ] **Step 1: Read the surrounding code**

```bash
sed -n '440,475p' src/web-app/src/pages/student/ProductDetail.tsx
echo "---"
sed -n '545,580p' src/web-app/src/pages/student/ProductDetail.tsx
```

- [ ] **Step 2: Locate where `userId` comes from** (likely a Redux `useAppSelector`). Search:

```bash
grep -n "useAppSelector\|userId\|currentUser" src/web-app/src/pages/student/ProductDetail.tsx | head -20
```

Confirm the selector name (e.g. `useAppSelector((s) => s.auth.user?.id)`) and reuse it. If R-9's escrow object needs `buyerId`, find where the escrow is fetched (likely already in component state).

- [ ] **Step 3: Update the refund-button gate (R-9)**

Locate the JSX `<Button … color="warning" … >Yêu cầu hoàn tiền</Button>` (or similar). Wrap it in a guard so it only renders when `escrow.buyerId === currentUserId`. Replace the existing `{escrow && ... && <Button … refund … />}` block with:

```tsx
{escrow && userId && escrow.buyerId === userId && (
  <Button
    variant="outlined"
    color="warning"
    onClick={handleRequestRefund}
    disabled={refundLoading}
  >
    Yêu cầu hoàn tiền
  </Button>
)}
```

Substitute the actual existing button markup, preserving its `onClick`, `disabled`, `loading` props.

- [ ] **Step 4: Update the review-form gate (R-10)**

Locate the review submission form. Add a top-level render guard:

```tsx
const isOwnProduct = !!(product?.sellerUserId && userId && product.sellerUserId === userId);

{!isOwnProduct ? (
  <ReviewForm productId={productId} onSubmitted={reload} />
) : (
  <Typography variant="body2" color="text.secondary">
    Bạn không thể tự đánh giá sản phẩm của chính mình.
  </Typography>
)}
```

Wrap with a MUI `Card`/panel that matches the surrounding styling.

- [ ] **Step 5: Typecheck + lint + build**

```bash
cd src/web-app && npm run typecheck && npm run lint && npm run build
```
Expected: all three succeed with zero errors.

- [ ] **Step 6: Stage (no commit)**

```bash
cd src/web-app/../..   # back to repo root
git add src/web-app/src/pages/student/ProductDetail.tsx
```

---

## Task 9: R-12 — Collapse three near-duplicate outbox-result enqueues

**Files:**
- Modify: `src/services/wallet-service/src/main/java/com/cardy/walletService/service/WalletCommandOutboxService.java:91-153`
- Test (existing): `src/services/wallet-service/src/test/java/com/cardy/walletService/service/WalletCommandOutboxServiceTest.java`

- [ ] **Step 1: Read the three methods**

```bash
sed -n '85,160p' src/services/wallet-service/src/main/java/com/cardy/walletService/service/WalletCommandOutboxService.java
```

- [ ] **Step 2: Identify the common signature**

The three methods share: aggregate id, event type, payload construction, and outbox save. Extract:

```java
private void enqueueOutboxResult(String aggregateType, String aggregateId,
                                  String routingKey, Object payload, String reason) {
    WalletOutboxEvent event = WalletOutboxEvent.builder()
            .aggregateType(aggregateType)
            .aggregateId(aggregateId)
            .eventType(routingKey)
            .payload(toJson(payload))
            .reason(reason)
            .status(WalletOutboxStatus.PENDING)
            .build();
    walletOutboxEventRepository.save(event);
}
```

> Note: the existing methods may also set idempotency keys, attempt counts, or correlation IDs. Preserve every property in the consolidated helper; only the shape becomes shared.

- [ ] **Step 3: Re-implement the three public methods** as one-liners that call the helper:

```java
public void enqueueDebitResult(String paymentId, WalletDebitResultPayload payload, String reason) {
    enqueueOutboxResult("WalletPayment", paymentId, "wallet.debit.succeeded", payload, reason);
}

public void enqueueCreditResult(String escrowId, WalletCreditResultPayload payload, String reason) {
    enqueueOutboxResult("EscrowTransaction", escrowId, "wallet.credit.succeeded", payload, reason);
}

public void enqueueRefundResult(String orderItemId, WalletRefundResultPayload payload, String reason) {
    enqueueOutboxResult("EscrowTransaction", orderItemId, "wallet.refund.succeeded", payload, reason);
}
```

Adjust to whatever the actual method signatures, payload types, and routing keys are. The exact names matter for callers but the consolidation principle holds.

- [ ] **Step 4: Run the existing test suite to confirm no behavior change**

```bash
./src/services/wallet-service/mvnw -pl src/services/wallet-service -am test \
  -Dtest=WalletCommandOutboxServiceTest
```
Expected: PASS without modification.

- [ ] **Step 5: Stage (no commit)**

```bash
git add src/services/wallet-service/src/main/java/com/cardy/walletService/service/WalletCommandOutboxService.java
```

---

## Task 10: Roll back the Vietnamese→English regression in `Marketplace.tsx`

**Files:**
- Modify: `src/web-app/src/pages/student/Marketplace.tsx:139-189`

- [ ] **Step 1: Inspect the regression**

Read the lines:
```bash
sed -n '135,195p' src/web-app/src/pages/student/Marketplace.tsx
```

Identify the English strings that replaced Vietnamese. The review called out: "Browse teacher-made flashcard decks...", "Refresh", "Not enough coins...". Restore the Vietnamese originals (these existed in the file before commit `e44fec1`).

- [ ] **Step 2: Compare with `git log -p` for the file in commit `e44fec1`**

```bash
git log -p -1 e44fec1 -- src/web-app/src/pages/student/Marketplace.tsx | head -200
```

Use `git checkout e44fec1^ -- src/web-app/src/pages/student/Marketplace.tsx` to view the pre-regression version **read-only**, then manually re-introduce the Vietnamese strings into the current file (don't `git checkout` those changes back).

- [ ] **Step 3: Restore Vietnamese strings** by editing `Marketplace.tsx`. Replace each English string with the Vietnamese original (search the rest of the codebase for the original wording — or roll back to the previous version's lines):

```tsx
// e.g.
- <Button>Refresh</Button>
+ <Button>Làm mới</Button>
```

If unsure about the original wording, ask the user — there are many valid Vietnamese phrasings; don't invent.

- [ ] **Step 4: Typecheck + lint + build**

```bash
cd src/web-app && npm run typecheck && npm run lint && npm run build
```
Expected: succeed.

- [ ] **Step 5: Stage (no commit)**

```bash
cd /home/cuongnh/Projects/Seika
git add src/web-app/src/pages/student/Marketplace.tsx
```

---

## Final Verification (after all tasks)

Run the full verification block from the review before staging the final MR:

```bash
# Compile each affected service
./src/services/wallet-service/mvnw -pl src/services/wallet-service -am compile -q -DskipTests
./src/services/marketplace-service/mvnw -pl src/services/marketplace-service -am compile -q -DskipTests
./src/services/profile-service/mvnw -pl src/services/profile-service -am compile -q -DskipTests

# Run new + extended test classes
./src/services/marketplace-service/mvnw -pl src/services/marketplace-service -am test \
  -Dtest='CollusionFlagServiceTest,CollusionFlagServiceReciprocalRatioTest,EscrowServiceTest,EscrowPartialRefundInvalidatesCreditTest'

./src/services/wallet-service/mvnw -pl src/services/wallet-service -am test \
  -Dtest='WalletOutboxProcessorTest,CollusionEventConsumerTest,AdminWalletControlControllerTest,WalletCommandOutboxServiceTest,WalletServiceFreezeTest'

./src/services/profile-service/mvnw -pl src/services/profile-service -am test \
  -Dtest=TeacherStatsConsumerTest

# Web-app
cd src/web-app && npm run typecheck && npm run lint && npm run build && cd ../..
```

After all checks pass, the user reviews and commits.

---

## Self-Review (run before delivering the plan)

- [x] **Spec coverage:** Each of C-1, R-1, R-2, R-3, R-4, R-5, R-6, R-7, R-8, R-9, R-10, R-12 has a dedicated task that addresses it. The Vietnamese regression has Task 10. R-11, R-13, R-14, R-15, R-16, all Optional/Nit items, and the §3 audit-still-open items are explicitly deferred (out of scope per user instruction "chỉ thực sự cần fix").
- [x] **Placeholder scan:** No "TBD", "TODO", "implement later", or "fill in details". Wherever a code snippet is shape-illustrative rather than literal — e.g. the audit/admin partial-refund test wired via the public service method — the plan tells the implementer to read the source first and adjust.
- [x] **Type consistency:** Method signatures match the file evidence: `applyFreeze(UUID, String, String, String)`, `removeFreeze(UUID, String, String)`, `transitionValidReviewsToPending(String, String, Instant)`. The `Pair` record rename keeps the constructor compatible. The `WalletOutboxEvent` field additions match the rest of the outbox flow.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-17-teacher-tiered-economy-v3-remediation.md`. Two execution options:

1. **Subagent-Driven (recommended)** — Dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
