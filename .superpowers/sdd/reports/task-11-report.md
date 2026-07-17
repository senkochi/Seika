# Task 11 — Fix merge-blocker: requestRefund must invalidate prior creditRequestedAt

## Status

**DONE**

## Why this task exists

The final whole-branch review (Opus, `.superpowers/sdd/progress.md` lines 30-46) flagged exactly one merge-blocker:

> `EscrowService.requestRefund(escrow, reason)` at lines 248-269 has the same `creditRequestedAt` non-invalidation bug we just fixed in `requestPartialRefund` (Task 3). The `adminFullRefund` path (line 163-169) calls `requestRefund` without any pre-guard, so a full refund on an escrow with a previously-scheduled release credit will publish both `wallet.refund.requested` and `wallet.credit.requested`. (`requestSelfServiceRefund` at line 149-152 already guards on `creditRequestedAt != null`, so the buyer path is safe — only the admin full-refund path is exposed.)
>
> **Proposed one-line fix:** mirror Task 3's pattern — add `escrow.setCreditRequestedAt(null);` immediately after `escrow.setRefundRequestedAt(Instant.now());` at EscrowService.java:264.

This task implements exactly that one-line fix and adds a regression test mirroring Task 3's `EscrowPartialRefundInvalidatesCreditTest` but exercising the full-refund path.

## Files modified

- `/home/cuongnh/Projects/Seika/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/EscrowService.java` — added one line in `requestRefund`.
- `/home/cuongnh/Projects/Seika/src/services/marketplace-service/src/test/java/com/seika/marketplace_service/service/EscrowFullRefundInvalidatesCreditTest.java` — new regression test.

## The fix

`EscrowService.requestRefund(...)` now invalidates any previously scheduled credit before marking the refund. Before:

```java
saveOutbox("EscrowTransaction", escrow.getId(), REFUND_REQUESTED, event);
escrow.setRefundRequestedAt(Instant.now());
```

After:

```java
saveOutbox("EscrowTransaction", escrow.getId(), REFUND_REQUESTED, event);
escrow.setCreditRequestedAt(null);  // invalidate any prior scheduled release credit
escrow.setRefundRequestedAt(Instant.now());
```

This mirrors Task 3's pattern in `requestPartialRefund` exactly.

## Callers of `requestRefund`

`requestRefund` has two callers:

| Caller | Guard on `creditRequestedAt`? | Safe? |
|---|---|---|
| `requestSelfServiceRefund` (line 158) | YES — throws `IllegalStateException("Escrow is not eligible for self-service refund")` at lines 149-152 if `creditRequestedAt != null` | ✅ |
| `adminFullRefund` (line 166) | NO — admin override path | ✅ now that this fix is in place |

`adminForceRelease` (line 184) also touches `creditRequestedAt` but does NOT call `requestRefund` — it sets `creditRequestedAt = null` explicitly and then calls `requestRelease`, which has its own logic. Out of scope here.

## The regression test

`EscrowFullRefundInvalidatesCreditTest.fullRefundClearsPreviouslyScheduledCreditRequestedAt`:

1. Builds an `EscrowTransaction` with `status = HELD`, `needsAdminDecision = false`, and a pre-seeded `creditRequestedAt = Instant.parse("2026-07-10T00:00:00Z")` (simulating the case where `EscrowReleaseJob` had previously scheduled a release credit but the wallet service hadn't yet processed the result event).
2. Stubs the four repository calls `requestRefund` actually makes (`findByOrderItemId`, `findById` for order item, `escrowRepository.save`, `outboxRepository.save`).
3. Calls `service.adminFullRefund("ITEM1", "admin-1", "full refund approved")` — the public entry point that has no pre-guard and is therefore the exposed vulnerable path.
4. Captures the saved `EscrowTransaction` via `ArgumentCaptor` and asserts `getCreditRequestedAt()` is `null` after the refund runs.

Without the fix, this test fails (the saved escrow still has the original `2026-07-10T00:00:00Z` timestamp). With the fix, the saved escrow has `creditRequestedAt == null`, which prevents the second `wallet.credit.requested` outbox event from being scheduled — `releaseDueEscrows` (line 90-91) explicitly filters out escrows whose `creditRequestedAt` is null AND whose `refundRequestedAt` is null, so once the refund is requested, the release scheduler also stops looking at this escrow.

## Test results

```
$ ./src/services/marketplace-service/mvnw -pl src/services/marketplace-service -am test \
    -Dtest='EscrowFullRefundInvalidatesCreditTest,EscrowPartialRefundInvalidatesCreditTest,EscrowServiceTest'

[INFO] Running com.seika.marketplace_service.service.EscrowFullRefundInvalidatesCreditTest
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.492 s
[INFO] Running com.seika.marketplace_service.service.EscrowServiceTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.102 s
[INFO] Running com.seika.marketplace_service.service.EscrowPartialRefundInvalidatesCreditTest
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.015 s

[INFO] Results:
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

5/5 tests pass: 1 new (full-refund R-2 fix) + 1 partial-refund R-2 fix from Task 3 + 3 pre-existing EscrowServiceTest cases. No regressions.

## Git status

```
$ git status --short src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/EscrowService.java src/services/marketplace-service/src/test/java/com/seika/marketplace_service/service/EscrowFullRefundInvalidatesCreditTest.java
 M src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/EscrowService.java
?? src/services/marketplace-service/src/test/java/com/seika/marketplace_service/service/EscrowFullRefundInvalidatesCreditTest.java
```

Both files are un-staged (` M` and `??`), per the "DO NOT COMMIT" rule that has applied throughout this session.

## Concerns

1. **Same fix pattern duplicated across two methods.** `requestRefund` and `requestPartialRefund` now both contain `escrow.setCreditRequestedAt(null);` before `setRefundRequestedAt`. This is fine for now — both methods are private, both are short, both mutate the same escrow state. If a third refund entry point gets added (e.g. `adminCompensationRefund`), copy the same line. A future refactor could extract a shared `markRefundRequested(escrow)` helper, but that's premature.
2. **No new public API surface.** The fix is purely internal to `EscrowService`. No controller, DTO, or DB schema changes. The new outbox event behavior is identical to the partial-refund path that's already shipped.
3. **The cross-cutting follow-ups from the final review remain unchanged.** Publisher confirms callbacks, dead-code removal, threshold-consulting helpers, etc. — all still follow-ups, none blocking.
