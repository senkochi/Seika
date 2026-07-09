# Teacher Tiered Economy V3 Phase 1 Implementation

## Scope

Implemented Phase 1 from `docs/ideas/teacher-tiered-economy-v3.md` for the two services that own the work:

- `wallet-service`: protected coin buckets, structured ledger, source-aware debit, cash-out guard.
- `marketplace-service`: marketplace config, escrow safety state on order items, content lifecycle guards R1/R2/R3.

No historical wallet migration was added. This follows V3 decision D10: reset databases before using the new schema.

## Wallet Changes

`Wallet` now keeps source balances:

- `bonusBalance`
- `rewardBalance`
- `paidBalance`
- `earnedWithdrawableBalance`
- `earnedPromoBalance`
- `heldBalance`
- `frozen`

`balance` remains as the legacy total and is recalculated from spendable buckets:

```txt
balance = bonus + reward + paid + earnedWithdrawable + earnedPromo
```

New structured ledger table:

```txt
wallet_ledger_entries
```

It records source, ledger type, `amountVnd`, `rateVndPerCoin`, order ids, escrow ids, counterparty, and idempotency key. Admin revenue now reads this ledger instead of parsing Vietnamese transaction descriptions with regex.

## Source Behavior

Implemented source allocation:

```txt
BONUS -> REWARD -> EARNED_PROMO -> PAID
```

`EARNED_PROMO` is included before `PAID` to preserve the V3 invariant that app-only coin cannot become withdrawable through resale.

Top-up credits `PAID`.

Initial grant credits `BONUS`.

Learning rewards credit `REWARD`.

Cash-out debits only `earnedWithdrawableBalance`.

## Wallet Debit Event

`wallet.debit.succeeded` now includes:

- `idempotencyKey`
- `buyerUserId`
- `totalAmount`
- `sourceBreakdown`
- `ledgerEntryIds`
- `occurredAt`

`sourceBreakdown` includes the V3 fields plus `earnedPromoAmount` and `promoBackedAmount` for Phase 2 escrow lineage.

## Marketplace Changes

Added `MarketplaceConfig` with default keys for escrow, tier, collusion, and wash hold settings. Admin API:

```txt
GET /api/marketplace/admin/configs
PUT /api/marketplace/admin/configs/{key}
```

Added `EscrowState` and Phase 1 escrow guard fields to `OrderItem`:

```txt
NONE | HELD | PENDING_ADMIN_DECISION | CANCELLED_BY_ADMIN | RELEASED | REFUNDED
```

When marketplace receives `wallet.debit.succeeded`, order items move from `NONE` to `HELD`.

## Content Safety Hooks

R1 edit during held:

- content update resets product to `PENDING_REVIEW`, `active=false`
- held order items become `PENDING_ADMIN_DECISION`
- order is marked `needsAdminDecision=true`

R2 admin reject/hide during held:

- product status changes as before
- held order items become `CANCELLED_BY_ADMIN`
- no automatic refund is issued

R3 hard delete guard + archive:

- hard delete checks unresolved escrow states and returns `409 Conflict` through `IllegalStateException`
- archive endpoint hides product without touching purchased inventory

Endpoint:

```txt
POST /api/marketplace/products/{productId}/archive
DELETE /api/marketplace/products/{productId}
```

## Follow-up For Phase 2

Phase 1 still publishes `content.purchased` after wallet debit success. Wallet currently treats that legacy teacher payout as `REWARD`, so it is not cash-out eligible. Phase 2 should replace this with escrow release and `wallet.credit.requested/succeeded`.
