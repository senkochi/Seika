# Task 5 — R-4 + R-5 Wallet outbox hardening

## Where this fits

Task 5 of 10. Plan: `/home/cuongnh/Projects/Seika/docs/superpowers/plans/2026-07-17-teacher-tiered-economy-v3-remediation.md`. Tasks 1-4 are complete.

## Goal

Harden `WalletOutboxProcessor` so that:
- (R-4) Two scheduler ticks / replicas cannot pick the same PENDING row and double-publish.
- (R-5) Poison events don't republish forever; broker-accept-without-route isn't silently marked SENT; the processor has a max-retry ceiling and a DLQ.

## Read these files first

- `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/main/java/com/cardy/walletService/processor/WalletOutboxProcessor.java` — the current implementation (whole file is ~55 lines).
- `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/main/java/com/cardy/walletService/domain/WalletOutboxEvent.java` — entity fields.
- `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/main/java/com/cardy/walletService/repository/WalletOutboxEventRepository.java` — existing finders.
- `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/main/java/com/cardy/walletService/enums/WalletOutboxStatus.java` — current enum values.
- `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/main/java/com/cardy/walletService/config/RabbitMQConfig.java` — confirm existing exchanges/queues/bindings.
- `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/main/resources/application.yaml` and `src/config-service/src/main/resources/configs/wallet-service.yaml` — confirm publisher-confirm-type / publisher-returns settings (may already be configured).
- `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/test/java/com/cardy/walletService/processor/WalletOutboxProcessorTest.java` — existing test style.

## What R-4 + R-5 are

**R-4:** Current `publishOutboxEvents()` selects the top 50 PENDING/FAILED rows and publishes them. If two replicas tick simultaneously, both pick the same rows, both publish to RabbitMQ, both save SENT — duplicate side effects.

**R-5:** Current `catch (Exception e)` flips status to FAILED, increments retryCount, and on the next tick the same row is retried forever. No publisher-confirm means a `convertAndSend` that the broker silently drops (route missing) is marked SENT. No DLQ means poison events clog the queue.

## What the fix must do

### A. Schema changes (WalletOutboxEvent + migration)

Add three fields:
- `claimedAt` (Instant) — when this row was claimed by a worker
- `nextAttemptAt` (Instant) — earliest time the row should be retried
- `attemptCount` (int, default 0) — number of attempts so far

Also extend `WalletOutboxStatus` enum with `CLAIMED` and `DEAD`.

Add a Flyway (or equivalent) migration in `src/services/wallet-service/src/main/resources/db/migration/`:
```sql
ALTER TABLE wallet_outbox_event
    ADD COLUMN claimed_at TIMESTAMP,
    ADD COLUMN next_attempt_at TIMESTAMP,
    ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 0;
```

Adjust to the actual table/column name in the existing migration history. **Read the existing migrations first** to find the next migration number (e.g. `V17__...sql` or whatever fits the project's convention).

### B. Repository claim query

Add to `WalletOutboxEventRepository`:
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

If the project uses an `@Version` optimistic-locking pattern instead of `FOR UPDATE SKIP LOCKED`, use that. Read existing outbox/event repositories for the pattern. **Consistency with the codebase wins over the plan's literal suggestion.**

### C. Processor rewrite

Rewrite `WalletOutboxProcessor.publishOutboxEvents`:

```java
@Scheduled(fixedDelayString = "${wallet.outbox.processor.delay-ms:3000}")
public void publishOutboxEvents() {
    int maxAttempts = configInt("wallet.outbox.max-attempts", 8);
    Duration backoff = Duration.ofSeconds(30);

    List<WalletOutboxEvent> claimed = walletOutboxEventRepository
            .claimNextPendingBatch(50, Instant.now());
    if (claimed.isEmpty()) return;

    for (WalletOutboxEvent event : claimed) {
        try {
            event.setStatus(WalletOutboxStatus.CLAIMED);
            event.setClaimedAt(Instant.now());
            walletOutboxEventRepository.save(event);

            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.WALLET_EVENTS_EXCHANGE,
                    event.getEventType(),
                    event.getPayload());

            event.setStatus(WalletOutboxStatus.SENT);
            event.setPublishedAt(Instant.now());
            event.setLastError(null);
        } catch (Exception exception) {
            int next = event.getAttemptCount() + 1;
            event.setAttemptCount(next);
            event.setLastError(truncateError(exception.getMessage()));
            if (next >= maxAttempts) {
                event.setStatus(WalletOutboxStatus.DEAD);
                rabbitTemplate.convertAndSend(
                        RabbitMQConfig.WALLET_EVENTS_DLX,
                        event.getEventType(),
                        event.getPayload());
                log.error("Outbox event id={} exhausted retries ({}); routed to DLQ", event.getId(), next, exception);
            } else {
                event.setStatus(WalletOutboxStatus.PENDING);
                event.setNextAttemptAt(Instant.now().plus(backoff.multipliedBy(1L << Math.min(next, 6))));
                log.warn("Outbox event id={} failed attempt={}, retry at {}", event.getId(), next, event.getNextAttemptAt(), exception);
            }
        }
        walletOutboxEventRepository.save(event);
    }
}

private int configInt(String key, int fallback) { ... }
```

### D. RabbitMQConfig additions

Add to `RabbitMQConfig`:
- A new direct exchange `WALLET_EVENTS_DLX` (constant + `@Bean DirectExchange`).
- A new durable queue `WALLET_EVENTS_DLQ` (constant + `@Bean Queue`).
- A binding from DLQ to DLX.
- Update existing wallet-events-related queues with `x-dead-letter-exchange = WALLET_EVENTS_DLX` argument.

Check what `WALLET_EVENTS_DLX` and `WALLET_EVENTS_DLQ` constants exist (or should be added) — the brief in the plan calls for `wallet.events.dlx` and `wallet.events.dlq` but match the existing constant naming style.

### E. Application.yaml

Verify and add (if missing) to BOTH `src/services/wallet-service/src/main/resources/application.yaml` AND `src/config-service/src/main/resources/configs/wallet-service.yaml`:
```yaml
spring:
  rabbitmq:
    publisher-confirm-type: correlated
    publisher-returns: true
```

If both files already have these settings, skip — don't introduce duplicate keys. **Check first.**

### F. New tests

Append to `WalletOutboxProcessorTest.java`:
1. `processorClaimsRowsBeforePublishingAndRetriesFailuresWithBackoff` — the test described in the plan.
2. `processorRoutesDeadLetterOnMaxAttemptsExceeded` — set `attemptCount` to a value that, after one more failure, exceeds `maxAttempts`; assert status flips to `DEAD` and `convertAndSend` is called against `WALLET_EVENTS_DLX`.
3. (optional) `processorKeepsRowPendingWithBackoffOnTransientFailure` — assert `nextAttemptAt` is set when attempt is below max.

## TDD / verify

```bash
# red: tests fail before implementation
./src/services/wallet-service/mvnw -pl src/services/wallet-service -am test -Dtest=WalletOutboxProcessorTest

# green: after implementation
./src/services/wallet-service/mvnw -pl src/services/wallet-service -am test -Dtest=WalletOutboxProcessorTest
# Expected: all new tests pass

# compile sanity
./src/services/wallet-service/mvnw -pl src/services/wallet-service -am compile -q -DskipTests

# broader wallet-service tests
./src/services/wallet-service/mvnw -pl src/services/wallet-service -am test \
  -Dtest=WalletServiceFreezeTest,WalletCommandOutboxServiceTest,WalletOutboxProcessorTest,AdminRevenueServiceTest,CollusionEventConsumerTest
```

## DO NOT COMMIT

Leave changes un-staged on disk.

## Cross-task awareness

This task overlaps with Task 6 (R-6/R-7 — `CollusionEventConsumer` rethrows on poison). Task 6 will:
- Bind the COLLUSION_FLAGS_QUEUE to the new DLX.
- Replace `catch (Exception e) { log.error(...) }` with `AmqpRejectAndDontRequeueException`.

Don't pre-emptively touch the consumer in this task — Task 6 owns that.

## Required output

Write full report to `/home/cuongnh/Projects/Seika/.superpowers/sdd/reports/task-5-report.md`:
- Status: DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED
- Files modified / created (absolute paths)
- Test commands + exact result lines
- Decisions made (e.g. "used `@Version` instead of `FOR UPDATE SKIP LOCKED` because…")
- Reply with: status, one-line test summary, concerns.