# Teacher Tiered Economy V3 - Phase 5 Implementation

**Date:** 2026-07-16

## Scope

Phase 5 closes the event reliability and cleanup items from the remediation plan:

- Wallet financial result events now use a wallet-service outbox.
- Marketplace `collusion.flagged` events now use the marketplace outbox.
- Legacy wallet endpoints are explicitly documented instead of silently remaining part of the V3 primary API surface.

## Wallet Financial Result Outbox

Wallet command handling now persists result events before asynchronous publishing:

- `wallet.debit.succeeded`
- `wallet.debit.failed`
- `wallet.credit.succeeded`
- `wallet.credit.failed`
- `wallet.refund.succeeded`
- `wallet.refund.failed`

Implemented pieces:

- `WalletOutboxEvent` stores the event payload, routing key, aggregate reference, status, retry count, publish timestamp, and last error.
- `WalletOutboxEventRepository` reads pending/failed events in creation order.
- `WalletOutboxProcessor` publishes wallet result events to `wallet.events` and marks each event as `SENT` or `FAILED`.
- `WalletCommandOutboxService` wraps wallet mutation plus success outbox insert in one transaction.
- Failure result events are inserted in a new transaction so marketplace can still receive a negative result when wallet mutation fails.
- `WalletEventListener` no longer directly publishes financial result events through `RabbitTemplate`.

This reduces the split-brain risk where wallet balance changes commit but the result event is lost before marketplace updates escrow/order state.

## Marketplace Collusion Outbox

`CollusionFlagService` now queues `collusion.flagged` into the existing marketplace outbox when an admin confirms or marks a collusion flag as malicious.

The marketplace outbox processor now resolves exchanges by event type:

- `wallet.*` commands continue to publish to `wallet.commands`.
- Marketplace domain events such as `collusion.flagged` publish to `marketplace.events`.

This keeps existing wallet command outbox behavior intact while giving `collusion.flagged` the same retry semantics.

## Legacy Wallet Endpoint Decision

The V3 primary wallet API surface is:

- `POST /api/wallet/cash-out` for teacher cash-out.
- `POST /api/wallet/top-up` for student top-up.
- `GET /api/wallet/balance/breakdown` for wallet balance, source buckets, freeze state, and teacher-facing wallet display.
- Formal ledger/revenue endpoints for accounting and admin reporting.

The following endpoints remain compatibility endpoints and are annotated as deprecated in `WalletController`:

- `POST /api/wallet/withdraw`
- `POST /api/wallet/deposit`
- `POST /api/wallet/history`

Compatibility notes:

- `/withdraw` is the legacy generic spend endpoint and must not be used for new marketplace purchase or teacher cash-out flows.
- `/deposit` is the legacy admin deposit endpoint and must not be used to model V3 revenue, escrow release, reward, or promo sink accounting.
- `/history` remains available for older wallet history UI until a formal user ledger endpoint replaces it.

Do not remove these endpoints until all frontend and integration callers have migrated.

## Tests

Focused verification:

- `mvn -pl src/services/wallet-service "-Dtest=WalletCommandOutboxServiceTest,WalletOutboxProcessorTest,WalletServiceFreezeTest,CollusionEventConsumerTest" test`
- `mvn -pl src/services/marketplace-service "-Dtest=CollusionFlagServiceTest,OutboxProcessorTest,EscrowServiceTest,TeacherRatingServiceTest" test`

Covered behaviors:

- Wallet debit success stores a `wallet.debit.succeeded` outbox event with source breakdown and ledger IDs.
- Wallet credit failure stores a `wallet.credit.failed` outbox event with failure reason.
- Wallet outbox processor publishes to `wallet.events`, marks sent events, and retries failed events.
- Marketplace outbox processor preserves `wallet.*` routing to `wallet.commands`.
- Marketplace outbox processor routes `collusion.flagged` to `marketplace.events`.
- Malicious collusion decisions enqueue a `collusion.flagged` outbox event with configured wash hold days.
- Existing freeze/hold and escrow/rating tests still pass.
