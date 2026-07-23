# ADR-001: Project public usernames into Marketplace and Wallet

## Status

Accepted

## Date

2026-07-23

## Context

Marketplace products own `sellerUserId` for authorization and financial workflows,
but student and moderation interfaces need a recognizable username. Identity Service
is the source of truth for usernames. Profile Service only owns profile fields such
as `fullName`. Wallet's admin transaction history also needs a recognizable username,
while ledger records must keep immutable user IDs for financial traceability.

Calling Profile or Identity synchronously while consuming content events would couple
product creation to another service's availability. Adding usernames to Flashcard and
Quiz events would duplicate identity ownership in services that do not own usernames.

## Decision

Marketplace keeps a local `seller_identity_projection` keyed by `userId`, and Wallet
stores the projected username on the user wallet.

- New users arrive through the existing `identity.events/user.registered` event.
- Identity publishes paginated `user.public-identity.snapshot` events for every user,
  both automatically and through the ADMIN endpoint.
- Product creation reads the local Marketplace projection only.
- Identity events update both the projection and existing products for the seller.
- Wallet consumes the same identity events and exposes `username` alongside the
  immutable `userId` in admin transaction responses.
- `teacherDisplayName` remains wire-compatible but contains a username or `null`; it
  must never contain a UUID fallback.

## Alternatives considered

- **Public Profile endpoint:** rejected because Profile does not own usernames and its
  current teacher response contains unrelated personal fields.
- **Synchronous service call from the content consumer:** rejected because transient
  failures could permanently persist UUIDs and delay RabbitMQ processing.
- **Username in Flashcard/Quiz events:** rejected because it duplicates Identity data
  and expands two unrelated event contracts.

## Consequences

- Username display is eventually consistent across Identity, Marketplace, and Wallet.
- Identity runs reconciliation 30 seconds after startup and every 24 hours by default;
  the interval and batch size are configurable.
- A content event may create a product before the identity event arrives; the later
  identity event repairs it automatically.
- Marketplace's projection table and Wallet's nullable `username` column are created
  by the repository's current `ddl-auto=update` workflow and remain
  deployment-sensitive.
