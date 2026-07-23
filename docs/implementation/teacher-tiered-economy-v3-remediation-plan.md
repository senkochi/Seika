# Teacher Tiered Economy V3 - Remediation Plan

**Date:** 2026-07-15  
**Goal:** Close the confirmed gaps between `teacher-tiered-economy-v3.md` and the current implementation, prioritizing go-live blockers before UX polish and cleanup.

## Priority Order

1. Restore runtime reachability and operational correctness.
2. Fix financial accounting and wallet enforcement.
3. Complete risk review automation and admin decisions.
4. Complete student/teacher marketplace UX.
5. Harden event reliability and remove legacy drift.

## Phase 0 - Infrastructure Blockers

### 0.1 Add Marketplace Gateway Route

Files:

- `src/api-gateway/src/main/resources/application.yaml`

Change:

- Add a route:

```yaml
- id: marketplace-route
  uri: lb://MARKETPLACE-SERVICE
  predicates:
    - Path=/api/marketplace/**,/api/marketplace
```

Acceptance criteria:

- Frontend calls using `/api/marketplace/...` route to marketplace-service through gateway port `8080`.
- Swagger/OpenAPI aggregation remains unchanged.

### 0.2 Add Flashcard Eureka Client Config

Files:

- `src/config-service/src/main/resources/configs/flashcard-service.yaml`

Change:

- Add `eureka.client.service-url.defaultZone: ${EUREKA_SERVER_URL}` and align with other services' discovery config.

Acceptance criteria:

- Gateway `lb://FLASHCARD-SERVICE` route can resolve flashcard-service.
- Flashcard service registers consistently in Eureka.

## Phase 1 - Wallet Enforcement And Accounting

### 1.1 Implement Wallet Freeze / Unfreeze

Files:

- `src/services/wallet-service/src/main/java/com/cardy/walletService/service/WalletService.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/consumer/CollusionEventConsumer.java`
- Optional admin controller for manual unfreeze.

Change:

- Add `applyFreeze(userId, reason, sourceFlagId, createdBy)` and `removeFreeze(userId, reason, adminId)`.
- Set `Wallet.frozen = true` for both buyer and seller when a collusion event status is `MALICIOUS`.
- Preserve `WASH_HOLD` behavior for `CONFIRMED`.
- Write `WALLET_FREEZE` / `WALLET_UNFREEZE` ledger entries.

Acceptance criteria:

- `MALICIOUS` freezes buyer and seller wallets.
- Frozen wallet cannot spend, top up, cash out, receive rewards, or receive escrow release credit.
- User can still log in and read status.
- Unit tests cover the freeze operation matrix.

### 1.2 Make Hold Duration Config-Driven

Files:

- `CollusionFlaggedEvent` in marketplace and wallet event packages.
- `CollusionFlagService`.
- `CollusionEventConsumer`.

Change:

- Prefer adding `holdDays` or `expiresAt` to `collusion.flagged` payload.
- Marketplace reads `WASH_HOLD_DAYS` from `MarketplaceConfigService`.
- Wallet consumer uses payload value instead of hardcoded 30 days.

Acceptance criteria:

- Changing `WASH_HOLD_DAYS` changes newly created holds without wallet-service code changes.

### 1.3 Fix Admin Revenue Stats

Files:

- `AdminRevenueStatsDTO`
- `AdminRevenueService`
- `src/web-app/src/pages/admin/AdminRevenue.tsx`

Change:

- Add plan fields:
  - `realRevenueVnd`
  - `paidBackedFeeCoins`
  - `promoSinkCoins`
  - `cashOutLiabilityVnd`
  - `withdrawableCoinCirculation`
  - `nonWithdrawableCoinCirculation`
- Aggregate `PLATFORM_FEE_REAL` and `PLATFORM_FEE_PROMO_SINK` ledger rows.
- Compute liability from `sum(earnedWithdrawableBalance) * WITHDRAWAL_VND_PER_COIN`.
- Treat non-withdrawable balances as app liability/coin circulation, not cash-out liability.

Acceptance criteria:

- Promo-backed fee is displayed as sink, not real revenue.
- Liability matches only withdrawable balance.
- Existing top-up/withdrawal totals can remain as secondary diagnostics.

### 1.4 Decide Wallet `heldBalance` Semantics

Files:

- `WalletService`
- Marketplace escrow event flow if wallet-level held accounting is retained.

Change:

- Either remove `heldBalance` from teacher-facing primary semantics and rely on marketplace seller escrows, or update it transactionally when escrow is created/released/refunded.

Acceptance criteria:

- Teacher wallet does not show misleading pending balance.
- One source of truth is documented.

Implementation note, 2026-07-16:

- Phase 1 keeps marketplace seller escrows as the source of truth for pending escrow balance. Wallet `heldBalance` remains a legacy/exposed field and must not be used as the teacher-facing pending escrow number until a later wallet-led hold accounting design is added.

## Phase 2 - Risk Review And Admin Decisions

### 2.1 Add Scheduled Risk Scan Job

Files:

- New job class in marketplace-service, for example `CollusionRiskScanJob`.
- `CollusionFlagService`.
- Repositories for escrow/order/inventory/review data.

Change:

- Run daily/off-peak.
- Compute risk by teacher/buyer pair over `COLLUSION_LOOKBACK_DAYS`.
- Use config keys:
  - `COLLUSION_RISK_THRESHOLD`
  - `COLLUSION_TX_THRESHOLD`
  - `COLLUSION_PROMO_BACKED_RATIO_THRESHOLD`
  - `COLLUSION_NO_CONSUME_RATIO_THRESHOLD`
- Define and implement `reviewVelocityAbnormal`.

Acceptance criteria:

- Risk flags are created without manual method calls.
- Existing active flags are not duplicated.
- Linked valid reviews move to `PENDING_RISK_REVIEW`.

### 2.2 Make Tier Thresholds Config-Driven

Files:

- `MarketplaceConfigService`
- `TeacherRatingService`

Change:

- Seed missing config keys:
  - `TIER_CONSUME_RATE_MIN`
  - `TIER_REFUND_RATE_MAX`
  - `TIER_APPROVAL_REJECTION_RATE_MAX`
- Replace hardcoded threshold checks with parsed config values.

Acceptance criteria:

- Tier calculation still matches default V3 values.
- Admin config changes affect future recomputes.

### 2.3 Add Admin Partial Refund

Files:

- `EscrowController`
- `EscrowService`
- wallet refund command/event DTOs if partial source restoration is needed.
- Admin frontend risk/pending-decision UI.

Change:

- Implement `POST /api/marketplace/admin/order-items/{id}/partial-refund`.
- Require amount/reason.
- Restore source buckets proportionally or by explicit source amounts.
- Record `AdminActionLog`.

Acceptance criteria:

- Admin can issue partial refund after consumed content or admin decision.
- Escrow/order item state clearly records partial refund outcome.
- Duplicate command does not double refund.

### 2.4 Add Collusion Flag Detail API

Files:

- `AdminCollusionController`

Change:

- Add `GET /api/marketplace/admin/collusion-flags/{id}`.

Acceptance criteria:

- Admin UI can deep-link to one flag.
- Missing flag returns a clear 404-style error.

## Phase 3 - Student Marketplace UX

### 3.1 Add Product Detail Backend And Frontend

Files:

- `ProductController`
- `marketplace.ts`
- `routes.tsx`
- New `ProductDetail.tsx`

Change:

- Expose `GET /api/marketplace/products/{id}`.
- Add `marketplaceApi.getProductById`.
- Add student route such as `/student/dashboard/marketplace/:id`.
- Show product details, teacher tier/rating, buy action, and review list.

Acceptance criteria:

- Product detail page works from direct URL and listing click.
- Unpublished/inactive product is not visible to normal students.

### 3.2 Wire Review Submit And Review List

Files:

- `marketplace.ts`
- Product detail page/components.

Change:

- Add `submitReview` and `getProductReviews`.
- Render valid reviews.
- Show review form only when purchase eligibility is met.

Acceptance criteria:

- Verified buyer can submit one review per product.
- `PENDING_RISK_REVIEW` behavior is handled without confusing the user.
- Teacher tier recomputes after valid review.

### 3.3 Wire Self-Service Refund UI

Files:

- Student marketplace/order/escrow UI.
- `marketplace.ts` already has `requestRefund`.

Change:

- Add buyer escrow/order panel.
- Show refund action only for eligible held, unconsumed purchases.
- Explain admin-only path after content is consumed.

Acceptance criteria:

- Student can request eligible refund without admin.
- Refunded inventory disappears or is clearly revoked.

### 3.4 Show Teacher Tier/Rating On Listing Cards

Files:

- `src/web-app/src/pages/student/Marketplace.tsx`
- Optional existing card components under `src/web-app/src/components/student`.

Change:

- Render `teacherTier`, `teacherAverageRating`, and `teacherValidReviewCount`.
- Prefer a compact badge suitable for marketplace cards.

Acceptance criteria:

- Student can see teacher trust signal before buying.
- No extra frontend fan-out is introduced.

## Phase 4 - Teacher Wallet And Profile Display

### 4.1 Fix Teacher Wallet Wording

Files:

- `TeacherWalletHeader.tsx`
- `SellerEscrowPanel.tsx`

Change:

- Use the plan wording:
  - `Có thể rút`
  - `Chỉ dùng trong app`
  - `Đang chờ escrow`
- Keep total balance secondary.

Acceptance criteria:

- Teacher wallet primary cards match V3 wording.

### 4.2 Add Hold/Freeze Visibility

Files:

- `wallet.ts`
- `TeacherWallet.tsx` or wallet components.

Change:

- Add `walletService.getMyHolds`.
- Render active holds with reason and expiry.
- Render frozen state from balance breakdown.

Acceptance criteria:

- Teacher understands why cash-out or wallet operations are blocked.

### 4.3 Consume `teacher.tier.updated` In Profile Service

Files:

- profile-service RabbitMQ config and consumer package.
- Profile model/DTO if tier display fields are not present.

Change:

- Add consumer for marketplace `teacher.tier.updated`.
- Update teacher profile display tier/rating fields only; do not recompute tier in profile-service.

Acceptance criteria:

- Marketplace remains source of truth.
- Profile display updates after marketplace tier changes.

## Phase 5 - Event Reliability And Cleanup

### 5.1 Add Wallet Outbox For Financial Result Events

Files:

- wallet-service domain/repository/processor.
- `WalletEventListener` publishing paths.

Change:

- Persist outbox records for `wallet.debit.succeeded/failed`, `wallet.credit.succeeded/failed`, and `wallet.refund.succeeded/failed`.
- Publish asynchronously with retry.

Acceptance criteria:

- Wallet DB commit and event publish are no longer split-brain.
- Marketplace inbox idempotency continues to absorb duplicates.

### 5.2 Move `collusion.flagged` To Marketplace Outbox

Files:

- `CollusionFlagService`
- Marketplace outbox processor/routing.

Change:

- Persist collusion event through outbox instead of direct `RabbitTemplate.convertAndSend`.

Acceptance criteria:

- Confirmed/malicious decisions retry until wallet-service receives them.

### 5.3 Remove Or Document Legacy Wallet Endpoints

Files:

- `WalletController`
- Frontend wallet API usage.

Change:

- Decide whether `/withdraw`, `/deposit`, and `/history` are supported legacy APIs.
- Prefer replacing frontend history with ledger endpoint if admin/user ledger is formalized.

Acceptance criteria:

- V3 wallet API surface matches documentation or explicitly documents legacy endpoints.

## Suggested Test Coverage

- Wallet freeze/unfreeze operation matrix.
- `MALICIOUS` collusion event freezes both buyer and seller.
- `CONFIRMED` collusion event creates teacher `WASH_HOLD` only.
- Revenue stats split real revenue, promo sink, withdrawable liability, and non-withdrawable circulation.
- Scheduled risk scan creates one flag per suspicious teacher/buyer pair.
- Product detail endpoint hides inactive/unpublished product.
- Review submit/list from frontend API contract.
- Self-service refund UI happy path and consumed-content blocked path.
- Gateway route smoke test for `/api/marketplace/products`.
- Flashcard service registration smoke test.
