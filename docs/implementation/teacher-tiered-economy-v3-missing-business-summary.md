# Teacher Tiered Economy V3 - Missing Business Capabilities Summary

**Date:** 2026-07-15  
**Basis:** Double-check of `docs/implementation/teacher-tiered-economy-v3-audit.md` against the current codebase and the original plan in `docs/ideas/teacher-tiered-economy-v3.md`.

## Double-check Result

The major gaps listed in the audit are valid. The most important confirmed blockers are:

- API Gateway has no runtime route for `/api/marketplace/**`, so marketplace calls through the gateway cannot work.
- `flashcard-service` config has no Eureka client settings, so gateway load-balancing to `FLASHCARD-SERVICE` is at risk.
- Phase 3 malicious-risk behavior is incomplete: `Wallet.frozen` exists but no service path sets it, and `MALICIOUS` collusion actions only create a teacher `WASH_HOLD`.
- Admin revenue reporting does not match the V3 business model. It still reports legacy totals and does not separate real revenue, promo sink, withdrawable liability, and non-withdrawable circulation.
- Risk review detection exists as service logic but has no scheduled production job.
- Student marketplace UI is still missing key business flows: product detail, reviews, refund, and visible teacher tier/rating.
- Admin partial refund and collusion-flag detail APIs are missing.

Some audit points need more precise wording:

- Spend order is `BONUS -> REWARD -> PAID -> EARNED_PROMO`. This differs from the original V3 plan's 3-bucket text but matches the later Phase 1 implementation direction to keep `EARNED_PROMO` spendable while non-withdrawable.
- `TeacherRatingService` already computes `consumeRate`, `refundRate`, and `approvalRejectionRate`; the real gap is that thresholds are hardcoded and not driven by the Phase 3 config keys.
- `GET /api/wallet/holds/me` exists on the backend. The missing piece is the frontend client/UI.
- Backend review APIs exist. The missing piece is frontend integration.
- Teacher seller escrow UI exists. The remaining gaps are correct Vietnamese wording, hold/freeze visibility, and reliable wallet-level `heldBalance` accounting.

## Missing Business Capabilities

### 1. Marketplace Is Not Reachable Through Gateway

Plan expectation: users and frontend access marketplace APIs through the gateway.

Current state:

- `src/api-gateway/src/main/resources/application.yaml` has OpenAPI aggregation for marketplace, but no route with `Path=/api/marketplace/**`.
- `src/web-app/src/api/services/marketplace.ts` calls `/marketplace/...`, which relies on the API client's `/api` prefix and therefore needs gateway route `/api/marketplace/**`.

Business impact:

- Student marketplace, admin marketplace risk, review, escrow, and product APIs can fail in the normal gateway-based environment.

### 2. Flashcard Service Discovery Is Incomplete

Plan expectation: gateway routes can reach flashcard service via service discovery.

Current state:

- `src/config-service/src/main/resources/configs/flashcard-service.yaml` has app, MongoDB, Feign, and RabbitMQ config, but no `eureka.client.service-url.defaultZone`.
- Gateway route uses `lb://FLASHCARD-SERVICE`.

Business impact:

- Flashcard pages and content-consumed flows may fail through the gateway, which indirectly affects marketplace consumption/refund behavior.

### 3. Malicious Collusion Does Not Freeze Wallets

Plan expectation:

- `CONFIRMED` wash trading creates teacher `WASH_HOLD`.
- `MALICIOUS` freezes buyer and seller wallets.
- `FROZEN` blocks spend, top-up, cash-out, reward credit, and escrow release credit.

Current state:

- `Wallet.frozen` exists and wallet operations check it.
- No `applyFreeze` / `removeFreeze` service methods exist.
- `CollusionEventConsumer` treats `CONFIRMED` and `MALICIOUS` the same: it places `WASH_HOLD` only on the teacher.
- Buyer wallet is not affected by malicious action.

Business impact:

- Admin marking a collusion pair as malicious does not actually stop the abusive buyer/seller wallet operations promised by the plan.

### 4. Wallet Holds Are Only Partially Surfaced

Plan expectation:

- `WASH_HOLD` blocks cash-out.
- Users can see hold/freeze status.

Current state:

- Backend `GET /api/wallet/holds/me` exists.
- `WalletHoldService.canCashOut` blocks cash-out for active holds.
- Frontend `walletService` has no `getMyHolds`.
- Teacher wallet screen does not show active holds or freeze reason.
- `WASH_HOLD_DAYS` is hardcoded to 30 in wallet consumer instead of coming from marketplace config or event payload.

Business impact:

- Teacher can be blocked from cash-out without a clear in-app explanation.
- Admin-configured hold duration is not honored.

### 5. Revenue Reporting Does Not Match V3 Accounting

Plan expectation:

- Admin dashboard separates `realRevenueVnd`, `paidBackedFeeCoins`, `promoSinkCoins`, `cashOutLiabilityVnd`, `withdrawableCoinCirculation`, and `nonWithdrawableCoinCirculation`.

Current state:

- `AdminRevenueStatsDTO` exposes `netRevenueVnd`, `totalCoinCirculation`, `potentialLiabilityVnd`, and `guaranteedProfitVnd`.
- `AdminRevenueService` calculates liability from total wallet balance, including non-withdrawable buckets.
- Ledger entries for `PLATFORM_FEE_REAL` and `PLATFORM_FEE_PROMO_SINK` exist, but revenue stats do not aggregate them.

Business impact:

- Admin cannot distinguish real revenue from promo coin sink.
- Cash-out liability is overstated and does not reflect only `earnedWithdrawableBalance`.

### 6. Risk Review Is Not Automated

Plan expectation:

- A daily job scans 30-day behavior and creates `CollusionFlag` records when risk score crosses threshold.

Current state:

- `CollusionFlagService.detectAndFlagCollusion(...)` exists.
- No scheduled scanner calls it in production.
- Risk thresholds are hardcoded in `computeRiskScore`.
- `COLLUSION_LOOKBACK_DAYS` exists in config but detection uses `now.minus(30, DAYS)`.
- `reviewVelocityAbnormal` is passed as a boolean but no concrete threshold calculation exists.

Business impact:

- Admin risk dashboard can only act on flags created manually/test-wise. Real abuse may never be flagged.

### 7. Teacher Tier Display Sync Is Incomplete

Plan expectation:

- Marketplace is the source of truth for `TeacherRating`.
- Profile service consumes `teacher.tier.updated` for teacher display.

Current state:

- Marketplace publishes `teacher.tier.updated`.
- No confirmed profile-service consumer was found for this event.
- Product denormalization in marketplace is present, but profile display can drift.

Business impact:

- Tier displayed in teacher profile surfaces can become stale or absent even if marketplace rating changes.

### 8. Student Marketplace Experience Is Missing Core Flows

Plan expectation:

- Product listing shows teacher tier/rating.
- Student can open product detail, see reviews, buy, request eligible refund, and submit review after purchase.

Current state:

- Product listing and buy are wired.
- Backend has review create/list APIs.
- Backend has self-service refund API.
- Frontend marketplace page has no product detail route/page.
- Frontend marketplace client has no `getProductById`, `submitReview`, or `getProductReviews`.
- Frontend cards do not render `teacherTier`, `teacherAverageRating`, or `teacherValidReviewCount`.
- No student refund UI was found.

Business impact:

- Teacher tier/rating is not visible at the buying decision point.
- Review loop and refund loop are backend-only, so normal users cannot complete them.

### 9. Product Detail API Is Missing

Plan expectation:

- `GET /api/marketplace/products/{id}` exists.

Current state:

- `ProductService.getActiveProductById` exists.
- `ProductController` does not expose `GET /{id}`.

Business impact:

- A proper product detail page cannot be built without duplicating list state or calling internal service logic.

### 10. Admin Manual Resolution Is Missing Two Capabilities

Plan expectation:

- Admin can full refund, partial refund, no refund, or force release.
- Admin can view a specific collusion flag detail.

Current state:

- Full refund, force release, and no refund exist.
- `POST /api/marketplace/admin/order-items/{id}/partial-refund` is missing.
- `GET /api/marketplace/admin/collusion-flags/{id}` is missing.

Business impact:

- Admin cannot choose proportional compensation for consumed/partial-quality disputes.
- Admin dashboard cannot support a detail page or deep link for one risk flag.

### 11. Teacher Wallet Wording And Pending Balance Are Not Fully V3-Compliant

Plan expectation:

- Teacher wallet must use clear Vietnamese wording:
  - `Co the rut` with Vietnamese diacritics: `Co the rut` should be corrected to `Có thể rút`.
  - `Chi dung trong app` should be corrected to `Chỉ dùng trong app`.
  - `Dang cho escrow` should be corrected to `Đang chờ escrow`.
- `heldBalance` / escrow pending should accurately reflect in-flight marketplace earnings.

Current state:

- Teacher wallet UI uses mixed English/ASCII labels in the most visible cards.
- Seller escrow panel calculates pending escrow from marketplace escrows.
- Wallet `heldBalance` exists but is not programmatically updated by escrow creation/release/refund.

Business impact:

- Teacher-facing money semantics are less clear than the plan requires.
- Wallet-level pending balance can be misleading.

### 12. Event Reliability Is Inconsistent

Plan expectation:

- Financial state transitions use outbox/inbox and idempotency.

Current state:

- Marketplace uses outbox/inbox for wallet debit/credit/refund commands and wallet results.
- Wallet publishes `wallet.debit.succeeded`, `wallet.credit.succeeded`, and `wallet.refund.succeeded` directly through RabbitMQ after DB work.
- `collusion.flagged` is also published directly, not through outbox.

Business impact:

- A crash or broker issue can leave marketplace escrow state waiting forever after wallet-side state changed.
- A confirmed/malicious risk decision can persist without the wallet hold/freeze event being delivered.
