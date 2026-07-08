# Seika Token Economy V2 — Protected Coin + Marketplace Escrow

> **Status:** Proposed  
> **Supersedes:** `docs/ideas/teacher-tiered-economy.md` as the preferred implementation plan.  
> **Scope note:** Project cá nhân, ưu tiên nghiệp vụ hợp lý, code minh bạch, admin vận hành được một mình. Legal/tax/KYC tiếp tục out of scope.

## Problem Statement

**HMW** thiết kế token economy cho Seika để Admin có doanh thu bền vững, Teacher có động lực tạo content chất lượng, Student vẫn có cảm giác gamification dễ vào học, nhưng không mở đường cho việc biến coin tặng ban đầu hoặc coin reward thành tiền rút thật qua collusion?

## Recommended Direction

Chọn hướng **Protected Coin + Marketplace Escrow + Teacher Tier + Risk Review**.

Điểm thay đổi lớn so với plan cũ: không chỉ thêm tier/escrow, mà sửa gốc kế toán coin. Coin trong ví phải có **source** và **withdrawability**. Coin từ top-up thật có thể tạo ra teacher earning rút được. Coin tặng ban đầu hoặc reward học tập vẫn có thể dùng để trải nghiệm marketplace, nhưng phần teacher nhận từ các coin này chỉ là **non-withdrawable earning** hoặc promotional credit, không trở thành nghĩa vụ VND của Admin.

Teacher tier không còn áp ở `cashOut` nữa. Tier fee được thu ở **escrow release**, đúng nghĩa marketplace commission. `WITHDRAWAL_VND_PER_COIN` giữ vai trò treasury conversion cố định/fallback khi teacher rút số dư withdrawable sang VND.

## Core Decisions

| Area | Decision | Why |
|---|---|---|
| Initial 500 coins | Giữ UX 500 coin, nhưng source là `BONUS` và không sinh withdrawable earning | Chặn silent inflation mà không phá onboarding |
| Reward coins | Source là `REWARD`; có thể spend in-app, mặc định không sinh withdrawable earning | Coin học tập là gamification, không phải liability tiền mặt |
| Paid coins | Source là `PAID`; khi mua content có thể sinh withdrawable earning cho teacher | Chỉ tiền thật mới backing được cash-out |
| Teacher tier fee | Thu tại escrow release, không thu tại cash-out | Ledger rõ, phản ánh đúng marketplace commission |
| Cash-out rate | Giữ `WITHDRAWAL_VND_PER_COIN` làm config cố định, default 90 | Đơn giản, giảm mâu thuẫn giữa spread và commission |
| Escrow fee | `ESCROW_OPERATION_FEE_PERCENT`, default 1%, cộng rõ vào tổng fee | Nếu muốn demo đơn giản có thể set 0 bằng config |
| Review ownership | Marketplace-service owns `Review` và `TeacherRating` | Review phụ thuộc purchase/inventory/order nhiều nhất |
| Escrow ownership | Marketplace-service owns `EscrowTransaction`; wallet-service owns balance/ledger | Escrow là lifecycle của order, wallet chỉ ghi movement |
| Collusion ownership | Marketplace-service owns detection/review; wallet-service enforces holds/freeze | Detection cần order/review/inventory; enforcement cần wallet |
| Refund eligibility | Marketplace mirror `consumedAt` từ flashcard/quiz events | Không query chéo tùy tiện khi refund |

## Business Model

### Coin Sources

| Source | Created by | Student can spend? | Can create teacher withdrawable earning? | Notes |
|---|---|---:|---:|---|
| `PAID` | Student top-up | Yes | Yes | Backed by real VND |
| `BONUS` | Initial grant, promo | Yes | No | Good for onboarding, not cash liability |
| `REWARD` | Learning reward | Yes | No by default | Can later allow partial backing if desired |
| `EARNED_WITHDRAWABLE` | Seller earning from paid-backed purchases | Yes | Already withdrawable | Teacher can cash out |
| `EARNED_PROMO` | Seller earning from bonus/reward-backed purchases | Yes | No | Teacher can spend in-app but not cash out |
| `PLATFORM_FEE` | Fee captured at release | No user spend | Admin revenue/sink | Structured ledger only |

### Purchase Example

Student buys a 100 coin quiz with:

- 60 `PAID` coins
- 40 `BONUS` coins

Teacher is `SILVER`: tier fee 10%. Escrow operation fee is 1%. Total fee = 11%.

At escrow release:

- Paid-backed teacher net: `60 * 89% = 53.4` → `EARNED_WITHDRAWABLE`
- Bonus-backed teacher net: `40 * 89% = 35.6` → `EARNED_PROMO`
- Platform fee from paid-backed portion: `6.6` → admin revenue ledger
- Platform fee from bonus-backed portion: `4.4` → coin sink / internal ledger, not real revenue

Teacher balance increases by 89 total coins, but only 53.4 coins are cash-out eligible.

## Target Architecture

### Marketplace Service

Owns:

- `Product`, `Order`, `OrderItem`, `UserInventory`
- `EscrowTransaction`
- `Review`
- `TeacherRating`
- `CollusionFlag`
- `AdminActionLog`
- purchase/tier/collusion admin APIs

Responsibilities:

- Create orders and publish `wallet.debit.requested`
- Receive `wallet.debit.succeeded` with source breakdown
- Mark order `PAID`, create inventory, create escrow records
- Release/refund escrow
- Validate verified-purchase reviews
- Recompute teacher tier
- Detect suspicious transaction patterns
- Publish `wallet.credit.requested`, `wallet.hold.requested`, notification events

### Wallet Service

Owns:

- `Wallet`
- `WalletLedgerEntry`
- source balances / withdrawable balance
- `WalletHold`
- `SystemConfig`
- cash-out and top-up

Responsibilities:

- Debit wallet with source allocation
- Return debit source breakdown to marketplace
- Credit teacher with withdrawable/non-withdrawable breakdown
- Enforce wallet holds/freeze before spend/cash-out
- Record structured ledger entries instead of parsing description strings
- Compute admin treasury stats from ledger fields

### Flashcard / Quiz Services

Responsibilities:

- Continue recording study progress and quiz attempts locally
- Publish `content.consumed` when student starts consuming purchased content:
  - Flashcard: first progress record with `progress > 0`
  - Quiz: first attempt created

### Profile Service

Responsibilities:

- Keep teacher profile stats
- Optionally consume `teacher.tier.updated` to display tier in profile
- Marketplace product list can also include tier directly to avoid frontend fan-out

## Data Model

### WalletLedgerEntry

```txt
id
walletId
userId
type: TOP_UP | INITIAL_BONUS | LEARNING_REWARD | PURCHASE_DEBIT |
      ESCROW_RELEASE_CREDIT | ESCROW_REFUND_CREDIT | PLATFORM_FEE |
      CASH_OUT | WALLET_HOLD | WALLET_FREEZE | WALLET_UNFREEZE
amount
source: PAID | BONUS | REWARD | EARNED_WITHDRAWABLE | EARNED_PROMO | PLATFORM_FEE
withdrawableAmount
nonWithdrawableAmount
orderId
escrowId
counterpartyUserId
description
createdAt
```

### Wallet Balance Fields

MVP can add explicit columns to `Wallet`:

```txt
balance
paidBalance
bonusBalance
rewardBalance
earnedWithdrawableBalance
earnedPromoBalance
heldBalance
frozen
```

`balance` remains a derived/legacy-friendly total, while cash-out only uses `earnedWithdrawableBalance`.

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
paidBackedAmount
bonusBackedAmount
rewardBackedAmount
tierAtPurchase
tierFeePercent
escrowFeePercent
teacherWithdrawableNet
teacherPromoNet
platformFeePaidBacked
platformFeePromoBacked
status: HELD | RELEASED | REFUNDED | CANCELLED
releaseAt
releasedAt
refundedAt
createdAt
```

### UserInventory Additions

```txt
consumedAt
revocationReason
sourceOrderId
```

`consumedAt` is updated by `content.consumed` events from flashcard/quiz services.

### Review

```txt
id
buyerId
sellerId
productId
orderId
rating: 1..5
comment
status: VALID | EXCLUDED_SUSPICIOUS | EXCLUDED_WASH | DELETED_BY_ADMIN
createdAt
updatedAt
```

Unique rule: one review per `(buyerId, productId)`.

### TeacherRating

```txt
teacherId
averageRating
validReviewCount
excludedReviewCount
tier: NEWBIE | BRONZE | SILVER | GOLD | ELITE
tierFeePercent
updatedAt
```

Default tiers:

| Tier | Requirement | Platform fee |
|---|---|---:|
| `NEWBIE` | < 5 valid reviews | 20% |
| `BRONZE` | 5-19 reviews, rating >= 3.0 | 15% |
| `SILVER` | 20-99 reviews, rating >= 3.5 | 10% |
| `GOLD` | 100-499 reviews, rating >= 4.0 | 5% |
| `ELITE` | 500+ reviews, rating >= 4.5 | 3% |

### CollusionFlag

```txt
id
pairKey
buyerId
sellerId
riskScore
transactionCount
totalAmount
paidBackedAmount
promoBackedAmount
promoBackedRatio
reciprocalRatio
youngAccountBuyerCount
noConsumeRatio
reviewVelocity
status: SUSPICIOUS | CONFIRMED | MALICIOUS | DISMISSED
reason
reviewedBy
reviewedAt
createdAt
```

## Core Flows

### Flow 1: Registration

1. Identity creates user and profile as today.
2. Wallet consumes `user.registered`.
3. Student wallet is created with:
   - `bonusBalance = STUDENT_INITIAL_COIN`
   - ledger type `INITIAL_BONUS`
4. Teacher wallet is created with zero or configured initial balance.

### Flow 2: Top-up

1. Student posts top-up request.
2. Wallet converts VND to coin using `TOPUP_VND_PER_COIN`.
3. Wallet credits `paidBalance`.
4. Ledger entry records exact `amountVnd`, `coinAmount`, and rate.

### Flow 3: Marketplace Purchase

1. Student creates order in marketplace.
2. Marketplace validates product, ownership, duplicate purchase.
3. Marketplace publishes `wallet.debit.requested`.
4. Wallet debits using allocation order:
   - `paidBalance`
   - `bonusBalance`
   - `rewardBalance`
5. Wallet publishes `wallet.debit.succeeded` with source breakdown.
6. Marketplace marks order `PAID`, creates inventory, creates escrow rows.
7. Marketplace publishes `content.purchased` for statistics/notifications.
8. Teacher wallet is not credited yet.

### Flow 4: Escrow Release

1. `EscrowReleaseJob` runs hourly.
2. Finds `HELD` escrow where `releaseAt <= now`.
3. Calculates tier fee + escrow fee from escrow snapshot, not current tier.
4. Publishes `wallet.credit.requested` for teacher:
   - paid-backed net → `EARNED_WITHDRAWABLE`
   - bonus/reward-backed net → `EARNED_PROMO`
5. Wallet credits teacher and records structured ledger.
6. Marketplace updates escrow `RELEASED`.

### Flow 5: Refund

1. Student requests refund while escrow is `HELD`.
2. Marketplace validates:
   - requester is buyer
   - escrow is held
   - inventory exists and `consumedAt == null`
   - pair is not confirmed malicious in a way that blocks self-service refund
3. Marketplace marks escrow `REFUNDED`, revokes inventory.
4. Wallet credits buyer back using original source breakdown.
5. No teacher credit and no escrow fee.

### Flow 6: Content Consumed

1. Flashcard service publishes `content.consumed` on first progress.
2. Quiz service publishes `content.consumed` on first attempt.
3. Marketplace updates `UserInventory.consumedAt`.
4. Refund is blocked after this point except manual admin override.

### Flow 7: Review + Tier

1. Student posts review.
2. Marketplace validates:
   - purchased inventory exists
   - one review per product
   - order/escrow is not confirmed wash/malicious
3. Review starts as `VALID` unless linked to suspicious pair.
4. Teacher rating is recomputed.
5. If tier changes, publish `teacher.tier.updated`.

### Flow 8: Collusion Detection

Daily job computes risk score from 30-day data.

MVP signals:

- Pair transaction count
- Total amount
- Promo-backed ratio
- No-consume ratio
- Young buyer account ratio if identity data is available
- Reciprocal ratio
- Review velocity

Example rule:

```txt
riskScore =
  25 if transactionCount > COLLUSION_TX_THRESHOLD
+ 25 if promoBackedRatio > 0.6
+ 20 if noConsumeRatio > 0.7
+ 15 if reciprocalRatio > 0.7
+ 15 if reviewVelocity abnormal
```

Flag if `riskScore >= 50`.

This catches both:

- A buys B, B buys A wash loops
- Teacher creates many student accounts using bonus coins one-way

## Admin Policy

| Status | Trigger | System behavior | User impact |
|---|---|---|---|
| `SUSPICIOUS` | Risk score auto flag | Exclude linked reviews from tier, show admin queue | User not notified |
| `CONFIRMED` | Admin confirms wash | Teacher wallet cash-out hold for configured days; reviews `EXCLUDED_WASH` | Teacher sees warning |
| `MALICIOUS` | Repeated/intentional abuse | Freeze wallets, refund eligible held/unconsumed escrows, blacklist user IDs | Users see suspension state |
| `DISMISSED` | False positive | Restore review validity if applicable | No user impact |

## API Surface

### Marketplace

```txt
POST /api/marketplace/reviews
GET  /api/marketplace/teachers/{teacherId}/rating
GET  /api/marketplace/escrows/me
POST /api/marketplace/escrows/{escrowId}/refund
GET  /api/marketplace/admin/collusion-flags?status=SUSPICIOUS
GET  /api/marketplace/admin/collusion-flags/{id}
POST /api/marketplace/admin/collusion-flags/{id}/action
```

### Wallet

```txt
GET  /api/wallet/balance
GET  /api/wallet/balance/breakdown
POST /api/wallet/top-up
POST /api/wallet/cash-out
GET  /api/wallet/holds/me
GET  /api/wallet/admin/ledger
GET  /api/wallet/admin/revenue-stats
```

## Configuration

Wallet config:

```txt
TOPUP_VND_PER_COIN = 100
WITHDRAWAL_VND_PER_COIN = 90
STUDENT_INITIAL_COIN = 500
TEACHER_INITIAL_COIN = 0
CASH_OUT_MIN_COINS = 10
CASH_OUT_MULTIPLE = 10
```

Marketplace config:

```txt
ESCROW_HOLD_DAYS = 7
ESCROW_OPERATION_FEE_PERCENT = 1
TIER_PLATFORM_FEE_PERCENT = {"NEWBIE":20,"BRONZE":15,"SILVER":10,"GOLD":5,"ELITE":3}
TIER_RATING_THRESHOLDS = {"NEWBIE":{"minReviews":0,"minRating":0},"BRONZE":{"minReviews":5,"minRating":3.0},"SILVER":{"minReviews":20,"minRating":3.5},"GOLD":{"minReviews":100,"minRating":4.0},"ELITE":{"minReviews":500,"minRating":4.5}}
COLLUSION_LOOKBACK_DAYS = 30
COLLUSION_RISK_THRESHOLD = 50
COLLUSION_TX_THRESHOLD = 5
COLLUSION_PROMO_BACKED_RATIO_THRESHOLD = 0.6
COLLUSION_NO_CONSUME_RATIO_THRESHOLD = 0.7
WASH_HOLD_DAYS = 30
```

## MVP Scope

### Phase 1 — Protected Coin Ledger

- Add source balances to wallet.
- Add structured `WalletLedgerEntry`.
- Convert top-up to `PAID`.
- Convert initial grant to `BONUS`.
- Update purchase debit to return source breakdown.
- Update cash-out to use only `earnedWithdrawableBalance`.
- Replace admin revenue regex parsing with ledger fields.

### Phase 2 — Escrow + Tier + Review

- Add marketplace `EscrowTransaction`.
- Change `content.purchased` wallet payout into escrow release payout.
- Add `Review` and `TeacherRating`.
- Add tier badge to student marketplace.
- Add teacher dashboard tier/progress and pending escrow list.
- Add `content.consumed` events and `UserInventory.consumedAt`.
- Add refund endpoint.

### Phase 3 — Risk Review + Holds

- Add `CollusionFlag` and admin review dashboard.
- Add risk scoring job.
- Add wallet hold/freeze enforcement.
- Exclude suspicious/confirmed reviews from tier calculation.
- Add admin action logs and notifications.

The three phases can be shipped behind feature flags in one larger release branch, but each phase should be testable independently.

## Not Doing

- No crypto/stablecoin/two-token model.
- No tax/KYC/legal compliance for this project scope.
- No automatic money slash without admin review.
- No retroactive escrow on old orders.
- No public admin revenue disclosure.
- No dynamic student top-up rate.
- No teacher-defined fee/spread.
- No device fingerprint in MVP unless identity/frontend already exposes a stable signal.
- No full appeal workflow; admin can manually dismiss/restore for now.

## Migration Strategy

1. Existing wallet `balance` becomes legacy total.
2. Existing student balances can be migrated to `bonusBalance` unless there is clear top-up ledger evidence.
3. Existing teacher balances can be migrated to `earnedWithdrawableBalance` to avoid breaking current teacher expectations.
4. Existing transactions remain read-only historical records.
5. New ledger entries use `WalletLedgerEntry`.
6. Existing teachers start as `NEWBIE` until enough valid reviews exist.
7. Escrow applies only to new orders after feature flag enablement.

## Testing Strategy

Unit tests:

- Wallet source allocation order.
- Cash-out rejects non-withdrawable balances.
- Escrow fee math by tier.
- Review uniqueness and verified-purchase gate.
- Tier boundary values.
- Risk score boundaries.

Integration tests:

- Top-up → paid balance → purchase → escrow → release → teacher withdrawable balance.
- Initial bonus → purchase → escrow → release → teacher promo balance only.
- Refund before consume restores original source breakdown.
- Refund after `content.consumed` is rejected.
- Confirmed wash creates wallet hold and blocks cash-out.
- Duplicate wallet debit/release events are idempotent.

Manual test scenarios:

- Legit teacher sells 100 times to 100 different students: no collusion flag.
- Teacher creates 5 new student accounts using bonus coin: risk flag due promo-backed/no-consume signals.
- Teacher reaches tier threshold after valid review: marketplace product badge updates.
- Admin dismisses false positive: excluded reviews can become valid again.

## Effort Estimate

| Phase | Estimate |
|---|---:|
| Protected coin ledger | 1.5-2 weeks |
| Escrow + tier + review | 2-3 weeks |
| Risk review + holds | 1.5-2 weeks |
| Frontend polish + regression testing | 1-1.5 weeks |
| Total | 6-8.5 weeks |

## Key Assumptions To Validate

- [ ] Student still feels rewarded even if initial/reward coins are not cash-backed.
- [ ] Teacher accepts that promo-backed purchases produce non-withdrawable credits.
- [ ] Admin revenue reporting is clearer with structured ledger than current transaction description parsing.
- [ ] Risk score catches obvious abuse without overwhelming admin with false positives.
- [ ] Escrow refund does not reduce student willingness to buy.

## Open Questions

- Should reward coins ever become partially withdrawable after a student reaches a trust threshold?
- Should teacher dashboard show total balance split into withdrawable and promo, or keep promo wording softer?
- Should paid-backed coins be spent before bonus coins, or should bonus coins be spent first for better student UX? Current recommendation spends paid first to preserve source accounting for teacher earnings, but this is product-sensitive.
- Should `ESCROW_OPERATION_FEE_PERCENT` default to 1 or 0 for the first pilot?
