# Task 9 — R-12 Collapse 3 near-duplicate outbox enqueues

## Where this fits

Task 9 of 10. Plan: `/home/cuongnh/Projects/Seika/docs/superpowers/plans/2026-07-17-teacher-tiered-economy-v3-remediation.md`. Tasks 1-8 are complete.

## Goal

Reduce duplication in `WalletCommandOutboxService` where three near-identical enqueue methods (`enqueueDebitResult`, `enqueueCreditResult`, `enqueueRefundResult`) differ only in the aggregate type, id, routing key, and payload class. Extract a private helper that does the shared work.

## Read these files first

- `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/main/java/com/cardy/walletService/service/WalletCommandOutboxService.java` — the three target methods at lines ~91-153.
- `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/test/java/com/cardy/walletService/service/WalletCommandOutboxServiceTest.java` — match the existing test style; the goal is to NOT modify these tests (they're behaviour-driven, not implementation-driven, so they should still pass after the refactor).

## What R-12 is

Each of the three methods:
1. Builds a `WalletOutboxEvent` with a payload
2. Sets the routing key, aggregate type, aggregate id, status, reason
3. Saves to `walletOutboxEventRepository`

The body is ~80% identical. Maintenance debt: every new event type means a new method that mostly copies the old one.

## What the fix must do

### A. Extract a private helper

```java
private WalletOutboxEvent enqueueOutboxResult(String aggregateType, String aggregateId,
                                               String routingKey, Object payload, String reason) {
    WalletOutboxEvent event = WalletOutboxEvent.builder()
            .aggregateType(aggregateType)
            .aggregateId(aggregateId)
            .eventType(routingKey)
            .payload(toJson(payload))
            .reason(reason)
            .status(WalletOutboxStatus.PENDING)
            .build();
    return walletOutboxEventRepository.save(event);
}
```

### B. Re-implement the three public methods as one-liners

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

Adjust to whatever the actual method signatures, payload types, and routing keys are by reading the source first.

### C. Preserve every property

The existing methods likely also set:
- `idempotencyKey`
- `attemptCount`
- correlation IDs

These should be preserved in the consolidated helper. Don't lose any field. If they differ, parameterize them — don't silently drop.

## TDD / verify

The existing `WalletCommandOutboxServiceTest` must STILL pass without modification. This is the proof that the refactor is behavior-preserving.

```bash
./src/services/wallet-service/mvnw -pl src/services/wallet-service -am test \
  -Dtest=WalletCommandOutboxServiceTest
```
Expected: PASS, no test changes needed.

```bash
./src/services/wallet-service/mvnw -pl src/services/wallet-service -am compile -q -DskipTests
```
Expected: BUILD SUCCESS.

## DO NOT COMMIT

Leave changes un-staged on disk.

## Required output

Write full report to `/home/cuongnh/Projects/Seika/.superpowers/sdd/reports/task-9-report.md`:
- Status: DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED
- Files modified (absolute paths)
- Test commands + exact result lines
- Decisions on field preservation (any field that required parameterization)
- Reply with: status, one-line test summary, concerns.