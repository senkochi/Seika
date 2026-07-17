# Task 3 — R-2 requestPartialRefund invalidates creditRequestedAt

## Where this fits

Task 3 of 10. Plan: `/home/cuongnh/Projects/Seika/docs/superpowers/plans/2026-07-17-teacher-tiered-economy-v3-remediation.md`. Tasks 1 and 2 are complete.

## Goal

Mirror `adminForceRelease`'s `setCreditRequestedAt(null)` fix into `requestPartialRefund` so a previously-scheduled release credit doesn't double-credit alongside a partial refund.

## Read these files first

- `/home/cuongnh/Projects/Seika/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/EscrowService.java` — line 184-196 (`adminForceRelease` already does the null; line 208-245 (`requestPartialRefund` is the bug site).
- `/home/cuongnh/Projects/Seika/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/entity/EscrowTransaction.java` — confirms `creditRequestedAt` field at line 117 with `setCreditRequestedAt(Instant)` setter.
- `/home/cuongnh/Projects/Seika/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/event/WalletRefundRequestedEvent.java` — confirm event shape.
- `/home/cuongnh/Projects/Seika/src/services/marketplace-service/src/test/java/com/seika/marketplace_service/service/EscrowServiceTest.java` — match the existing test style (verify constructor, imports, Mockito style).
- `/home/cuongnh/Projects/Seika/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/controller/EscrowController.java` — find the public method that triggers `requestPartialRefund`. Likely `adminPartialRefund(String orderItemId, ...)` (confirm by reading).

## What R-2 is

`requestPartialRefund` (line 208-245) builds a `WalletRefundRequestedEvent` with the partial amount, marks the escrow `PENDING_ADMIN_DECISION`, sets `refundRequestedAt`, but does NOT clear `creditRequestedAt`. If `EscrowReleaseJob` had previously scheduled `wallet.credit.requested` for the full amount, both events fire — the buyer gets a full release AND a partial refund.

`adminForceRelease` (line 184-196) already does `escrow.setCreditRequestedAt(null);` before calling `requestRelease(escrow)`. We need to mirror this in `requestPartialRefund`.

## What the fix must do

1. In `EscrowService.requestPartialRefund`, after the `saveOutbox(...)` call (line 238) and before `escrow.setRefundRequestedAt(Instant.now());` (line 239), insert:
   ```java
   escrow.setCreditRequestedAt(null);
   ```

2. **Do NOT modify `adminForceRelease`** — it's already correct.

## Required new test

`EscrowPartialRefundInvalidatesCreditTest.java` in `/home/cuongnh/Projects/Seika/src/services/marketplace-service/src/test/java/com/seika/marketplace_service/service/`.

The test must:
- Wire the `EscrowService` dependencies (read the constructor — pass mocks for repos, services, etc.).
- Build an `EscrowTransaction` with `creditRequestedAt = Instant.parse("2026-07-10T00:00:00Z")`.
- Trigger the public method that calls `requestPartialRefund`. **Read `EscrowController.java` first to find the public-facing entrypoint**; if no public method exists for partial refund yet, the test will need to invoke the private method via reflection (the project does not use Spring's `ReflectionTestUtils` extensively, but `java.lang.reflect.Method` is universally available — if reflection is needed, document the choice in the report).
- ArgumentCaptor the saved EscrowTransaction and assert `getCreditRequestedAt() == null`.

Match the Mockito style used in `EscrowServiceTest.java`.

## TDD / verify

```bash
# red phase
./src/services/marketplace-service/mvnw -pl src/services/marketplace-service -am test \
  -Dtest=EscrowPartialRefundInvalidatesCreditTest
# Expected: FAIL (creditRequestedAt not cleared before fix)

# green phase
./src/services/marketplace-service/mvnw -pl src/services/marketplace-service -am test \
  -Dtest=EscrowServiceTest,EscrowPartialRefundInvalidatesCreditTest
# Expected: PASS, no regression
```

## DO NOT COMMIT

Leave changes un-staged on disk.

## Cross-task awareness

Other methods on `EscrowService` may also need a similar fix — `requestRefund` (line 247-268) does the same thing for full refunds. The audit only flagged partial, but full refund likely has the same bug. **Note this in the report but do NOT fix it here** — it belongs to a future task or a quick follow-up if the reviewer agrees.

## Required output

Write full report to `/home/cuongnh/Projects/Seika/.superpowers/sdd/reports/task-3-report.md`:
- Status: DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED
- Files modified / created (absolute paths)
- Test commands + exact result lines
- Cross-task signal: whether `requestRefund` (full refund) has the same bug.
- Reply with: status, one-line test summary, concerns.