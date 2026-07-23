# Seika Token Economy V3 — Protected Coin, Escrow, and Content Safety

> **Status:** Proposed, implementation-ready after technical task breakdown  
> **Supersedes:** `docs/ideas/teacher-tiered-economy-v2.md`  
> **Also incorporates:** `docs/ideas/teacher-tiered-economy-conflicts.md`  
> **Scope note:** Project cá nhân, ưu tiên nghiệp vụ hợp lý, code minh bạch, admin vận hành được một mình. Legal/tax/KYC tiếp tục out of scope.

## Problem Statement

**HMW** thiết kế token economy cho Seika để Admin có doanh thu bền vững, Teacher có động lực tạo content chất lượng, Student vẫn có cảm giác gamification dễ vào học, nhưng không mở đường cho việc biến coin tặng ban đầu hoặc coin reward thành tiền rút thật qua collusion, refund abuse, hoặc thay đổi content sau khi bán?

## Recommended Direction

Chọn hướng **Protected Coin + Marketplace Escrow + Teacher Tier + Content Safety Hooks + Risk Review**.

V3 giữ trục chính của V2 nhưng chốt toàn bộ open questions:

- `BONUS` và `REWARD` spend được trong marketplace nhưng không tạo withdrawable earning.
- Spend order ưu tiên student UX: `BONUS -> REWARD -> PAID`.
- `EARNED_PROMO` được dùng mua content khác nhưng luôn giữ non-withdrawable lineage.
- Escrow operation fee default `0` trong pilot để MVP dễ hiểu.
- Teacher dashboard tách rõ: `Có thể rút`, `Chỉ dùng trong app`, `Đang chờ escrow`.
- Product listing denormalize teacher tier/rating/name vào Marketplace DTO.
- Content lifecycle conflicts được xử lý bằng admin-decision queue, soft archive, và escrow state guards.

## Decision Log

| ID  | Decision                                                                                                                                                                              | Rationale                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| D1  | `REWARD` coin không withdrawable trong MVP                                                                                                                                            | Reward là gamification, không phải real-money liability                                                          |
| D2  | Dashboard hiển thị 3 số dư: `withdrawable`, `appOnly`, `escrowPending`                                                                                                                | Minh bạch với teacher, giảm tranh cãi khi cash-out                                                               |
| D3  | Spend order là `BONUS -> REWARD -> PAID`                                                                                                                                              | Student dùng coin miễn phí trước, UX tự nhiên hơn                                                                |
| D4  | Escrow operation fee default `0` trong pilot                                                                                                                                          | Tránh cảm giác fee chồng fee; có thể bật sau bằng config                                                         |
| D5  | `EARNED_PROMO` có thể mua content khác, nhưng lineage luôn non-withdrawable                                                                                                           | Chặn rửa coin qua nhiều giao dịch                                                                                |
| D6  | `BONUS`/`REWARD` mua được mọi content                                                                                                                                                 | Không làm marketplace khó hiểu với student                                                                       |
| D7  | Teacher tier Phase 2 MVP dùng chỉ `rating` + `validReviewCount` (giống V2); 5-metric (`consumeRate`, `refundRate`, `approvalRejectionRate`) thêm vào Phase 3 hardening                | Phase 2 giữ đơn giản; Phase 3 bổ sung khi đã có data `consumedAt` + `approved_rejected_count` thực               |
| D8  | Refund sau `consumedAt` chỉ admin override: full / partial / no refund                                                                                                                | Self-service đơn giản, admin xử lý case chất lượng thấp                                                          |
| D9  | Promo-backed fee là coin sink, không phải real revenue                                                                                                                                | Admin dashboard không phóng đại doanh thu                                                                        |
| D10 | Reset DB hoàn toàn trước Phase 1; không migrate balance cũ. Hướng dẫn reset xem `docs/runbooks/db-reset-v3.md`                                                                        | Project cá nhân, dev/test nhiều máy cần baseline giống nhau                                                      |
| D11 | Marketplace config nằm trong Marketplace Service                                                                                                                                      | Tier/escrow/risk thuộc marketplace lifecycle                                                                     |
| D12 | `wallet.debit.succeeded` có source breakdown + ledgerEntryIds + idempotencyKey                                                                                                        | Escrow cần source lineage và idempotency mạnh                                                                    |
| D13 | Escrow release dùng outbox/inbox + idempotency                                                                                                                                        | Tránh double credit/double release                                                                               |
| D14 | Suspicious review là `PENDING_RISK_REVIEW`, tạm không tính tier                                                                                                                       | Giảm false positive nhưng vẫn bảo vệ tier                                                                        |
| D15 | `WASH_HOLD` chặn cash-out; `FROZEN` chặn wallet operations; không chặn login                                                                                                          | User vẫn xem được trạng thái/tài liệu, wallet bị kiểm soát                                                       |
| D16 | Product listing denormalize teacher tier/rating/name                                                                                                                                  | Tránh frontend fan-out và giảm latency marketplace                                                               |
| D17 | Marketplace Service là source of truth cho `TeacherRating`; publish `teacher.tier.updated` khi tier đổi; profile-service chỉ consume display                                          | Tránh hai service cùng lắng nghe review event gây drift; single owner tính tier                                  |
| D18 | Phase 1 không cần field `source_origin` trên `WalletLedgerEntry`; lineage chỉ cần cho risk review Phase 3 nếu cần audit chain                                                         | Tránh over-engineer schema Phase 1; promo lineage xác định lại qua `escrow.paid_backed_amount` ở Phase 2 nếu cần |
| D19 | `MarketplaceConfig` chỉ chứa key marketplace-service dùng. Wallet-service đọc key ảnh hưởng wallet operation (vd `WASH_HOLD_DAYS`) qua Feign client hoặc event publish khi config đổi | Tránh shared Postgres table cross-service                                                                        |

## Business Rules

### Coin Sources and Lineage

| Source                    | Created by                                       | Can spend in app? | Can create withdrawable earning? |           Cash-out eligible?            |
| ------------------------- | ------------------------------------------------ | :---------------: | :------------------------------: | :-------------------------------------: |
| `PAID`                    | Student top-up                                   |        Yes        |               Yes                | No, unless converted to teacher earning |
| `BONUS`                   | Initial grant, promo                             |        Yes        |                No                |                   No                    |
| `REWARD`                  | Learning reward                                  |        Yes        |            No in MVP             |                   No                    |
| `EARNED_WITHDRAWABLE`     | Seller earning from paid-backed purchase         |        Yes        |               Yes                |                   Yes                   |
| `EARNED_PROMO`            | Seller earning from bonus/reward-backed purchase |        Yes        |                No                |                   No                    |
| `PLATFORM_FEE_REAL`       | Fee from paid-backed purchase                    |        No         |        Admin real revenue        |                   N/A                   |
| `PLATFORM_FEE_PROMO_SINK` | Fee from promo-backed purchase                   |        No         |          Coin sink only          |                   N/A                   |

Important invariant:

```txt
Non-withdrawable source can never become withdrawable through resale.
```

If Teacher A earns `EARNED_PROMO` and spends it on Teacher B content, Teacher B receives promo-backed earning, not withdrawable earning.

### Spend Allocation

When buying content, wallet debits in this order:

```txt
BONUS -> REWARD -> PAID
```

This means student free/app-earned coin is consumed first. Marketplace still receives exact source breakdown, so teacher earning remains correctly split:

- bonus/reward-backed portion -> `EARNED_PROMO`
- paid-backed portion -> `EARNED_WITHDRAWABLE`

### Purchase Example

Student buys a 100 coin quiz using:

- 50 `BONUS`
- 20 `REWARD`
- 30 `PAID`

Teacher is `SILVER`, tier platform fee is 10%, escrow operation fee is 0 for pilot.

At escrow release:

- Promo-backed gross: `70`
- Paid-backed gross: `30`
- Teacher promo net: `70 * 90% = 63`
- Teacher withdrawable net: `30 * 90% = 27`
- Promo sink: `70 * 10% = 7`
- Real platform fee: `30 * 10% = 3`

Teacher balance increases by 90 app coins, but only 27 are cash-out eligible.

### Teacher Dashboard Wording

Teacher wallet must show:

```txt
Có thể rút: 27 coin
Chỉ dùng trong app: 63 coin
Đang chờ escrow: 100 coin
```

Avoid vague "total balance" as the primary number for teacher cash-out screens. Total can be shown secondarily if useful.

## Service Ownership

### Marketplace Service Owns

- `Product`, `Order`, `OrderItem`, `UserInventory`
- `MarketplaceConfig`
- `EscrowTransaction`
- `Review`
- `TeacherRating`
- `CollusionFlag`
- `AdminActionLog`
- product listing denormalized teacher metadata
- escrow release/refund/admin decision lifecycle

Marketplace config keys:

```txt
ESCROW_HOLD_DAYS = 7
ESCROW_OPERATION_FEE_PERCENT = 0
TIER_PLATFORM_FEE_PERCENT = {"NEWBIE":20,"BRONZE":15,"SILVER":10,"GOLD":5,"ELITE":3}
TIER_RATING_THRESHOLDS = {"NEWBIE":{"minReviews":0,"minRating":0},"BRONZE":{"minReviews":5,"minRating":3.0},"SILVER":{"minReviews":20,"minRating":3.5},"GOLD":{"minReviews":100,"minRating":4.0},"ELITE":{"minReviews":500,"minRating":4.5}}
TIER_CONSUME_RATE_MIN = {"SILVER":0.35,"GOLD":0.50,"ELITE":0.65}
TIER_REFUND_RATE_MAX = {"BRONZE":0.20,"SILVER":0.15,"GOLD":0.10,"ELITE":0.05}
TIER_APPROVAL_REJECTION_RATE_MAX = {"BRONZE":0.50,"SILVER":0.30,"GOLD":0.15,"ELITE":0.08}
COLLUSION_LOOKBACK_DAYS = 30
COLLUSION_RISK_THRESHOLD = 50
COLLUSION_TX_THRESHOLD = 5
COLLUSION_PROMO_BACKED_RATIO_THRESHOLD = 0.6
COLLUSION_NO_CONSUME_RATIO_THRESHOLD = 0.7
WASH_HOLD_DAYS = 30
```

### Wallet Service Owns

- `Wallet`
- source balances
- `WalletLedgerEntry`
- `WalletHold`
- wallet operation guards
- top-up/cash-out
- real revenue and treasury ledger

Wallet config keys:

```txt
TOPUP_VND_PER_COIN = 100
WITHDRAWAL_VND_PER_COIN = 90
STUDENT_INITIAL_COIN = 500
TEACHER_INITIAL_COIN = 0
CASH_OUT_MIN_COINS = 10
CASH_OUT_MULTIPLE = 10
```

### Flashcard and Quiz Services Own

- content CRUD
- study progress / quiz attempts
- `content.consumed` event publishing

They should not own marketplace escrow or teacher payout.

### Profile Service Owns

- profile display data
- consumes `teacher.tier.updated` từ marketplace-service chỉ để hiển thị profile teacher

Marketplace service là **source of truth** cho `TeacherRating` (D17): tính tier, lưu rating, publish `teacher.tier.updated` khi tier đổi. Profile-service KHÔNG tính tier, KHÔNG aggregate review — chỉ display. Tránh hai service cùng lắng nghe review event gây drift.

Marketplace product listing vẫn denormalize teacher name/tier/rating vào `Product.teacherDisplayName/tier/averageRating` để tránh frontend fan-out.

## Data Model

### Wallet

```txt
id
userId
balance
bonusBalance
rewardBalance
paidBalance
earnedWithdrawableBalance
earnedPromoBalance
heldBalance
frozen
createdAt
updatedAt
```

`balance` is a legacy-friendly total:

```txt
balance = bonusBalance + rewardBalance + paidBalance + earnedWithdrawableBalance + earnedPromoBalance
```

Only `earnedWithdrawableBalance` can be cashed out.

### WalletLedgerEntry

```txt
id
walletId
userId
type
source
amount
withdrawableAmount
nonWithdrawableAmount
amountVnd
rateVndPerCoin
orderId
orderItemId
escrowId
counterpartyUserId
idempotencyKey
description
createdAt
```

> **Note (D18):** Phase 1 không cần field `source_origin` (PROMO_BACKED / PAID_BACKED / MIXED) trên `WalletLedgerEntry`. Lineage promo chỉ cần cho risk review Phase 3 nếu cần audit chain. Phase 2 escrow tách source lineage thông qua `EscrowTransaction.paidBackedAmount` / `bonusBackedAmount` / `rewardBackedAmount` riêng.

Ledger types:

```txt
TOP_UP
INITIAL_BONUS
LEARNING_REWARD
PURCHASE_DEBIT
ESCROW_RELEASE_CREDIT
ESCROW_REFUND_CREDIT
PLATFORM_FEE_REAL
PLATFORM_FEE_PROMO_SINK
CASH_OUT
WALLET_HOLD
WALLET_FREEZE
WALLET_UNFREEZE
```

### MarketplaceConfig

```txt
key
value
description
updatedBy
updatedAt
```

### EscrowTransaction

```txt
id
orderId
orderItemId
buyerId
sellerId
productId
productType
grossAmount
bonusBackedAmount
rewardBackedAmount
paidBackedAmount
promoBackedAmount
tierAtRelease
tierFeePercent
escrowFeePercent
teacherWithdrawableNet
teacherPromoNet
platformFeeReal
platformFeePromoSink
status: HELD | PENDING_ADMIN_DECISION | CANCELLED_BY_ADMIN | RELEASED | REFUNDED
needsAdminDecision
reviewReason
releaseAt
releasedAt
refundedAt
createdAt
updatedAt
```

### OrderItem Additions

```txt
escrowState: NONE | HELD | PENDING_ADMIN_DECISION | CANCELLED_BY_ADMIN | RELEASED | REFUNDED
escrowNeedsReview
escrowReviewReason
escrowFullyRefunded
adminDecisionAt
adminDecisionBy
adminDecisionReason
```

### UserInventory Additions

```txt
consumedAt
revocationReason
sourceOrderId
```

### Review

```txt
id
buyerId
sellerId
productId
orderId
rating
comment
status: VALID | PENDING_RISK_REVIEW | EXCLUDED_WASH | DELETED_BY_ADMIN
createdAt
updatedAt
```

Unique rule: one review per `(buyerId, productId)`.

### TeacherRating

Phase 2 MVP (D7) chỉ dùng 2 metric. Phase 3 hardening bổ sung 3 metric còn lại.

**Phase 2 MVP — columns trong table `teacher_ratings`:**

```txt
teacherId (PK)
averageRating
validReviewCount
excludedReviewCount
tier
tierFeePercent
updatedAt
```

**Phase 3 hardening — columns thêm vào:**

```txt
consumeRate
refundRate
approvalRejectionRate
```

Default tier rules (Phase 2 MVP — chỉ dùng rating + validReviewCount):

| Tier     | Minimum rule                        | Platform fee |
| -------- | ----------------------------------- | -----------: |
| `NEWBIE` | fallback/default                    |          20% |
| `BRONZE` | >= 5 valid reviews, rating >= 3.0   |          15% |
| `SILVER` | >= 20 valid reviews, rating >= 3.5  |          10% |
| `GOLD`   | >= 100 valid reviews, rating >= 4.0 |           5% |
| `ELITE`  | >= 500 valid reviews, rating >= 4.5 |           3% |

Phase 3 sẽ nâng cấp table `tier_thresholds` từ singleton config json thành các row với rule 4 chiều:

| Tier     | Minimum rule (Phase 3)                                                                             | Platform fee |
| -------- | -------------------------------------------------------------------------------------------------- | -----------: |
| `NEWBIE` | fallback                                                                                           |          20% |
| `BRONZE` | >= 5 reviews, rating >= 3.0                                                                        |          15% |
| `SILVER` | >= 20 reviews, rating >= 3.5, consumeRate >= 35%, refundRate <= 15%                                |          10% |
| `GOLD`   | >= 100 reviews, rating >= 4.0, consumeRate >= 50%, refundRate <= 10%, approvalRejectionRate <= 15% |           5% |
| `ELITE`  | >= 500 reviews, rating >= 4.5, consumeRate >= 65%, refundRate <= 5%, approvalRejectionRate <= 8%   |           3% |

`approvalRejectionRate` uses marketplace moderation history:

```txt
approvalRejectionRate = rejected_or_hidden_for_quality_count / total_reviewed_products
```

## Core Flows

### Flow 1: Registration

1. Identity creates user and profile as today.
2. Wallet consumes `user.registered`.
3. Student wallet starts with `bonusBalance = STUDENT_INITIAL_COIN`.
4. Teacher wallet starts with configured teacher initial balance, default 0.
5. For this plan, DB reset is accepted; no historical wallet migration is required.

### Flow 2: Top-up

1. Student posts top-up request.
2. Wallet converts VND to coin using `TOPUP_VND_PER_COIN`.
3. Wallet credits `paidBalance`.
4. Wallet writes `WalletLedgerEntry(type=TOP_UP, source=PAID, amountVnd, rateVndPerCoin)`.

### Flow 3: Marketplace Purchase

1. Student creates order in marketplace.
2. Marketplace validates product is `PUBLISHED`, `active=true`, not own product, not already owned/pending.
3. Marketplace publishes `wallet.debit.requested` through outbox.
4. Wallet debits in order `BONUS -> REWARD -> PAID`.
5. Wallet writes ledger entries and publishes `wallet.debit.succeeded`.
6. Marketplace receives event through inbox, marks order `PAID`, creates inventory, creates escrow records.
7. Marketplace publishes `content.purchased` for statistics/notifications only.
8. Teacher wallet is not credited until escrow release.

### `wallet.debit.succeeded` Contract

```json
{
  "eventId": "uuid",
  "eventType": "wallet.debit.succeeded",
  "idempotencyKey": "order:{orderId}:debit",
  "orderId": "string",
  "buyerUserId": "string",
  "totalAmount": 100,
  "sourceBreakdown": {
    "bonusAmount": 50,
    "rewardAmount": 20,
    "paidAmount": 30
  },
  "ledgerEntryIds": ["uuid-1", "uuid-2", "uuid-3"],
  "occurredAt": "ISO-8601"
}
```

Marketplace must ignore duplicate events with the same `idempotencyKey`.

### Flow 4: Escrow Release

1. `EscrowReleaseJob` queries `HELD` escrows where `releaseAt <= now`.
2. Skip escrows with `needsAdminDecision=true`.
3. Compute teacher tier at release time.
4. Compute:
   - `promoBackedAmount = bonusBackedAmount + rewardBackedAmount`
   - `teacherWithdrawableNet` from paid-backed amount
   - `teacherPromoNet` from promo-backed amount
   - `platformFeeReal` from paid-backed amount
   - `platformFeePromoSink` from promo-backed amount
5. Marketplace writes an outbox event `wallet.credit.requested`.
6. Wallet consumes through inbox, credits teacher balances, writes ledger entries, publishes `wallet.credit.succeeded`.
7. Marketplace marks escrow `RELEASED` only after `wallet.credit.succeeded`.

### `wallet.credit.requested` Contract

```json
{
  "eventId": "uuid",
  "eventType": "wallet.credit.requested",
  "idempotencyKey": "escrow:{escrowId}:release",
  "escrowId": "string",
  "orderId": "string",
  "orderItemId": "string",
  "sellerUserId": "string",
  "teacherWithdrawableAmount": 27,
  "teacherPromoAmount": 63,
  "platformFeeReal": 3,
  "platformFeePromoSink": 7,
  "occurredAt": "ISO-8601"
}
```

Wallet must reject duplicate `idempotencyKey` without double-crediting.

### Flow 5: Self-service Refund

Student can request refund only when:

- escrow is `HELD`
- requester is buyer
- inventory exists
- `consumedAt == null`
- escrow is not `PENDING_ADMIN_DECISION` or `CANCELLED_BY_ADMIN`

Refund action:

1. Marketplace marks escrow `REFUNDED`.
2. Marketplace revokes inventory.
3. Marketplace publishes `wallet.refund.requested` with original source breakdown.
4. Wallet restores balances to original source buckets.
5. No teacher credit and no platform fee.

### Flow 6: Admin Refund Override

After `consumedAt`, self-service refund is blocked. Admin can choose:

- `FULL_REFUND`
- `PARTIAL_REFUND`
- `NO_REFUND`
- `FORCE_RELEASE`

Admin override is required for:

- content quality disputes after consumption
- content edit during escrow hold
- admin reject/hide while orders are held
- malicious/collusion review

Every override writes `AdminActionLog`.

### Flow 7: Content Consumed

1. Flashcard service publishes `content.consumed` on first progress `> 0`.
2. Quiz service publishes `content.consumed` on first attempt.
3. Marketplace updates `UserInventory.consumedAt`.
4. Refund becomes admin-only.

### Flow 8: Review + Tier

1. Student posts review.
2. Marketplace validates verified purchase and unique `(buyerId, productId)`.
3. If purchase is linked to active suspicious flag, review starts as `PENDING_RISK_REVIEW`.
4. `PENDING_RISK_REVIEW` does not count toward tier.
5. If admin dismisses risk, review becomes `VALID`.
6. If admin confirms wash, review becomes `EXCLUDED_WASH`.
7. Teacher tier recomputes using:
   - rating
   - valid review count
   - consumeRate
   - refundRate
   - approvalHistory

### Flow 9: Risk Review

Daily job computes risk score from 30-day data:

```txt
riskScore =
  25 if transactionCount > COLLUSION_TX_THRESHOLD
+ 25 if promoBackedRatio > 0.6
+ 20 if noConsumeRatio > 0.7
+ 15 if reciprocalRatio > 0.7
+ 15 if reviewVelocity abnormal
```

Flag if `riskScore >= COLLUSION_RISK_THRESHOLD`.

Admin status behavior:

| Status       | Behavior                                                             |
| ------------ | -------------------------------------------------------------------- |
| `SUSPICIOUS` | Linked reviews become `PENDING_RISK_REVIEW`; no user notification    |
| `CONFIRMED`  | Teacher gets `WASH_HOLD`; linked reviews become `EXCLUDED_WASH`      |
| `MALICIOUS`  | Buyer/seller wallets become `FROZEN`; admin handles eligible refunds |
| `DISMISSED`  | Pending reviews can become `VALID`                                   |

## Content Lifecycle Conflict Resolution

These rules are mandatory before or during Phase 1 because they affect escrow correctness.

### R1 — Teacher Edit During `HELD`

Teacher can edit content. When marketplace receives `flashcard.set.updated` or `quiz.set.updated`:

1. Existing product behavior remains: product resets to `PENDING_REVIEW`, `active=false`.
2. For every related `OrderItem` with `escrowState=HELD`:
   - set `escrowNeedsReview=true`
   - set `escrowReviewReason=content_edit_by_teacher`
   - set escrow status `PENDING_ADMIN_DECISION`
   - set order `needsAdminDecision=true`
3. Admin sees the item in pending decision queue.
4. Admin chooses refund or force release.

Reason: minor edits should not be blocked, but escrow release must not silently proceed after content changes.

### R2 — Admin Reject/Hide During `HELD`

When admin rejects/hides a product with held escrows:

1. Product status changes as today.
2. Related held order items become `CANCELLED_BY_ADMIN`.
3. No automatic refund.
4. Admin must decide per item:
   - refund
   - partial refund
   - force release
   - no refund

Reason: reject/hide can mean violation, temporary cleanup, or quality issue; automatic refund would be too blunt.

### R3 — Teacher Hard Delete

Hard delete is blocked when related order items exist with:

```txt
escrowState IN (HELD, PENDING_ADMIN_DECISION, CANCELLED_BY_ADMIN)
AND escrowFullyRefunded = false
```

Attempted hard delete returns `409 Conflict`.

Teacher should use:

```txt
POST /api/marketplace/products/{id}/archive
```

Archive behavior:

- product status becomes `HIDDEN`
- product is removed from listing
- purchased users keep access unless admin revokes/refunds
- escrow audit remains intact

### R4 — Approve Is Still Content Gate Only

Admin approve is not a financial eligibility gate in this release.

Teacher wallet/tier issues are handled at escrow release:

- if wallet credit fails, escrow remains unreleased and admin can refund/resolve
- if teacher tier is low, fee is applied at release

Teacher onboarding/financial gate can be added after pilot if needed.

## Wallet Holds and Freezes

| Hold type   | Blocks cash-out | Blocks spend | Blocks top-up | Blocks login |
| ----------- | :-------------: | :----------: | :-----------: | :----------: |
| `WASH_HOLD` |       Yes       |      No      |      No       |      No      |
| `FROZEN`    |       Yes       |     Yes      |      Yes      |      No      |

Users can still log in to see status, notifications, and contact/admin messaging.

## API Surface

### Marketplace Public/User APIs

```txt
GET  /api/marketplace/products
GET  /api/marketplace/products/{id}
POST /api/marketplace/orders
GET  /api/marketplace/escrows/me
POST /api/marketplace/escrows/{escrowId}/refund
POST /api/marketplace/reviews
GET  /api/marketplace/teachers/{teacherId}/rating
POST /api/marketplace/products/{id}/archive
```

Product list item includes:

```txt
teacherUserId
teacherDisplayName
teacherTier
teacherAverageRating
teacherValidReviewCount
```

### Marketplace Admin APIs

```txt
GET  /api/marketplace/admin/configs
PUT  /api/marketplace/admin/configs/{key}
GET  /api/marketplace/admin/orders/pending-decision
POST /api/marketplace/admin/order-items/{id}/refund
POST /api/marketplace/admin/order-items/{id}/partial-refund
POST /api/marketplace/admin/order-items/{id}/force-release
POST /api/marketplace/admin/order-items/{id}/no-refund
GET  /api/marketplace/admin/collusion-flags?status=SUSPICIOUS
GET  /api/marketplace/admin/collusion-flags/{id}
POST /api/marketplace/admin/collusion-flags/{id}/action
```

### Wallet APIs

```txt
GET  /api/wallet/balance
GET  /api/wallet/balance/breakdown
GET  /api/wallet/holds/me
POST /api/wallet/top-up
POST /api/wallet/cash-out
GET  /api/wallet/admin/ledger
GET  /api/wallet/admin/revenue-stats
```

## Revenue Reporting

Admin dashboard must separate:

```txt
realRevenueVnd
paidBackedFeeCoins
promoSinkCoins
cashOutLiabilityVnd
withdrawableCoinCirculation
nonWithdrawableCoinCirculation
```

Promo-backed fees are not real revenue. They are coin sinks/internal accounting only.

## MVP Scope

### Phase 1 — Protected Coin Ledger + Content Safety Hooks

- **Reset DB** hoàn toàn trước khi triển khai (D10). Hướng dẫn chi tiết xem `docs/runbooks/db-reset-v3.md`. Không migrate balance cũ.
- Add source balances to wallet.
- Add `WalletLedgerEntry`.
- Convert initial grant to `BONUS`.
- Convert learning reward to `REWARD`.
- Convert top-up to `PAID`.
- Debit purchase using `BONUS -> REWARD -> PAID`.
- Return source breakdown in `wallet.debit.succeeded`.
- Cash-out only from `earnedWithdrawableBalance`.
- Replace admin revenue regex parsing with structured ledger.
- Add marketplace config table/service.
- Add R1 edit-during-held hooks, even if escrow is feature-flagged.
- Add R2 reject/hide pending decision hooks.
- Add R3 hard-delete guard + archive endpoint.

### Phase 2 — Escrow + Tier + Review

- Add `EscrowTransaction`.
- Stop direct teacher payout from `content.purchased`.
- Add escrow release job with outbox/inbox.
- Add `wallet.credit.requested/succeeded`.
- Add self-service refund before consume.
- Add admin refund override.
- Add `content.consumed` event consumers.
- Add `Review` and `TeacherRating` (Phase 2 MVP — chỉ `averageRating`, `validReviewCount`, `excludedReviewCount`, `tier`, `tierFeePercent`; D7).
- Marketplace là source of truth cho `TeacherRating`, publish `teacher.tier.updated` (D17).
- Add marketplace DTO teacher denormalization.
- Add student tier/rating badge.
- Add teacher dashboard balance split + escrow pending list.

Tier defaults Phase 2 chỉ dùng `rating` + `validReviewCount` (giống V2 estimate). Các metric nặng hơn (`consumeRate`, `refundRate`, `approvalRejectionRate`) chuyển sang Phase 3 hardening.

### Phase 3 — Risk Review + Holds

- Add `CollusionFlag`.
- Add risk score job.
- Add `PENDING_RISK_REVIEW` review state.
- Add admin risk review dashboard.
- Add `WalletHold` enforcement.
- Add notifications for confirmed/malicious decisions.
- Add admin action logs for all manual decisions.

## Testing Strategy

Unit tests:

- Source allocation order: `BONUS -> REWARD -> PAID`.
- Non-withdrawable lineage through resale.
- Cash-out rejects `BONUS`, `REWARD`, `EARNED_PROMO`.
- Tier calculation with rating, review count, consumeRate, refundRate, approvalHistory.
- Escrow fee default 0.
- Promo-backed fee counted as sink, not real revenue.
- Wallet hold/freeze operation matrix.

Integration tests:

- Initial bonus purchase -> teacher receives `EARNED_PROMO` only.
- Reward purchase -> teacher receives `EARNED_PROMO` only.
- Paid purchase -> teacher receives `EARNED_WITHDRAWABLE` after release.
- Mixed-source purchase -> release splits teacher net correctly.
- `EARNED_PROMO` resale remains non-withdrawable.
- Teacher edit during held escrow -> admin pending decision queue.
- Admin reject/hide during held escrow -> `CANCELLED_BY_ADMIN`, no auto-refund.
- Hard delete with held escrow -> `409 Conflict`.
- Archive product -> listing hidden but purchased access preserved.
- Self-service refund before consume restores original source buckets.
- Refund after consume requires admin override.
- Duplicate debit/credit events do not double debit/credit.

Manual scenarios:

- Legit teacher sells to many real students: no risk flag.
- Teacher creates student accounts using bonus coins: risk flag via promo/no-consume.
- Admin dismisses suspicious flag: pending reviews become valid.
- Admin confirms wash: teacher cash-out hold active.
- Admin marks malicious: wallet operations blocked, login still works.

## Effort Estimate

| Phase                                            |       Estimate |
| ------------------------------------------------ | -------------: |
| Phase 1: Protected ledger + content safety hooks |    2.5-3 weeks |
| Phase 2: Escrow + tier + review                  |  2.5-3.5 weeks |
| Phase 3: Risk review + holds                     |  1.5-2.5 weeks |
| Frontend polish + regression testing             |    1-1.5 weeks |
| Total                                            | 7.5-10.5 weeks |

## Not Doing

- No withdrawable `REWARD` coin in MVP.
- No paid/bonus/reward marketplace restrictions; all can buy content.
- No automatic refund on admin reject/hide.
- No hard-delete of sold content while escrow/audit is unresolved.
- No teacher onboarding financial gate in this release.
- No crypto/stablecoin/two-token model.
- No tax/KYC/legal compliance.
- No public admin revenue disclosure.
- No teacher-defined fee/spread.
- No dynamic student top-up rate.
- No device fingerprint unless already available.
- No full appeal workflow; admin manual decisions are enough for pilot.

## Remaining Assumptions To Validate

- [ ] Teacher understands and accepts `Có thể rút` vs `Chỉ dùng trong app`.
- [ ] Student still feels rewarded when free coins are spent first.
- [ ] Admin can handle pending decision queue volume manually.
- [ ] Risk review does not create too many `PENDING_RISK_REVIEW` reviews.
- [ ] Escrow operation fee can remain 0 during pilot without undermining admin revenue goals.

## Implementation Notes

- Phase 1 triển khai sau khi **DB reset** (D10). Hướng dẫn reset chi tiết: `docs/runbooks/db-reset-v3.md`. Không cần migration script cho data cũ.
- Phase 2 tier MVP chỉ dùng `averageRating` + `validReviewCount` (D7). 5-metric tier (`consumeRate`, `refundRate`, `approvalRejectionRate`) chuyển sang Phase 3 hardening. Tier table schema Phase 2 không có 3 field kia; migration Phase 3 mới `ALTER TABLE teacher_ratings ADD COLUMN`.
- **Marketplace service là source of truth cho `TeacherRating`** (D17), publish `teacher.tier.updated` khi tier đổi. Profile-service chỉ consume display, không tính tier. Tránh duplicate listener gây drift.
- Wallet-service cần đọc `MarketplaceConfig` keys ảnh hưởng wallet operations (vd `WASH_HOLD_DAYS`) qua Feign client hoặc event publish khi config đổi (D19). Không share Postgres table cross-service.
- Use feature flags for escrow release and risk review if needed.
- Keep old `content.purchased` consumers for statistics/notifications, but remove wallet teacher credit from that event before enabling escrow.
- All cross-service financial events require `idempotencyKey`.
- Marketplace should never mark escrow `RELEASED` before wallet confirms credit.
