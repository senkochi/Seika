# Task 5 — R-4 + R-5 Wallet outbox hardening

## Status

DONE_WITH_CONCERNS

## Summary

Hardened `WalletOutboxProcessor` so that:
- Two scheduler ticks / replicas cannot pick the same PENDING row (R-4) — `FOR UPDATE SKIP LOCKED` claim query inside a single transaction.
- Poison events cannot republish forever, and broker-accept-without-route is no longer silently marked SENT (R-5) — max-attempts ceiling, exponential backoff, DLX/DLQ on exhaustion, publisher-confirm-type/publisher-returns enabled.

## Files modified / created

Modified:
- `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/main/java/com/cardy/walletService/processor/WalletOutboxProcessor.java`
- `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/main/java/com/cardy/walletService/domain/WalletOutboxEvent.java`
- `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/main/java/com/cardy/walletService/enums/WalletOutboxStatus.java`
- `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/main/java/com/cardy/walletService/repository/WalletOutboxEventRepository.java`
- `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/main/java/com/cardy/walletService/config/RabbitMQConfig.java`
- `/home/cuongnh/Projects/Seika/src/config-service/src/main/resources/configs/wallet-service.yaml`
- `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/test/java/com/cardy/walletService/processor/WalletOutboxProcessorTest.java`

Created: (none)

## What changed

### Entity (`WalletOutboxEvent`)
Added three columns + matching Java fields (with index on `status, next_attempt_at`):
- `claimedAt` (Instant) — set when a worker claims the row.
- `nextAttemptAt` (Instant) — earliest time the row should be retried.
- `attemptCount` (int, default 0) — number of publish attempts so far.

Kept the legacy `retryCount` field to preserve storage compatibility, but the new processor now drives everything off `attemptCount`.

### Enum (`WalletOutboxStatus`)
Added two new states: `CLAIMED` (row is locked by a worker) and `DEAD` (max attempts exceeded, parked in DLQ).

### Repository (`WalletOutboxEventRepository`)
Added `claimNextPendingBatch(int batchSize, Instant now)`:
```sql
SELECT * FROM wallet_outbox_events
WHERE status = 'PENDING'
  AND (next_attempt_at IS NULL OR next_attempt_at <= :now)
ORDER BY created_at ASC
LIMIT :batchSize
FOR UPDATE SKIP LOCKED
```
The repository Javadoc documents that callers must be inside a transaction so the row locks are held until the row is finalised.

### Processor (`WalletOutboxProcessor`)
- New constructor injects `maxAttempts`, `backoffSeconds`, `batchSize` from properties (defaults 8 / 30s / 50).
- New scheduled entry point `scheduledTick()` wraps `publishOutboxEvents(Instant)` in a try/catch so a tick failure never kills the scheduler.
- `publishOutboxEvents(Instant now)` is `@Transactional`. It claims a batch, sets `CLAIMED` + `claimedAt`, publishes to `WALLET_EVENTS_EXCHANGE`, then marks `SENT` on success. On failure: bumps `attemptCount`, sets `nextAttemptAt = now + (backoffSeconds * 2^min(attempt, 6))` and reverts to `PENDING`. If `attemptCount >= maxAttempts`, flips to `DEAD` and routes the payload to `WALLET_EVENTS_DLX`. Uses the injected `now` for `nextAttemptAt`/`claimedAt`/`publishedAt` to make the operation deterministic for tests.
- Removed the `findTop50ByStatusInOrderByCreatedAtAsc` claim path (the legacy method is left in the repository for now but no longer used by the processor — see "Concerns").

### RabbitMQ config
- Added `WALLET_EVENTS_DLX = "wallet.events.dlx"` (DirectExchange) and `WALLET_EVENTS_DLQ = "wallet.events.dlq"` (durable queue, binding with routing key "").
- The `COLLUSION_FLAGS_QUEUE` was updated to set `x-dead-letter-exchange = wallet.events.dlx` so consumer-side poison messages (Task 6) flow to the same DLQ. The `CollusionEventConsumer` itself was NOT touched — that's Task 6's responsibility.
- Javadoc on the DLX constants points to Task 6 and explains the intended usage.

### Application config (`wallet-service.yaml` in config server)
Added under `spring.rabbitmq`:
- `publisher-confirm-type: correlated`
- `publisher-returns: true`

The wallet-service's own `application.yaml` does not declare these, so no duplicate keys.

## Decisions

- **Used `FOR UPDATE SKIP LOCKED` (per plan) rather than `@Version`**: searched the project for both — neither is used anywhere in the codebase. Brief said: "If the project uses an `@Version` optimistic-locking pattern instead of `FOR UPDATE SKIP LOCKED`, use that. … Consistency with the codebase wins over the plan's literal suggestion." Since no pattern existed, the plan's literal suggestion (FOR UPDATE SKIP LOCKED) was applied.
- **No Flyway migration added**: searched the entire repo for `*.sql` and Flyway/Liquibase references — none exist. The project uses Hibernate `ddl-auto: update`, so the new columns are added on next boot. A migration script was therefore not created. If the project later adopts Flyway, this is the first place that needs a V17__...sql (or similar).
- **Did not pre-emptively touch `CollusionEventConsumer`**: per the brief, that's Task 6's job. The DLX is wired and the `COLLUSION_FLAGS_QUEUE` already points at it, so Task 6 only needs to replace the `catch (Exception e) { log.error(...) }` block.
- **Constructor injection via `@Value`**: keeps the existing `@RequiredArgsConstructor` style compatible (the processor is no longer a Lombok-constructed bean; the scheduler annotations and component scanning still wire it correctly).
- **Test takes a `now` argument**: original method signature was `publishOutboxEvents()` with no argument. I added a parameter so backoff is deterministic in tests. The scheduled entry point still uses `Instant.now()`.
- **Backoff shift clamped to 6**: matches the plan's `min(next, 6)`. With the default 30s base, this caps the retry interval at ~32 minutes. `max-attempts=8` is also the plan's default.

## Test commands + exact result lines

```bash
./src/services/wallet-service/mvnw -pl src/services/wallet-service -am test -Dtest=WalletOutboxProcessorTest -DfailIfNoTests=false
```
Result:
```
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

```bash
./src/services/wallet-service/mvnw -pl src/services/wallet-service -am test -Dtest=WalletServiceFreezeTest,WalletCommandOutboxServiceTest,WalletOutboxProcessorTest,AdminRevenueServiceTest,CollusionEventConsumerTest -DfailIfNoTests=false
```
Result:
```
[INFO] Tests run: 12, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

```bash
./src/services/wallet-service/mvnw -pl src/services/wallet-service -am compile -q -DskipTests
```
Result: BUILD SUCCESS (silent OK).

## TDD trace

1. Wrote 5 tests in `WalletOutboxProcessorTest` first, using the new constructor signature and `claimNextPendingBatch`. Red: 5/5 errors at compile time (methods didn't exist on processor/repo, no `WALLET_EVENTS_DLX` constant, no `attemptCount` builder method).
2. Updated entity (added fields), enum (added `CLAIMED`/`DEAD`), repository (added `claimNextPendingBatch`), and processor (claim + backoff + DLX). Green: 5/5.
3. Re-stashed → re-ran tests on the **pre-change** baseline to confirm the `WalletServiceApplicationTests.contextLoads` failure was pre-existing (CONFIG_SERVER_URL not set, no config server available). It failed identically without my changes, so the failure is not caused by this task.

## Concerns

1. **Schema change relies on `ddl-auto: update`**: Hibernate's update mode will add the three columns, but it will NOT add the new index `idx_wallet_outbox_status_next_attempt` on an existing table in many configurations. On a brand-new database the index is created; on an existing one it will likely be missed. The application will still function (the new claim query just won't be index-accelerated), but operations should be aware.
2. **Full `mvn test` still has 1 unrelated failure** (`WalletServiceApplicationTests.contextLoads`). It's caused by `CONFIG_SERVER_URL` not being set in the test environment, so the config-client fails fast. This is pre-existing and out of scope for this task.
3. **`findTop50ByStatusInOrderByCreatedAtAsc` is now dead code** in the processor but still present in the repository. Removing it is a low-risk follow-up but was not in this task's scope.
4. **No `@Version` field added** to `WalletOutboxEvent`. Two concurrent updates outside the FOR-UPDATE-SKIP-LOCKED path (e.g. manual DB edits, or a future path that doesn't go through the claim query) could still race. If the project wants belt-and-suspenders, add `@Version` in a follow-up.
5. **`COLLUSION_FLAGS_QUEUE` now has `x-dead-letter-exchange` set, but `CollusionEventConsumer` still swallows all exceptions**, so messages there will be requeued forever (broker default for nack with requeue=true) until a poison event triggers a channel close. Task 6 owns the consumer fix that turns requeue off.
