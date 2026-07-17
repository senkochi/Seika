# Task 6 — R-6 + R-7 CollusionEventConsumer rethrows and validates buyerId

## Status: DONE

## Summary

Replaced the silent `catch (Exception e) { log.error(...) }` in `CollusionEventConsumer` with structured handling that throws `AmqpRejectAndDontRequeueException` for poison messages. For `MALICIOUS` events, `buyerId` is now validated as non-blank before the consumer attempts to freeze the buyer wallet, eliminating the silent NPE that previously froze only the teacher.

The listener method is now `@Transactional`, so the two `walletService.applyFreeze` calls for `MALICIOUS` are atomic across the local DB. Transient DB failures propagate to Spring AMQP and trigger broker redelivery; poison messages route to `wallet.events.dlx` (configured on `COLLUSION_FLAGS_QUEUE` by Task 5) and end up on `wallet.events.dlq` for inspection.

## Files modified / created (absolute paths)

Modified:
- `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/main/java/com/cardy/walletService/consumer/CollusionEventConsumer.java`
- `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/test/java/com/cardy/walletService/consumer/CollusionEventConsumerTest.java`

Not modified (verified Task 5 already in place):
- `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/main/java/com/cardy/walletService/config/RabbitMQConfig.java` — `collusionFlagsQueue()` already declares `x-dead-letter-exchange = WALLET_EVENTS_DLX`; `WALLET_EVENTS_DLX` / `WALLET_EVENTS_DLQ` beans exist.

## Decisions on DLQ routing

Chose to share the existing `WALLET_EVENTS_DLQ` (default per brief). No separate `COLLUSION_FLAGS_DLQ` was added. Rationale: Task 5 created a single wallet-side DLQ for both broker-side dead-letter (outbox processor max-attempts) and consumer-side poison; adding a second DLQ would split ops attention across queues without operational benefit. If cross-tenant routing is later desired (e.g. per-consumer DLQs with monitoring tags), a separate queue + binding can be added without changing consumer code.

## TDD verification

### Red (before fix)

```bash
./src/services/wallet-service/mvnw -pl src/services/wallet-service -am test -Dtest=CollusionEventConsumerTest
```

Result:
```
[ERROR] Tests run: 4, Failures: 2, Errors: 0, Skipped: 0
[ERROR] CollusionEventConsumerTest.handleCollusionFlaggedMaliciousWithoutBuyerIdRethrows:91
        Expected org.springframework.amqp.AmqpRejectAndDontRequeueException to be thrown, but nothing was thrown.
[ERROR] CollusionEventConsumerTest.handleCollusionFlaggedWithPoisonPayloadRethrows:106
        Expected org.springframework.amqp.AmqpRejectAndDontRequeueException to be thrown, but nothing was thrown.
```

The 2 existing tests passed (CONFIRMED place-hold, MALICIOUS freezes); the 2 new tests failed because the old `catch (Exception)` swallowed everything.

### Green (after fix)

```bash
./src/services/wallet-service/mvnw -pl src/services/wallet-service -am test -Dtest=CollusionEventConsumerTest
```

Result:
```
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.034 s -- in com.cardy.walletService.consumer.CollusionEventConsumerTest
[INFO] BUILD SUCCESS
```

### Compile sanity

```bash
./src/services/wallet-service/mvnw -pl src/services/wallet-service -am compile -q -DskipTests
```

Result: clean (no output, BUILD SUCCESS).

## Test summary

`CollusionEventConsumerTest: 4/4 pass (2 existing + 2 new)`

- `confirmedFlagPlacesTeacherWashHoldUsingEventHoldDays` (existing) — pass
- `maliciousFlagFreezesTeacherAndBuyerWallets` (existing) — pass
- `handleCollusionFlaggedMaliciousWithoutBuyerIdRethrows` (new) — pass
- `handleCollusionFlaggedWithPoisonPayloadRethrows` (new) — pass

## Concerns

1. `WalletServiceApplicationTests.contextLoads` errors in the full suite due to `ConfigServerConfigDataFailFastException` — Config Server / Eureka aren't available outside Docker Compose. This is **pre-existing** (not introduced by Task 6); CI runs Docker Compose so this is a developer-only outer-loop inconvenience. Not blocking.

2. The new test calls `consumer.handleCollusionFlaggedEvent(...)` directly, bypassing Spring's listener container. The test therefore verifies the listener-method contract only; it does not exercise Spring AMQP's actual `AmqpRejectAndDontRequeueException -> DLX routing` behaviour. That integration is covered by the queue `x-dead-letter-exchange` argument wired in Task 5. A `@SpringBootTest` with a Testcontainers RabbitMQ would close this gap but is out of scope for this task.

3. Unknown `status` values (e.g. `SUSPICIOUS`) are now logged and silently dropped — same observable behaviour as before. Not a Task 6 requirement, but worth flagging if downstream expects every flag to mutate state.

## Cross-task awareness

Task 5 wired the `WALLET_EVENTS_DLX` / `WALLET_EVENTS_DLQ` infrastructure and the `x-dead-letter-exchange` argument on `COLLUSION_FLAGS_QUEUE`. Task 6 uses it: any `AmqpRejectAndDontRequeueException` thrown by the listener now propagates to Spring AMQP, which NACKs the message without requeue, and the broker routes it to `wallet.events.dlx` -> `wallet.events.dlq`.
