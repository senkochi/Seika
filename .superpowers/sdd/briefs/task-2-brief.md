# Task 2 — R-1 Add lookback filter to transitionValidReviewsToPending

## Where this fits

Task 2 of 10 in the remediation of `docs/implementation/teacher-tiered-economy-v3-audit.md`. Plan: `/home/cuongnh/Projects/Seika/docs/superpowers/plans/2026-07-17-teacher-tiered-economy-v3-remediation.md`. Review: `/home/cuongnh/Projects/Seika/docs/implementation/teacher-tiered-economy-v3-audit-remediation-review.md`. Task 1 (C-1) is complete.

## Goal

Ensure `CollusionFlagService.transitionValidReviewsToPending` only demotes reviews created within the lookback window — currently it demotes all VALID reviews between the buyer and seller regardless of when they were written.

## Read these files first

- `/home/cuongnh/Projects/Seika/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/CollusionFlagService.java` lines 284-294 (`transitionValidReviewsToPending`) and around 110-152 (the call site that already passes `lookbackStart` to `detectAndFlagCollusion`).
- `/home/cuongnh/Projects/Seika/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/repository/ReviewRepository.java` — confirm existing finders and add a new derived query if needed.
- `/home/cuongnh/Projects/Seika/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/entity/Review.java` — verify field names (`getSellerId`, `getBuyerId`, `getCreatedAt`, `getStatus`).
- `/home/cuongnh/Projects/Seika/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/enums/ReviewStatus.java` — confirm `VALID` / `PENDING` exist.
- `/home/cuongnh/Projects/Seika/src/services/marketplace-service/src/test/java/com/seika/marketplace_service/service/CollusionFlagServiceTest.java` — match the test style (fully qualified names).

## What R-1 is

`transitionValidReviewsToPending(teacherId, buyerId)` (no `lookbackStart` argument today) calls `findBySellerIdAndBuyerIdAndStatus(...)` with no `createdAt` filter. It then transitions EVERY `VALID` review between the pair to `PENDING`. This means a collusion flag from today's scan can downgrade reviews from 2024.

## What the fix must do

1. Add a derived query on `ReviewRepository`:
   ```java
   List<Review> findBySellerIdAndBuyerIdAndStatusAndCreatedAtGreaterThanEqual(
       String sellerId, String buyerId, ReviewStatus status, Instant createdAt);
   ```
   (Spring Data JPA generates the SQL automatically. If the entity field is `createdAt` (snake_case column is `created_at` via JPA naming strategy), this finder should work as-is.)

2. Update `CollusionFlagService.transitionValidReviewsToPending` to:
   - Accept a new `Instant lookbackStart` parameter.
   - Use the new finder.
   - Log transitioned count with the `lookbackStart` for observability.

3. Update every caller of `transitionValidReviewsToPending` to pass `lookbackStart`. Search:
   ```bash
   grep -rn "transitionValidReviewsToPending" src/services/marketplace-service/src/
   ```
   In `scanRecentEscrowsForCollusion`, the value is already computed at line 122 (`Instant lookbackStart = now.minus(lookbackDays, ChronoUnit.DAYS);`). The inner `detectAndFlagCollusion` overload receives `lookbackStart` already (verify by reading the method at line 164); thread it through to `transitionValidReviewsToPending`.

## Required new test

Append one new method to the existing `CollusionFlagServiceTest.java` (do NOT modify any existing test):

`transitionToPendingReviewsOnlyConsidersLookbackWindow()`:
- Wire the same dependency mocks as `scheduledRiskScanCreatesSuspiousFlagFromRecentEscrows`.
- Build two reviews: one from 2025-01-01 (OUTSIDE the 7-day lookback), one from 2026-07-15 (INSIDE).
- Stub `reviewRepo.findBySellerIdAndBuyerIdAndStatusAndCreatedAtGreaterThanEqual("T1", "B1", VALID, any())` to return only the recent one.
- Call `service.transitionValidReviewsToPending("T1", "B1", Instant.parse("2026-07-09T00:00:00Z"))` (where 2026-07-09 = now - 7 days).
- Assert: `transitioned == 1`, only the recent review is saved with status `PENDING`, the old review's `save` is NEVER invoked.

Use the same Mockito style as the existing test class (fully qualified `org.mockito.Mockito.*`).

## TDD / verify

```bash
# 1. red phase: run new test before fix
./src/services/marketplace-service/mvnw -pl src/services/marketplace-service -am test \
  -Dtest='CollusionFlagServiceTest#transitionToPendingReviewsOnlyConsidersLookbackWindow'
# Expected: FAIL (current code calls findBySellerIdAndBuyerIdAndStatus which returns both reviews)

# 2. green phase: re-run after fix
./src/services/marketplace-service/mvnw -pl src/services/marketplace-service -am test \
  -Dtest=CollusionFlagServiceTest
# Expected: PASS, including the new test

# 3. confirm no collateral
./src/services/marketplace-service/mvnw -pl src/services/marketplace-service -am compile -q -DskipTests
```

## DO NOT COMMIT

User forbade any `git add`/`git commit`. Leave changes un-staged on disk.

## Cross-task awareness

The reviewer of Task 1 flagged that `markMalicious` (line 231-239) and `dismissFlag` (line 259-267) also call into review-transition logic but are NOT in Task 2's scope. If your fix surfaces a need to update those callsites (e.g. they reuse the same helper), note this in the report but do NOT modify them — they belong to a future scope.

## Required output

Write full report to `/home/cuongnh/Projects/Seika/.superpowers/sdd/reports/task-2-report.md`:
- Status: DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED
- Files modified / created (absolute paths)
- Test commands + exact result lines
- Self-review: any caller of `transitionValidReviewsToPending` that you had to update; any cross-task signal you noticed.

Reply with: status, one-line test summary, concerns.