# Task 6 — R-6 + R-7 CollusionEventConsumer rethrows and validates buyerId

## Where this fits

Task 6 of 10. Plan: `/home/cuongnh/Projects/Seika/docs/superpowers/plans/2026-07-17-teacher-tiered-economy-v3-remediation.md`. Tasks 1-5 are complete.

## Goal

Replace `catch (Exception e) { log.error(...) }` in `CollusionEventConsumer` with `AmqpRejectAndDontRequeueException` for poison messages, and validate `buyerId` is non-blank before treating a `MALICIOUS` event. Currently a malformed payload silently disappears (ack to broker), and a missing `buyerId` on `MALICIOUS` NPEs silently — only the teacher gets frozen.

## Read these files first

- `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/main/java/com/cardy/walletService/consumer/CollusionEventConsumer.java` — the whole file is ~62 lines.
- `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/main/java/com/cardy/walletService/event/CollusionFlaggedEvent.java` — getters (`getBuyerId`, `getTeacherId`, `getStatus`, `getFlagId`, `getReason`, `getHoldDays`).
- `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/main/java/com/cardy/walletService/config/RabbitMQConfig.java` — `COLLUSION_FLAGS_QUEUE` constant (Task 5 already added `x-dead-letter-exchange` argument to it).
- `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/test/java/com/cardy/walletService/consumer/CollusionEventConsumerTest.java` — existing test style and what cases it covers.

## What R-6 + R-7 are

**R-6:** Consumer catches every exception and only logs. Broker ack's the message. A poison payload is lost forever, and a transient DB failure leaves the system in a corrupted half-state (teacher frozen, buyer not).

**R-7:** If `MALICIOUS` arrives without `buyerId`, `UUID.fromString(null)` throws, the catch swallows it, teacher frozen alone.

## What the fix must do

### A. Restructure CollusionEventConsumer.handleCollusionFlaggedEvent

The new structure:
1. Try to parse JSON. If JsonProcessingException → throw `AmqpRejectAndDontRequeueException("malformed payload", jpe)`. The broker routes this to the configured DLX (Task 5 wired this).
2. For `CONFIRMED` events: validate teacherId is non-blank; otherwise rethrow `AmqpRejectAndDontRequeueException`. Otherwise parse and apply.
3. For `MALICIOUS` events: validate teacherId AND buyerId are non-blank; otherwise rethrow `AmqpRejectAndDontRequeueException`. Otherwise parse both UUIDs and call `walletService.applyFreeze` for each.
4. No outer `catch (Exception)` — let Spring AMQP handle Ack/Reject/Nack based on the thrown exception.

Wrap the method with `@Transactional` to make both `applyFreeze` calls atomic across the local DB.

### B. RabbitMQConfig: confirm DLX is wired to COLLUSION_FLAGS_QUEUE

Task 5 already added `x-dead-letter-exchange = WALLET_EVENTS_DLX` to the `COLLUSION_FLAGS_QUEUE` bean. If you find it missing in your working tree (e.g. you skipped Task 5), add it now.

If a separate `COLLUSION_FLAGS_DLQ` queue is needed (rather than sharing `WALLET_EVENTS_DLQ`), add it. Match the existing style — Task 5 created `WALLET_EVENTS_DLQ`, so the default should be: route both rabbit-side dead-letter and consumer-side poison to the same DLQ.

### C. Tests

Append to `CollusionEventConsumerTest.java`:

1. `handleCollusionFlaggedMaliciousWithoutBuyerIdRethrows` — payload has teacherId but no buyerId; assert `IllegalArgumentException` (or `AmqpRejectAndDontRequeueException`) is thrown; verify `walletService.applyFreeze` was NEVER called.
2. `handleCollusionFlaggedWithPoisonPayloadRethrows` — send body `"{not json"`; assert `JsonProcessingException` (wrapped or thrown as `AmqpRejectAndDontRequeueException`); verify nothing called on `walletService` or `walletHoldService`.

If existing test style is "directly call the listener method with a `Message` object", follow it. Match the test dependencies from the existing tests in the file.

## TDD / verify

```bash
# red: tests fail before fix
./src/services/wallet-service/mvnw -pl src/services/wallet-service -am test \
  -Dtest=CollusionEventConsumerTest

# green: after fix
./src/services/wallet-service/mvnw -pl src/services/wallet-service -am test \
  -Dtest=CollusionEventConsumerTest
# Expected: existing + new tests pass

# compile sanity
./src/services/wallet-service/mvnw -pl src/services/wallet-service -am compile -q -DskipTests
```

## DO NOT COMMIT

Leave changes un-staged on disk.

## Cross-task awareness

The wallet-service wallet-side outbox hardening (Task 5) and this consumer change are independent — Task 5 wired DLX infrastructure; this task uses it.

## Required output

Write full report to `/home/cuongnh/Projects/Seika/.superpowers/sdd/reports/task-6-report.md`:
- Status: DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED
- Files modified / created (absolute paths)
- Test commands + exact result lines
- Decisions on DLQ routing (shared DLQ vs separate)
- Reply with: status, one-line test summary, concerns.