# Task 1 — C-1 Collusion reciprocal-ratio fix

## Where this fits

This is Task 1 of 10 in the remediation of `docs/implementation/teacher-tiered-economy-v3-audit.md`. The plan file is `/home/cuongnh/Projects/Seika/docs/superpowers/plans/2026-07-17-teacher-tiered-economy-v3-remediation.md`. C-1 was identified as the only Critical (blocks-merge) finding in the parallel-reviewer report at `/home/cuongnh/Projects/Seika/docs/implementation/teacher-tiered-economy-v3-audit-remediation-review.md`.

## Goal

Fix the reciprocity-ratio dead code in `CollusionFlagService.scanRecentEscrowsForCollusion` so that bilateral wash-trade patterns actually contribute to the risk score.

## Files (read these first)

- `/home/cuongnh/Projects/Seika/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/CollusionFlagService.java` — lines 110-152 (the scan loop) and line 393 (the `Pair` record).
- `/home/cuongnh/Projects/Seika/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/repository/CollusionFlagRepository.java` — to confirm `save` signature.
- `/home/cuongnh/Projects/Seika/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/entity/EscrowTransaction.java` — getter names `getSellerId`, `getBuyerId`, `getGrossAmount`, `getPromoBackedAmount`, `getCreatedAt`.
- `/home/cuongnh/Projects/Seika/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/enums/CollusionFlagStatus.java` — keep using existing `SUSPICIOUS`.
- `/home/cuongnh/Projects/Seika/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/MarketplaceConfigService.java` — confirm config keys exist; add new key `KEY_COLLUSION_RECIPROCAL_RATIO_THRESHOLD` and `KEY_COLLUSION_RECIPROCAL_RATIO_POINTS` only if they do NOT exist (verify first — do not add duplicate keys).
- `/home/cuongnh/Projects/Seika/src/services/marketplace-service/src/test/java/com/seika/marketplace_service/service/CollusionFlagServiceTest.java` — match the existing style (fully qualified names, `org.mockito.Mockito.mock(...)` rather than imports).

## What C-1 is

Inside `scanRecentEscrowsForCollusion`:
- Map keys are constructed as `new Pair(escrow.getSellerId(), escrow.getBuyerId())` (line 129).
- Map lookups at line 142 build `new Pair(pair.buyerId(), pair.teacherId())` — which is the *swapped* direction. Because the original insertion never used that direction, `getOrDefault` always returns `List.of()` and `reciprocalRatio` is always 0.
- The risk-score formula therefore never adds the +15 reciprocity points. Wash-trade detection systematically misses bilateral patterns.
- The existing test (`scheduledRiskScanCreatesSuspiciousFlagFromRecentEscrows`) only seeds a single-direction pair, so the bug is invisible to the current suite.

## What the fix must do

1. Add a canonicalizing factory `Pair.of(a, b)` that orders the two UUIDs so `(T,B)` and `(B,T)` collapse to one key.
2. Replace the line 129 and line 142 key-construction calls with `Pair.of(...)`.
3. After canonicalization, the surviving pair's `teacherId()` field is non-deterministic (whichever UUID sorts first lexicographically). Re-derive the teacher ID at the scan-call site as "the userId that appears as `sellerId` in the majority of pairEscrows", and the buyer ID as the other party. This preserves the existing risk-score attribution.
4. Adjust the reciprocRatio lookup to `byPair.getOrDefault(pair, List.of())` (now reliable after canonicalization).

## Required new test

Create `/home/cuongnh/Projects/Seika/src/services/marketplace-service/src/test/java/com/seika/marketplace_service/service/CollusionFlagServiceReciprocalRatioTest.java` containing one test method `reciprocalRatioCountsBilateralEscrows` that:
- Seeds two escrows with swapped seller/buyer (E1: T1→B1, E2: B1→T1).
- Runs `service.scanRecentEscrowsForCollusion(now)`.
- Asserts the saved `CollusionFlag.reciprocalRatio > BigDecimal("0.5")` (it should be ~1.0 after the fix; it is 0 before the fix).

Use the same Mockito + fully-qualified-name style as `CollusionFlagServiceTest.scheduledRiskScanCreatesSuspiciousFlagFromRecentEscrows`. Don't pull in additional dependencies; mock the repository interfaces.

## TDD / verify

Run the test commands from the plan:
- `./src/services/marketplace-service/mvnw -pl src/services/marketplace-service -am test -Dtest=CollusionFlagServiceReciprocalRatioTest` — must FAIL before fix, PASS after.
- After fix, also re-run `./src/services/marketplace-service/mvnw -pl src/services/marketplace-service -am test -Dtest=CollusionFlagServiceTest` to confirm no regression in the existing test.

## DO NOT COMMIT

The user explicitly forbids any `git commit` or `git add` on this session. After completing the work, leave the modified files on disk un-staged. The controller will stage them later if the user approves.

## Required output

Write your full report to `/home/cuongnh/Projects/Seika/.superpowers/sdd/reports/task-1-report.md` containing:
- Status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
- Bullet list of files modified / created with absolute paths
- Test commands run and exact output (compile + test result lines)
- Self-review: anything you noticed about other tasks (e.g. caller of `transitionValidReviewsToPending` that Task 2 needs) but did NOT fix here.
- Return in your reply ONLY: status, one-line test summary (e.g. "8 tests pass, 0 fail"), and any concerns. The full report is in the file.
