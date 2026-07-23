# Task 3 Report — R-2 requestPartialRefund invalidates creditRequestedAt

## Status

DONE_WITH_CONCERNS

## Files modified / created

- **Created**: `/home/cuongnh/Projects/Seika/src/services/marketplace-service/src/test/java/com/seika/marketplace_service/service/EscrowPartialRefundInvalidatesCreditTest.java`
- **Modified**: `/home/cuongnh/Projects/Seika/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/EscrowService.java` (added `escrow.setCreditRequestedAt(null);` immediately after `saveOutbox(...)` inside `requestPartialRefund`, before `setRefundRequestedAt(...)`).

The fix is exactly the one-line mirror of `adminForceRelease`'s existing `setCreditRequestedAt(null)` (EscrowService.java line 191).

## Test commands and exact result lines

### Red phase (before fix)

Command:
```
./src/services/marketplace-service/mvnw -pl src/services/marketplace-service -am test -Dtest=EscrowPartialRefundInvalidatesCreditTest
```

Result (key lines):
```
[ERROR] Tests run: 1, Failures: 1, Errors: 0, Skipped: 0, Time elapsed: 1.222 s <<< FAILURE! -- in com.seika.marketplace_service.service.EscrowPartialRefundInvalidatesCreditTest
[ERROR] com.seika.marketplace_service.service.EscrowPartialRefundInvalidatesCreditTest.partialRefundClearsPreviouslyScheduledCreditRequestedAt -- Time elapsed: 1.202 s <<< FAILURE!
org.opentest4j.AssertionFailedError:

expected: null
 but was: 2026-07-10T00:00:00Z
        at com.seika.marketplace_service.service.EscrowPartialRefundInvalidatesCreditTest.partialRefundClearsPreviouslyScheduledCreditRequestedAt(EscrowPartialRefundInvalidatesCreditTest.java:67)
[INFO] BUILD FAILURE
```

### Green phase (after fix)

Command:
```
./src/services/marketplace-service/mvnw -pl src/services/marketplace-service -am test -Dtest=EscrowServiceTest,EscrowPartialRefundInvalidatesCreditTest
```

Result (key lines):
```
[INFO] Running com.seika.marketplace_service.service.EscrowServiceTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.398 s -- in com.seika.marketplace_service.service.EscrowServiceTest
[INFO] Running com.seika.marketplace_service.service.EscrowPartialRefundInvalidatesCreditTest
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.014 s -- in com.seika.marketplace_service.service.EscrowPartialRefundInvalidatesCreditTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

## Test design notes

- Test wires `EscrowService` via the same constructor pattern used in `EscrowServiceTest.adminPartialRefundProratesOriginalSourceAmounts` (matches the existing Mockito style — direct `mock(...)` instantiation, `ReflectionTestUtils.setField` for the optional `AdminActionLogService`).
- The escrow is built with `creditRequestedAt = Instant.parse("2026-07-10T00:00:00Z")` and `status = EscrowStatus.HELD` (so `findByOrderItemId` resolves and `requestPartialRefund` does not reject on the partial-amount validation).
- The test triggers the **public** entrypoint `adminPartialRefund("ITEM1", new BigDecimal("50"), "admin-1", "half refund")` — no reflection was needed because `EscrowController.adminPartialRefund` (controller line 60-66) already routes a `POST /api/marketplace/admin/order-items/{orderItemId}/partial-refund` straight to `escrowService.adminPartialRefund(...)`.
- `ArgumentCaptor<EscrowTransaction>` captures the saved entity; we assert `savedEscrow.getCreditRequestedAt()` is `null`.
- We also stub `orderItemRepository.findById(...)` so that the inner `markAdminDecision(...)` does not NPE.

## Cross-task signal: `requestRefund` (full refund) has the same bug

**Confirmed.** In `EscrowService.java` lines 248-269, the private `requestRefund(escrow, reason)` method — which is invoked by `adminFullRefund` (line 163-169) — also fails to clear `creditRequestedAt`:

```java
saveOutbox("EscrowTransaction", escrow.getId(), REFUND_REQUESTED, event);
escrow.setRefundRequestedAt(Instant.now());
escrow.setNeedsAdminDecision(false);
escrow.setReviewReason(reason);
escrow.setLastWalletError(null);
escrowRepository.save(escrow);
```

If `EscrowReleaseJob` had previously scheduled `wallet.credit.requested` for the same escrow, an admin `full refund` will fire BOTH events — the seller gets credited the full amount AND the buyer gets refunded the full amount. This is the same R-2 class of bug, just at the full-refund path.

Note: `requestSelfServiceRefund` (line 142-160) is already guarded by `if (escrow.getCreditRequestedAt() != null || ...)` and throws `IllegalStateException` before reaching `requestRefund`, so that public path is safe. The exposed path is **admin full refund only**.

**Out of scope for this task per the brief.** Recommend either:
- Follow-up Task 3.1 that mirrors the same fix into `requestRefund`, or
- Fold the fix into the upcoming wallet/outbox hardening tasks (R-4 / R-5) if those already touch `requestRefund`.

## Concerns

1. **`requestRefund` (full refund) has the same R-2 bug** — see cross-task signal above. Per the brief, this is NOT fixed here, but the reviewer should be aware.
2. The `EscrowReleaseJob.releaseDueEscrows` (line 89-96) selects only escrows where `creditRequestedAt IS NULL AND refundRequestedAt IS NULL`. After our fix, a partial refund now resets `creditRequestedAt` to null. The job would then re-pick up the same escrow on the next tick and call `requestRelease(escrow)` again — but `requestRelease` re-validates status and amount, and the order of operations here is that `requestPartialRefund` has *already saved the outbox refund event* AND marked `status = PENDING_ADMIN_DECISION`, so `requestRelease`'s early-return guard `escrow.getStatus() != HELD` will block the second credit. The two paths are mutually exclusive by status, so no double-fire exists in practice. **Worth flagging** as a follow-up worth a comment in the code or a defensive guard in `requestRelease` if the status invariant ever weakens.