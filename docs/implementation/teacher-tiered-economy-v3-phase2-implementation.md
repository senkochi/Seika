# Teacher Tiered Economy V3 Phase 2 Implementation

## Scope

Implemented Phase 2 from `docs/ideas/teacher-tiered-economy-v3.md` across the services that own the flow:

- `marketplace-service`: escrow transactions, release/refund lifecycle, review and teacher tier source of truth, product listing rating denormalization.
- `wallet-service`: escrow release credit, refund credit, idempotent wallet command handling, and removal of direct teacher payout from `content.purchased`.
- `flashcard-service` and `quiz-service`: first-consume event publishing so marketplace can block self-service refunds after consumption.

Phase 3 risk review, wallet holds/freezes, collusion flags, and advanced tier metrics remain out of scope.

## Wallet Changes

`wallet-service` now accepts three wallet command types on `wallet.commands.queue`:

```txt
wallet.debit.requested
wallet.credit.requested
wallet.refund.requested
```

New event DTOs were added:

- `WalletCreditRequestedEvent`
- `WalletRefundRequestedEvent`
- `WalletEscrowResultEvent`

Escrow release credits seller balances using protected lineage:

- `teacherWithdrawableAmount` credits `EARNED_WITHDRAWABLE`
- `teacherPromoAmount` credits `EARNED_PROMO`
- `platformFeeReal` writes `PLATFORM_FEE_REAL` ledger rows without inflating wallet balance
- `platformFeePromoSink` writes `PLATFORM_FEE_PROMO_SINK` ledger rows without inflating wallet balance

Refund restores buyer balances to the original source buckets:

- `BONUS`
- `REWARD`
- `PAID`
- `EARNED_PROMO`

Both release and refund use `wallet_idempotency_keys`, so retrying the same `escrow:{id}:release` or `escrow:{id}:refund` command does not double-credit.

`content.purchased` is now financial no-op in wallet-service. It is still consumed for logging/compatibility, but teacher earning is handled only by escrow release.

## Marketplace Escrow Changes

Added `EscrowTransaction` with source lineage fields:

```txt
grossAmount
bonusBackedAmount
rewardBackedAmount
paidBackedAmount
earnedPromoBackedAmount
promoBackedAmount
teacherWithdrawableNet
teacherPromoNet
platformFeeReal
platformFeePromoSink
status
releaseAt
creditRequestedAt
refundRequestedAt
```

`earnedPromoBackedAmount` is an implementation addition to preserve Phase 1 lineage when `EARNED_PROMO` is spent after `BONUS -> REWARD -> PAID` are exhausted.

When marketplace receives `wallet.debit.succeeded`:

1. Order becomes `PAID`.
2. Inventory is created.
3. Order items move to `HELD`.
4. One escrow row is created per order item.
5. Order-level wallet source breakdown is allocated across items in purchase allocation order.

The escrow release job finds due `HELD` escrows where:

```txt
releaseAt <= now
needsAdminDecision = false
creditRequestedAt is null
refundRequestedAt is null
```

It computes fee/net amounts using the seller tier at release time and writes a `wallet.credit.requested` outbox command. Escrow is marked `RELEASED` only after `wallet.credit.succeeded` is received.

## Refund and Admin Override

Added self-service refund API:

```txt
POST /api/marketplace/escrows/{escrowId}/refund
```

Self-service refund is allowed only when:

- requester is the buyer
- escrow is `HELD`
- no credit/refund is already requested
- escrow does not need admin decision
- inventory is still active
- `consumedAt == null`

Refund sends `wallet.refund.requested`; after `wallet.refund.succeeded`, marketplace revokes inventory and marks the order item `REFUNDED`.

Added admin APIs:

```txt
GET  /api/marketplace/admin/orders/pending-decision
POST /api/marketplace/admin/order-items/{orderItemId}/refund
POST /api/marketplace/admin/order-items/{orderItemId}/force-release
POST /api/marketplace/admin/order-items/{orderItemId}/no-refund
```

Phase 2 includes full refund, force release, and no-refund decisions. Partial refund remains a follow-up because it needs a clearer split policy for the remaining escrow amount.

Phase 1 safety hooks now also update escrow rows:

- content edit during `HELD` -> escrow `PENDING_ADMIN_DECISION`
- admin reject/hide during `HELD` -> escrow `CANCELLED_BY_ADMIN`

## Content Consumed Events

`flashcard-service` publishes `flashcard.set.consumed` on first progress greater than zero for a user/card set.

`quiz-service` publishes `quiz.set.consumed` on the first attempt for a user/quiz set.

`marketplace-service` consumes `*.*.consumed` and updates `UserInventory.consumedAt`. This makes refund after consumption admin-only.

## Review and Teacher Tier

Added review and tier entities:

```txt
reviews
teacher_ratings
```

Added API surface:

```txt
POST /api/marketplace/reviews
GET  /api/marketplace/products/{productId}/reviews
GET  /api/marketplace/teachers/{teacherId}/rating
```

Review rules:

- buyer must have active verified inventory
- one review per `(buyerId, productId)`
- Phase 2 review status defaults to `VALID`
- risk statuses remain for Phase 3 integration

`marketplace-service` is now the source of truth for `TeacherRating`.

Phase 2 tier uses only:

- `averageRating`
- `validReviewCount`

Default tier fees:

| Tier     |                          Rule | Fee |
| -------- | ----------------------------: | --: |
| `NEWBIE` |                      fallback | 20% |
| `BRONZE` |   >= 5 reviews, rating >= 3.0 | 15% |
| `SILVER` |  >= 20 reviews, rating >= 3.5 | 10% |
| `GOLD`   | >= 100 reviews, rating >= 4.0 |  5% |
| `ELITE`  | >= 500 reviews, rating >= 4.5 |  3% |

When tier changes, marketplace publishes `teacher.tier.updated` to `marketplace.events`.

## Product Listing Denormalization

`Product` now stores:

```txt
teacherDisplayName
teacherTier
teacherAverageRating
teacherValidReviewCount
```

`TeacherRatingService` updates these fields on the seller's products whenever rating/tier is recomputed. Initial product creation uses `sellerUserId` as the fallback display name until profile display integration is added.

## Verification

Focused tests run successfully:

```txt
wallet-service:      .\mvnw.cmd "-Dtest=WalletSourceAllocatorTest" test
marketplace-service: .\mvnw.cmd "-Dtest=EscrowSafetyRulesTest,TeacherRatingServiceTest" test
quiz-service:        .\mvnw.cmd "-Dtest=QuizServiceTest" test
```

Full service test commands compile application code, but existing `*ApplicationTests.contextLoads` fail because `CONFIG_SERVER_URL` is not set and Spring Cloud Config fail-fast is enabled. This is an environment/test configuration issue observed across wallet, marketplace, flashcard, and quiz services, not a Phase 2 compile error.

## Follow-up

Recommended next work:

- Add partial refund policy and API implementation.
- Add frontend teacher wallet split view: withdrawable, app-only, escrow pending.
- Add frontend escrow pending list and rating badges.
- Replace old seller revenue statistics that read `PAID` order totals with escrow released/net figures.
- Add Phase 3 risk review: `CollusionFlag`, suspicious review states, wallet holds/freezes.
- Add profile-service consumer for `teacher.tier.updated` if teacher profile display should mirror marketplace tier.
