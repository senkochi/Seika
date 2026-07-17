# Task 9 — R-12 Collapse 3 near-duplicate outbox enqueues

## Status: DONE_WITH_CONCERNS

## Files modified

- `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/main/java/com/cardy/walletService/service/WalletCommandOutboxService.java`
  - Renamed private helper `saveOutbox(...)` to `enqueueOutboxResult(...)` (matching the brief's proposed helper name) and added a Javadoc explaining the contract.
  - The three private methods (`enqueueDebitResult`, `enqueueCreditResult`, `enqueueRefundResult`) now end with a call to the shared helper instead of `saveOutbox`. The body of each of these three methods still builds its own typed payload (WalletDebitEvent vs WalletEscrowResultEvent), because the payload builders are *not* near-duplicates — they populate different fields — so only the save logic was actually duplicated.
  - No test file was touched.

## Test commands + exact result lines

Clean compile + targeted test run:

```
./src/services/wallet-service/mvnw -pl src/services/wallet-service -am clean test -Dtest=WalletCommandOutboxServiceTest
```

Relevant output:

```
[INFO] Compiling 66 source files with javac [debug parameters release 21] to target/classes
...
[INFO] Running com.cardy.walletService.service.WalletCommandOutboxServiceTest
...
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.020 s -- in com.cardy.walletService.service.WalletCommandOutboxServiceTest
[INFO] Results:
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

Compile-only sanity check:

```
./src/services/wallet-service/mvnw -pl src/services/wallet-service -am compile -q -DskipTests
```

Result: `BUILD SUCCESS` (silent under `-q`).

## Decisions on field preservation

Brief asked for a helper signature `enqueueOutboxResult(aggregateType, aggregateId, routingKey, Object payload, String reason)`. That exact signature does not work because **`WalletOutboxEvent` does not have a `reason` column** — the field is `attemptCount`/`retryCount` and friends, but never `reason`. The `reason` is part of the inner payload (`WalletDebitEvent.reason` / `WalletEscrowResultEvent.reason`) and the existing code already sets it inside each typed payload builder before calling the save helper. I therefore:

- Kept the `reason` parameter out of `enqueueOutboxResult`. It remains set inside each typed payload by the caller.
- Preserved every property the original `saveOutbox` set: `aggregateType`, `aggregateId` (with the existing `aggregateId == null ? "UNKNOWN" : aggregateId` fallback), `eventType`, JSON-serialised `payload`, `status = PENDING`. The existing `WalletOutboxEvent` defaults on `retryCount` and `attemptCount` (`@Builder.Default int = 0`) flow through unchanged.
- Preserved every property set by each of the three callers: `eventId = UUID.randomUUID().toString()`, `eventType`, `idempotencyKey` (debit uses `debitIdempotencyKey(...)`; credit/refund use the request event's own `idempotencyKey`), `orderId`, `orderItemId`, `buyerUserId`/`sellerUserId`, `totalAmount` / `teacherWithdrawableAmount` / `teacherPromoAmount` / `platformFeeReal` / `platformFeePromoSink` / `bonusAmount` / `rewardAmount` / `paidAmount` / `earnedPromoAmount`, `sourceBreakdown`, `ledgerEntryIds`, `escrowId`, `occurredAt = Instant.now()`, `reason`. Nothing was dropped.
- Preserved the original exception translation: `JsonProcessingException` is still wrapped in `IllegalStateException("Failed to serialize wallet outbox payload", exception)`.

No field required parameterisation in the helper itself — every caller already passed the correct aggregate identity into the helper via its existing method-local variables (`requestEvent.getOrderId()` for debit, `requestEvent.getEscrowId()` for credit/refund). The aggregate types ("Order", "EscrowTransaction") are still passed in by each caller.

## Concerns / Notes

1. **Brief vs. reality mismatch.** The brief described the three methods as ~80% identical, but in the current source each one constructs a *different* payload type with different fields (one `WalletDebitEvent`, two `WalletEscrowResultEvent` with different field sets). The truly duplicated logic is only the `saveOutbox` portion, which is what I collapsed. If the intent of R-12 was also to unify the payload builders (e.g. into a single sealed payload hierarchy), that is a much larger refactor than a behavior-preserving one and would change the wire-format of the outbox `payload` JSON, breaking the existing tests and any consumers. I treated that as out of scope and reported it instead of doing it.

2. **Brief's `.reason(reason)` line was wrong.** The brief's proposed helper includes `.reason(reason)` on `WalletOutboxEvent.builder()`, but that entity has no `reason` field — that line would not compile. The Javadoc on the new helper documents where `reason` actually lives (inside the typed payload). This is the one adaptation from the brief's verbatim helper signature.

3. **Why the three public one-liner rewrites in the brief don't apply.** The brief's section B shows three public methods (`enqueueDebitResult(String paymentId, WalletDebitResultPayload payload, String reason)` etc.) being collapsed to one-liners. The actual existing public surface does **not** expose any of these `enqueueDebitResult`/`enqueueCreditResult`/`enqueueRefundResult` methods — they are private helpers called from `processDebitRequested` / `processCreditRequested` / `processRefundRequested` / `enqueueDebitFailed` / `enqueueCreditFailed` / `enqueueRefundFailed`. The signatures also differ from what the brief assumes (private helpers take a request event + an eventType string, not separate `aggregateType`/`aggregateId` strings). I matched what the code actually does rather than rewriting the public surface, because doing the latter would change the call sites in the same file and would not be a behaviour-preserving refactor.

4. **Changes are un-staged on disk** as required.