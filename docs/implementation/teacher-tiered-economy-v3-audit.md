# Seika Teacher Tiered Economy V3 — Comprehensive Audit

**Scope:** Cross-stack audit of `docs/ideas/teacher-tiered-economy-v3.md` against the current state of the codebase (backend + frontend). Each finding is tagged with file:line evidence.
**Author:** Audit task, 2026-07-15.
**Phase coverage:** Phase 1 (Protected ledger + content safety hooks) · Phase 2 (Escrow + tier + review) · Phase 3 (Risk review + holds).

---

## 0. Scoreboard (TL;DR)

| Domain | Status | Comment |
| --- | --- | --- |
| Phase 1 — protected ledger (wallet) | ✅ Complete | 4-bucket allocation; cash-out guarded; frozen block works. |
| Phase 1 — R1/R2/R3 content safety hooks (marketplace) | ✅ Complete | Hard delete returns 409, R1/R2 update both `OrderItem` and `EscrowTransaction`. |
| Phase 2 — escrow release / refund / inbox-outbox | ✅ Mostly | Self-service refund, admin refund/force-release/no-refund all wired. `partial-refund` not implemented. |
| Phase 2 — review + tier + denormalization | ⚠️ Mostly | `TeacherRating` recomputed on review; `teacher.tier.updated` published; **`teacher.tier.updated` has no consumer anywhere** (profile-service deferred per Phase-2 follow-up note). |
| Phase 2 — content consumed events | ✅ Complete | flashcard/quiz publish `*.set.consumed`; marketplace sets `consumedAt`. |
| Phase 3 — `CollusionFlag` + admin endpoints + risk score | ⚠️ Mostly | Entity, formula, admin endpoints all present. **No `@Scheduled` job**; risk score never runs in prod. |
| Phase 3 — `WalletHold` + `FROZEN` | ❌ Broken | `applyFreeze`/`removeFreeze` do not exist. `Wallet.frozen` column is **never programmatically set**. WASH_HOLD works (blocks cash-out) but no freeze ever happens. |
| Phase 3 — admin revenue split (realRevenue / paidBackedFee / promoSink / liability) | ❌ Broken | `AdminRevenueStatsDTO` is missing 5 of 6 plan fields; conflates real revenue with promo sink; overstates cash-out liability by using total coin circulation. |
| Cross-cutting — API gateway routes | ❌ Broken | **No `/api/marketplace/**` route in gateway** — frontend cannot reach marketplace through `localhost:8080`. |
| Cross-cutting — flashcard-service Eureka | ❌ Broken | `flashcard-service.yaml` has no Eureka client config → `lb://FLASHCARD-SERVICE` route fails. |
| Frontend — admin surfaces | ✅ Mostly | AdminRevenue, AdminSystemConfig, AdminMarketplaceRiskPanel, AdminContentModeration, AdminUsers all wire to real backend calls. |
| Frontend — student marketplace | ⚠️ Partial | Listing + buy + my-orders wired. **No review submit/list UI; no refund UI; no product detail; no archive; no teacher-tier badge on cards.** |
| Frontend — teacher wallet split view | ⚠️ Partial | Backed by `getBalanceBreakdown`, but **mandatory Vietnamese diacritic wording is broken in the most-visible card** (ASCII-only "Co the rut", "Chi dung trong app", "Dang cho escrow"). |
| Frontend — wallet holds (Phase 3) | ❌ Missing | No client, no UI, no route. |

**Headline number:** Out of 23 plan user-visible features in the web-app, **9 are fully integrated, 7 are partially wired (backend ready but UI missing or UI without consumer), and 7 are missing on both sides.** Critical: Phase 3 risk-review and freeze logic is half-built (entities exist, freeze never executes, no scheduled risk-scan job).

---

## 1. Wallet Service — Detailed Findings

### 1.1 Entity & ledger
- `Wallet` (`src/services/wallet-service/src/main/java/com/cardy/walletService/domain/Wallet.java`) carries `bonusBalance, rewardBalance, paidBalance, earnedWithdrawableBalance, earnedPromoBalance, heldBalance, frozen` ✅. `recalculateBalance()` (L63-75) sums spendable buckets; excludes `heldBalance` — matches plan.
- `WalletLedgerEntry` (`.../domain/WalletLedgerEntry.java`) has all V3 fields. `description` column at L82 is `length=1000` (plan does not specify length; ok). Indexes on `wallet_id, user_id, order_id, idempotency_key` ✅.
- `wallet_idempotency_keys` table (`.../domain/WalletIdempotencyKey.java`) — PK is `idempotency_key` itself ✅.

### 1.2 Source allocator — discrepancy with plan
- Spend order in code (`WalletSourceAllocator.java:22-26`): `BONUS → REWARD → PAID → EARNED_PROMO` (4 buckets).
- Plan v3.md D3 lists `BONUS → REWARD → PAID` (3 buckets). The Phase 1 implementation doc explicitly extends it to 4 buckets to keep `EARNED_PROMO` spendable.
- **Resolution:** This is an intentional extension documented in `teacher-tiered-economy-v3-phase1-implementation.md` (L40-46). Code follows Phase 1 impl doc; plan v3.md D3 is the older 3-bucket version. Plan and impl-doc diverge; code is internally consistent with the impl doc.
- `EARNED_PROMO` lineage preserved: `creditEscrowRelease` writes `EARNED_PROMO` ledger only when `teacherPromoAmount > 0` (`WalletService.java:349`). Verified for non-withdrawable resale invariant.

### 1.3 Wallet APIs

| Endpoint | Plan required | Implemented? | File:line | Notes |
| --- | --- | --- | --- | --- |
| `GET /api/wallet/balance` | Yes | Yes | `WalletController.java:27-32` | Returns raw `BigDecimal`; no `ApiResponse` wrapper. |
| `GET /api/wallet/balance/breakdown` | Yes | Yes | `WalletController.java:34-38` | |
| `GET /api/wallet/holds/me` | Yes | Yes | `WalletHoldController.java:23-27` | |
| `POST /api/wallet/top-up` | Yes | Yes | `WalletController.java:57-64` | `@PreAuthorize("hasRole('STUDENT')")` — **teachers cannot top-up**. |
| `POST /api/wallet/cash-out` | Yes | Yes | `WalletController.java:40-47` | `@PreAuthorize("hasRole('TEACHER')")`. |
| `GET /api/wallet/admin/ledger` | Yes | **MISSING** | — | No `admin/ledger` route. Closest is `AdminRevenueController.getSystemTransactions(type)` (`AdminRevenueController.java:29-35`) at `/api/wallet/admin/transactions` — wrong path and no filter structure. |
| `GET /api/wallet/admin/revenue-stats` | Yes | Yes | `AdminRevenueController.java:22-27` | |

**Endpoints that exist but plan does NOT require (dead code / scope creep):**
- `POST /api/wallet/withdraw` (`WalletController.java:49-55`) — no role guard; calls `walletService.spend(...)` (functionally equivalent to `debitPurchase`). Pre-V3 leftover.
- `POST /api/wallet/deposit` (`WalletController.java:66-73`) — `@PreAuthorize("hasRole('ADMIN')")`; admin top-up helper. Not in plan.
- `POST /api/wallet/history` (`WalletController.java:75-79`) — returns legacy `Transaction` entity list, not `WalletLedgerEntry`.
- `GET /api/wallet/admin/configs` and PUT `/api/wallet/admin/configs/{key}` — duplicates plan's marketplace admin configs.
- `GET /api/wallet/admin/total-circulation` (`AdminConfigController.java:56-64`).
- `GET /api/wallet/configs` (`SystemConfigPublicController.java:20-23`) — public, returns all `SystemConfig`.

### 1.4 Event consumers

| Consumer | File:line | Idempotency | Notes |
| --- | --- | --- | --- |
| `wallet.debit.requested` | `WalletEventListener.java:53-79` | DB-unique `wallet_idempotency_keys` (`WalletService.java:234`) | Debits `BONUS → REWARD → PAID → EARNED_PROMO`. |
| `wallet.credit.requested` | `WalletEventListener.java:81-99` | DB-unique (line 327) | `idempotencyKey` mandatory (`WalletService.java:452-456`). |
| `wallet.refund.requested` | `WalletEventListener.java:101-118` | DB-unique (line 397) | `counterpartyUserId` left null on refund ledger entries (line 448) — schema deviation. |
| `wallet.hold.requested` | **NOT IMPLEMENTED** | n/a | Phase 3 expectation broken. |
| `wallet.freeze.requested` | **NOT IMPLEMENTED** | n/a | Phase 3 expectation broken. |
| `content.purchased` | `WalletEventListener.java:120-128` | n/a (logging only) | Correct per Phase 2: teacher credit removed; logging-only. |
| `reward.granted` | `RewardEventConsumer.java:13-37` | **NONE** | `processReward` directly credits `REWARD` without de-duplication — duplicate events double-credit. |
| Legacy `learnReward` | `WalletConsumer.java:17-37` | **NONE** | Hardcoded `BigDecimal.valueOf(20)`; uses `System.out.println` (violates `CODING_STANDARDS.md`). |

### 1.5 Outbox / publisher
- **No transactional outbox in wallet-service** — `WalletEventListener.publishWalletEvent` (L196-204) calls `rabbitTemplate.convertAndSend(...)` directly. D13 (plan) requires outbox/inbox; marketplace-service has outbox/inbox, but wallet-service publish is not transactional with the ledger write.
- `wallet.debit.succeeded` payload (`WalletDebitEvent` L12-36): `eventId, eventType, idempotencyKey, orderId, buyerUserId, totalAmount, sourceBreakdown{bonusAmount,rewardAmount,paidAmount,earnedPromoAmount,promoBackedAmount}, ledgerEntryIds, occurredAt`. Plan fields all present (Phase 1 impl doc added `earnedPromoAmount` and `promoBackedAmount`).
- `wallet.credit.succeeded` and `wallet.refund.succeeded` payloads (`publishEscrowResult`/`publishRefundResult` L157-194): full Phase-2 contracts. ✅

### 1.6 Hold/Freeze — broken
- `WalletHold` entity (`WalletHold.java`) has `userId, holdType (free-form String), reason, sourceFlagId, createdBy, expiresAt, active, createdAt` ✅.
- `WASH_HOLD` block matrix:
  - Blocks cash-out: ✅ (`WalletHoldService.canCashOut` L22-32).
  - Blocks spend: **NO** — `WalletSourceAllocator.allocatePurchase` checks only `wallet.isFrozen()`; never calls hold service.
  - Blocks top-up: **NO** — `WalletService.topUp` (L191-214) checks only `requireActive`.
- `FROZEN` block matrix:
  - Blocks cash-out: ✅ (allocator line 36 → `requireActive`).
  - Blocks spend: ✅ (allocator line 18).
  - Blocks top-up: ✅ (`creditBalance` L84).
  - Blocks reward credit: ✅.
  - Blocks escrow release credit: ✅.
- **`applyFreeze` and `removeFreeze` methods do not exist.** No code path ever sets `Wallet.frozen = true`. Plan Phase 3 says `MALICIOUS` flag should set buyer/seller wallets to `FROZEN` (v3.md L549); implementation only places `WASH_HOLD` (`CollusionEventConsumer.java:36`). **Frozen column is effectively unused.**
- `WASH_HOLD_DAYS` hardcoded to 30 in `CollusionEventConsumer.java:35` — D19 violation (plan says read via Feign or event; no `MarketplaceClient` exists in wallet-service).

### 1.7 Admin revenue-stats — broken
`AdminRevenueStatsDTO` is missing 5 of 6 plan-required fields:

| Plan field | Implemented? | Code field | Issue |
| --- | --- | --- | --- |
| `realRevenueVnd` | partial | `netRevenueVnd = totalTopupVnd - totalWithdrawalVnd` | Conflates real revenue with promo sink. |
| `paidBackedFeeCoins` | ❌ missing | — | `PLATFORM_FEE_REAL` ledger rows exist (`WalletService.java:354-358`) but not summed in `AdminRevenueService`. |
| `promoSinkCoins` | ❌ missing | — | `PLATFORM_FEE_PROMO_SINK` rows exist but not summed. |
| `cashOutLiabilityVnd` | partial | `potentialLiabilityVnd = totalCoinCirculation * currentWithdrawalRate` | **Wrong semantics**: plan says `sum(earnedWithdrawableBalance) * WITHDRAWAL_VND_PER_COIN`; code uses total coin circulation including non-withdrawable buckets → overstates liability. |
| `withdrawableCoinCirculation` | ❌ missing | — | Plan requires summing only `earnedWithdrawableBalance`. |
| `nonWithdrawableCoinCirculation` | ❌ missing | — | Plan requires summing `bonus + reward + paid + earnedPromo`. |

### 1.8 Tests
- `WalletSourceAllocatorTest`: 6 tests (spend order, earnedPromo fallback, insufficient balance, cash-out only withdrawable, frozen purchase reject, frozen cash-out reject). ✅ Covers D3 + frozen block matrix.
- `WalletHoldServiceTest`: 2 tests (active WASH_HOLD blocks, expired allows). ✅
- **Missing tests:** non-withdrawable resale lineage, admin revenue-stats separation, event-payload contracts, idempotency double-handle.

---

## 2. Marketplace Service — Detailed Findings

### 2.1 Entities — all present
| Entity | Status | Notable |
| --- | --- | --- |
| `OrderItem` (`entity/OrderItem.java`) | ✅ | All 9 V3 escrow fields present. `EscrowState` enum matches plan exactly: `NONE/HELD/PENDING_ADMIN_DECISION/CANCELLED_BY_ADMIN/RELEASED/REFUNDED`. |
| `UserInventory` (`entity/UserInventory.java`) | ✅ | `consumedAt, revocationReason, sourceOrderId` present. |
| `EscrowTransaction` | ✅ | All V3 fields + Phase-2 `earnedPromoBackedAmount` addition. |
| `Review` (`entity/Review.java`) | ✅ | `VALID/PENDING_RISK_REVIEW/EXCLUDED_WASH/DELETED_BY_ADMIN`. |
| `TeacherRating` (`entity/TeacherRating.java`) | ✅ | Phase 2 (avgRating, validReviewCount, tier, tierFeePercent) **AND** Phase 3 (consumeRate, refundRate, approvalRejectionRate) all present. |
| `CollusionFlag` | ✅ | All fields incl. `lookbackStart/End, lastEvaluatedAt`. |
| `AdminActionLog` | ✅ | |
| `MarketplaceConfig` | ✅ | |

### 2.2 API endpoints

| Endpoint | Plan | Implemented | File:line | Notes |
| --- | --- | --- | --- | --- |
| `GET /api/marketplace/products` | Yes | Yes | `ProductController.java:19-27` | Returns raw `Product` entity (not a DTO) — D16 fan-out plan still satisfied via denormalization. |
| `GET /api/marketplace/products/{id}` | Yes | **MISSING** | — | `ProductService.getActiveProductById` exists, no controller endpoint. |
| `POST /api/marketplace/orders` | Yes | Yes | `OrderController.java:38-56` | |
| `GET /api/marketplace/escrows/me` | Yes | Yes | `EscrowController.java:23-26` | |
| `POST /api/marketplace/escrows/{escrowId}/refund` | Yes | Yes | `EscrowController.java:33-36` | |
| `POST /api/marketplace/reviews` | Yes | Yes | `ReviewController.java:25-28` | **No frontend client** for it (see §4). |
| `GET /api/marketplace/products/{id}/reviews` | Yes | Yes | `ReviewController.java:30-33` | **No frontend client.** |
| `GET /api/marketplace/teachers/{id}/rating` | Yes | Yes | `ReviewController.java:35-38` | Frontend uses it for teacher-side badge only. |
| `POST /api/marketplace/products/{id}/archive` | Yes | Yes | `ProductController.java:38-41` | **No frontend client.** |
| `GET /api/marketplace/admin/configs` | Yes | Yes | `AdminMarketplaceConfigController.java:25-29` | |
| `PUT /api/marketplace/admin/configs/{key}` | Yes | Yes | `AdminMarketplaceConfigController.java:31-37` | |
| `GET /api/marketplace/admin/orders/pending-decision` | Yes | Yes | `EscrowController.java:44-48` | |
| `POST /api/marketplace/admin/order-items/{id}/refund` | Yes | Yes | `EscrowController.java:50-56` | |
| `POST /api/marketplace/admin/order-items/{id}/partial-refund` | Yes | **MISSING** | — | Plan V3 §Flow 6 + Admin APIs list still require it; Phase 2 impl doc said "follow-up". |
| `POST /api/marketplace/admin/order-items/{id}/force-release` | Yes | Yes | `EscrowController.java:58-64` | |
| `POST /api/marketplace/admin/order-items/{id}/no-refund` | Yes | Yes | `EscrowController.java:66-72` | |
| `GET /api/marketplace/admin/collusion-flags?status=` | Yes | Yes | `AdminCollusionController.java:26-38` | |
| `GET /api/marketplace/admin/collusion-flags/{id}` | Yes | **MISSING** | — | Only the action endpoint exists. |
| `POST /api/marketplace/admin/collusion-flags/{id}/action` | Yes | Yes | `AdminCollusionController.java:40-54` | |

**Endpoints that exist in code but NOT in plan (scope creep):**
- `GET /api/marketplace/products/my-products` (ProductController.java:29)
- `DELETE /api/marketplace/products/{productId}` (ProductController.java:43)
- `GET /api/marketplace/inventory/my-items` (InventoryController.java:27)
- `GET /api/marketplace/escrows/seller/me` (EscrowController.java:28)
- `GET /api/marketplace/admin/escrows?status=` (EscrowController.java:38)
- `GET /api/marketplace/admin/products` (+ pending + count-pending) (AdminProductController.java:23/33/41)
- `POST /api/marketplace/admin/products/{id}/approve|reject|hide` (AdminProductController.java:47/54/63)
- `GET /api/marketplace/orders/{orderId}` (OrderController.java:58)
- `GET /api/marketplace/orders/seller/me/revenue|top-products|students` (OrderController.java:70/79/89)

### 2.3 Public DTO (D16)
- `Product` entity exposes `sellerUserId, teacherDisplayName, teacherTier, teacherAverageRating, teacherValidReviewCount` (`entity/Product.java:60-85`).
- Plan says DTO field name should be `teacherUserId`; code uses `sellerUserId`. Functionally equivalent. ⚠️ Cosmetic deviation.
- No dedicated `ProductResponse`/`ProductDto` — entity exposed directly. Plan stated "frontend fan-out avoided" — still satisfied via denormalization.

### 2.4 R1/R2/R3 hooks
- **R1 (teacher edit during HELD):** `ProductEventListener.updateProduct` (`consumer/ProductEventListener.java:82-98`) → `escrowSafetyService.markHeldItemsPendingDecision(product.getId(), "content_edit_by_teacher")` (`service/MarketplaceEscrowSafetyService.java:27-42`). Sets both `OrderItem.escrowState=PENDING_ADMIN_DECISION` AND `EscrowTransaction.status=PENDING_ADMIN_DECISION`. ✅
- **R2 (admin reject/hide during HELD):** `AdminProductService.reject/hide` (`AdminProductService.java:48-71`) → `escrowSafetyService.cancelHeldItemsByAdmin` (`MarketplaceEscrowSafetyService.java:44-60`). Sets both OrderItem + EscrowTransaction to `CANCELLED_BY_ADMIN`; no auto-refund. ✅
- **R3 (hard delete + archive):** `ProductService.hardDelete` (`ProductService.java:73-78`) → `escrowSafetyService.assertHardDeleteAllowed` throws `IllegalStateException`; `GlobalExceptionHandler` maps to **409 Conflict**. ✅ Archive endpoint works.

### 2.5 Escrow lifecycle
- Self-service refund guard (`EscrowService.requestSelfServiceRefund` L140-157): checks all 6 plan conditions (buyer match, HELD status, no credit/refund in flight, no admin decision, inventory active, consumedAt null). ✅
- `wallet.refund.requested` published with idempotency key `escrow:{id}:refund` (L193-214).
- `EscrowReleaseJob` (`EscrowService.java:84-93`): `@Scheduled(fixedDelayString = "${escrow.release.delay-ms:60000}")`; query matches plan exactly. ✅
- `adminFullRefund`, `adminForceRelease`, `adminNoRefund` all implemented. `adminPartialRefund` **MISSING**.
- Escrow marked `RELEASED` only after `wallet.credit.succeeded` (L217-225). ✅ (D13 satisfied)

### 2.6 Refund idempotency — partial
- Marketplace layer does NOT dedupe — relies on wallet-side `wallet_idempotency_keys`. If marketplace outbox publishes a duplicate, `wallet.refund.succeeded` handler will set `refundedAt` again on the second pass. Functionally harmless (idempotent at DB) but timestamp drifts. ⚠️

### 2.7 Teacher Tier (D17)
- `TeacherRatingService.recompute(teacherId)` is the **only** tier computation. `TeacherRatingService.java:185-203` publishes `teacher.tier.updated` on tier change. ✅
- D17 single-owner: profile-service verified NOT to compute tier (`grep` returns zero hits). ✅
- Tier enum `NEWBIE, BRONZE, SILVER, GOLD, ELITE` matches plan. Tier fee schedule matches. Tier thresholds match plan v3.md (Phase 2 MVP): `BRONZE ≥5/3.0`, `SILVER ≥20/3.5`, `GOLD ≥100/4.0`, `ELITE ≥500/4.5`. ⚠️ Phase 3 impl doc claimed different thresholds (`GOLD ≥4.8 / ≥50`); the code follows V3 plan canonical values, **not** the Phase 3 doc — Phase 3 doc is stale.

### 2.8 Phase 3 — Risk Review

| Plan item | Implemented? | Notes |
| --- | --- | --- |
| `CollusionFlag` entity + enum | ✅ | All fields incl. `lookbackStart/End, lastEvaluatedAt`. |
| Risk score formula (25+25+20+15+15) | ✅ | `CollusionFlagService.computeRiskScore` L51-60 matches plan exactly. |
| `@Scheduled` risk-scan job | ❌ **MISSING** | `@EnableScheduling` is present (`MarketplaceServiceApplication.java:8`), but no `@Scheduled` calls `detectAndFlagCollusion`. Function is only called from `CollusionFlagServiceTest`. |
| Config-driven lookback window | ❌ Hardcoded | `CollusionFlagService.java:80` hardcodes `now.minus(30, DAYS)`. `KEY_COLLUSION_LOOKBACK_DAYS` exists in `MarketplaceConfigService` but is never read here. |
| Retroactive review transition in lookback window | ⚠️ | `CollusionFlagService.java:99-107` transitions VALID reviews for the pair to `PENDING_RISK_REVIEW`, but **does not filter by `createdAt` in the lookback window** — affects all-time reviews, not just recent ones. |
| `reviewVelocityAbnormal` definition | ❌ | Boolean parameter; no threshold defined in code or config. |
| `CONFIRM/MARK_MALICIOUS/DISMISS` admin actions | ✅ | All three call `adminActionLogService.logAction`. Idempotent on status transition. |
| `CollusionFlaggedEvent` published to wallet | ⚠️ | `CollusionFlagService.publishEvent` (L204-225) publishes via direct `rabbitTemplate.convertAndSend` (NOT outbox). If RabbitMQ down, publish lost. |
| 5-metric tier thresholds in config | ❌ Missing | `TIER_CONSUME_RATE_MIN`, `TIER_REFUND_RATE_MAX`, `TIER_APPROVAL_REJECTION_RATE_MAX` are **NOT seeded** by `MarketplaceConfigService` (L35-46). Tier calc hardcodes thresholds (`TeacherRatingService.java:127-160`). |

### 2.9 Tests
- `EscrowSafetyRulesTest` (3 tests): edit-during-held, admin-reject-during-held, hard-delete guard.
- `TeacherRatingServiceTest` (3 tests): Phase 2 (rating+count), fee-for-tier, Phase 3 (5-metric).
- `CollusionFlagServiceTest` (3 tests): risk score, detectAndFlag, admin confirm idempotency.
- `ReviewServiceTest` (1 test): `PENDING_RISK_REVIEW` on active flag.
- `ProductServiceTest` (1 test), `WalletDebitEventListenerTest` (2 tests).
- **Missing tests** per plan: source allocation order, mixed-source release split, self-service refund bucket restoration, refund-after-consume admin override, duplicate event idempotency, partial-refund (no impl), 409 hard-delete integration, archive-vs-purchased-access.

---

## 3. Other Backend Services — Detailed Findings

### 3.1 flashcard-service
- `flashcard.set.consumed` publisher (`service/ContentEventPublisher.java:67`) — first progress `> 0` per `(userId, cardSetId)` ✅.
- `flashcard.set.updated` publisher (`ContentEventPublisher.java:45`) — fires after PUT; marketplace consumer calls R1 hook ✅.
- No `wallet.debit.succeeded` consumer (correct — marketplace owns inventory creation).
- `RabbitMQConfig.java:51` declares `wallet.queue` bound to `learn.exchange` fanout — **dead declaration**, no listener.
- ⚠️ `FLASHCARD_SET_UPDATED_ROUTING_KEY` constant is missing — routing key `"flashcard.set.updated"` is hardcoded inline at `ContentEventPublisher.java:58`. Inconsistent with `.created`/`.consumed` constants; refactor hazard.

### 3.2 quiz-service
- Same as flashcard-service. `quiz.set.consumed` fires on first attempt (any score) per `(userId, quizSetId)` (`QuizService.java:266-267`).
- ⚠️ `QuizSetCreatedEvent` reused for `.updated` with no `eventType` field; marketplace relies on routing-key dispatch — fragile.
- ⚠️ `QUIZ_SET_UPDATED_ROUTING_KEY` constant missing.

### 3.3 identity-service
- `user.registered` publisher (`service/UserEventPublisher.java:32`) — fires after `profileClient.createProfile` succeeds.
- Lazy wallet creation: identity has no wallet initialization; wallet consumer creates wallet lazily. ✅ Plan-aligned.
- JWT contract (`JwtService.java:45-74`): `sub=username, userId, roles, iss, iat, exp, jti, type, tokenVersion`. ✅ All required claims.
- ⚠️ `AdminService.changeRole` swaps STUDENT↔TEACHER but emits **no event** — wallet/profile not refreshed on role change.

### 3.4 profile-service
- 5 consumers: `user.registered`, `quiz.set.created`, `flashcard.set.created`, `content.purchased`, `reward.granted`. ✅
- ❌ **No `teacher.tier.updated` consumer** — per Phase 2 impl doc (L209) this is "documented deferral", but tier display relies on denormalized `Product` fields rather than profile.
- D17 verified: profile-service has zero tier/review code (grep confirmed). ✅
- ⚠️ `UserRegisteredConsumer` only creates `TeacherProfile` (if role=TEACHER); `UserProfile` and `GameProfile` are not auto-created — relies on synchronous `POST /api/profiles`.

### 3.5 flashcard-service Eureka — MISSING
- `flashcard-service.yaml` has no `eureka.client.service-url.defaultZone` block. Gateway route `lb://FLASHCARD-SERVICE` will fail to resolve. ❌

---

## 4. Frontend (web-app) — Detailed Findings

### 4.1 Inventory
11 service modules in `src/web-app/src/api/services/`. Three dashboards: student, teacher, admin (each with its own layout). Routes in `routes.tsx`. Stores: `auth, userProfile, notification, statistics, admin` slices.

### 4.2 Feature matrix (plan → API → web-app)

| # | Plan feature | Backend | Web-app service call | Web-app UI | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Top-up | POST /api/wallet/top-up | `walletService.topUp` (`wallet.ts:109`) | `Wallet.tsx:129 executeTopUp` + form at `Wallet.tsx:317` | ✅ INTEGRATED | |
| 2 | Cash-out | POST /api/wallet/cash-out | `walletService.cashOut` (`wallet.ts:103`) | `TeacherWallet.tsx:68 handleWithdraw` + `CashOutForm` + `CashOutConfirmModal` | ✅ INTEGRATED | UI validates multiple-of-10; no pre-flight `amount <= earnedWithdrawable` re-check (TOCTOU window). |
| 3 | Balance breakdown | GET /api/wallet/balance/breakdown | `walletService.getBalanceBreakdown` (`wallet.ts:77`) | `TeacherWalletHeader.tsx:48` + `useWalletData.ts:49` + `TeacherDashboardHome.tsx:51` | ✅ INTEGRATED | |
| 4 | Teacher wallet split view (mandatory wording) | derived from breakdown | (same) | `TeacherWalletHeader.tsx:41-78` + `SellerEscrowPanel.tsx` | ⚠️ PARTIAL | **Mandatory Vietnamese wording broken in the most-visible card.** `TeacherWalletHeader.tsx:45` shows "Co the rut" (no diacritics), `:58` shows "Chi dung trong app" (ASCII). `SellerEscrowPanel.tsx:60` shows "Dang cho escrow" (ASCII). Only `TeacherDashboardHome.tsx:91` renders the diacritic "Có thể rút". Plan rule violated. |
| 5 | Wallet holds (Phase 3) | GET /api/wallet/holds/me | **NOT in wallet.ts** | NONE | ❌ MISSING_BOTH | Plan feature has no client, no UI, no route. |
| 6 | Product listing (with denormalized teacher fields) | GET /api/marketplace/products | `marketplaceApi.getProducts` (`marketplace.ts:88`) | `Marketplace.tsx:42 fetchProducts` + `Marketplace.tsx:155` cards | ⚠️ LISTING OK; DENORMALIZED FIELDS IGNORED | Denormalized fields (`teacherTier`, `teacherAverageRating`, `teacherValidReviewCount`) ARE in the `Product` DTO (`marketplace.ts:13-17`) but never rendered in the inline card. |
| 7 | Product detail | GET /api/marketplace/products/{id} | **NOT in marketplace.ts** | NONE | ❌ MISSING_BOTH | No service method; no route. |
| 8 | Create order | POST /api/marketplace/orders | `marketplaceApi.createOrder` (`marketplace.ts:97`) | `Marketplace.tsx:75 handleBuy` + polls via `getOrder` | ✅ INTEGRATED | |
| 9 | My escrows (student) | GET /api/marketplace/escrows/me | `marketplaceApi.getMyEscrows` (`marketplace.ts:103`) | NONE | ⚠️ BACKEND_READY_NO_UI | Service exists; no page consumes it. |
| 10 | Self-service refund | POST /api/marketplace/escrows/{id}/refund | `marketplaceApi.requestRefund` (`marketplace.ts:107`) | NONE | ⚠️ BACKEND_READY_NO_UI | Service exists; no UI button. Server-side `consumedAt` gate works. |
| 11 | Submit review | POST /api/marketplace/reviews | **NOT in marketplace.ts** | NONE | ❌ MISSING_BOTH | |
| 12 | List reviews of a product | GET /api/marketplace/products/{id}/reviews | **NOT in marketplace.ts** | NONE | ❌ MISSING_BOTH | |
| 13 | Teacher rating badge | GET /api/marketplace/teachers/{id}/rating | `marketplaceApi.getTeacherRating` (`marketplace.ts:113`) | `TeacherTierBadge.tsx` + `useTeacherRating.ts` + `TeacherDashboardLayout.tsx:340` | ⚠️ TEACHER OK; STUDENT MISSING | Hook + tier badge used in teacher dashboard. **Student marketplace card does NOT render the badge** — see #23. |
| 14 | Archive product | POST /api/marketplace/products/{id}/archive | **NOT in marketplace.ts** | NONE | ❌ MISSING_BOTH | Only `adminService.hideProduct` exists, different concept. |
| 15 | Hard delete with 409 | DELETE /api/marketplace/products/{id} | **NOT in marketplace.ts** | NONE | ❌ MISSING_BOTH | `ContentManager.tsx:90-109` only deletes underlying flashcard-set/quiz-set, not marketplace product entity. |
| 16 | Admin config (GET/PUT) | /api/marketplace/admin/configs | `adminService.listMarketplaceConfigs/updateMarketplaceConfig` (`admin.ts:197/203`) | `AdminSystemConfig.tsx:328/370` | ✅ INTEGRATED | Renders grouped configs (wallet + marketplace tabs). |
| 17 | Admin pending-decision queue | GET /api/marketplace/admin/orders/pending-decision | `adminService.listPendingEscrowDecisions` (`admin.ts:224`) | Merged into `AdminMarketplaceRiskPanel.tsx:95` escrow list | ⚠️ BACKEND_READY_NO_UI (filter gap) | All escrows listed; no isolation/filter for `needsAdminDecision=true` subset. |
| 18 | Admin order-item actions | POST /order-items/{id}/{action} | `adminService.decideEscrow` (`admin.ts:232`) | `AdminMarketplaceRiskPanel.tsx:138/148/395/405/415` | ⚠️ 3/4 INTEGRATED | `force-release`/`refund`/`no-refund` wired; **`partial-refund` missing on both BE and FE**. |
| 19 | Admin collusion flags list | GET /api/marketplace/admin/collusion-flags | `adminService.listCollusionFlags` (`admin.ts:244`) | `AdminMarketplaceRiskPanel.tsx:105 + 473` | ✅ INTEGRATED | Status filter dropdown. |
| 20 | Admin collusion flag detail + action | GET/POST /api/marketplace/admin/collusion-flags/{id}/action | `adminService.takeCollusionAction` (`admin.ts:272`) | `AdminMarketplaceRiskPanel.tsx:162 + 510-538` | ⚠️ PARTIAL | No detail page (`GET /{id}` missing on BE). Reason prompted via `window.prompt` — inconsistent with rest of MUI/Tailwind UI. |
| 21 | Admin revenue stats | GET /api/wallet/admin/revenue-stats | `adminService.getRevenueStats` (`admin.ts:286`) | `AdminRevenue.tsx:108 + 175` | ⚠️ PARTIAL | Renders 4 of 6 plan fields (missing `paidBackedFeeCoins`, `promoSinkCoins`, `withdrawableCoinCirculation`, `nonWithdrawableCoinCirculation`, `realRevenueVnd` separation — backend gap, see §1.7). |
| 22 | Admin ledger | GET /api/wallet/admin/ledger | `adminService.getSystemTransactions` (`admin.ts:291`) → `/wallet/admin/transactions` | `AdminRevenue.tsx:110 + 258` | ⚠️ INTEGRATED with route mismatch | Backend plan path is `/admin/ledger`; frontend calls `/admin/transactions`. Verify. |
| 23 | Student-side tier/rating badge on product card | denormalized on `Product` DTO (`marketplace.ts:13-17`) | (DTO carries fields) | `Marketplace.tsx:155-202` inline card ignores them | ⚠️ UI_PRESENT_NO_API | `MarketplaceItemCard.tsx` and `MarketplaceOfferCard.tsx` exist (`components/student/`) but **zero importers** — the intended render surface is orphaned. |

**Scoreboard:** 9 fully integrated, 7 partially wired (backend ready but UI missing or vice versa), 7 missing on both sides. 5 items have backend bugs that affect the frontend (admin revenue-stats, teacher wallet split wording, missing `partial-refund`, missing `GET /products/{id}`, route mismatch on `/wallet/admin/ledger`).

### 4.3 Wording violation
Plan mandates exact Vietnamese wording with diacritics:
- ✅ "Có thể rút" — appears **only** at `pages/teacher/TeacherDashboardHome.tsx:91` with diacritics.
- ❌ "Chỉ dùng trong app" — NOT FOUND with diacritics anywhere.
- ❌ "Đang chờ escrow" — NOT FOUND with diacritics anywhere.

ASCII-only variants render in the more prominent `TeacherWalletHeader.tsx:45,58` and `SellerEscrowPanel.tsx:60`. This is a visible UX defect that contradicts the plan's explicit wording requirement.

### 4.4 Auth / role gating
- Roles persisted in `authSlice` (`store/authSlice.ts:24,135`).
- Layout-level role gates: `TeacherDashboardLayout.tsx:68-78`, `AdminDashboardLayout.tsx:66-74`. Run client-side after first paint → TOCTOU flash of privileged content.
- No router-level guards (`routes.tsx:55-183` defines three dashboards without `<Outlet>` wrappers or `loader` enforcement).
- AdminDashboardLayout redirects non-admin to `/auth/login` instead of `/student/dashboard` — minor UX bug.

### 4.5 Mocks
- `src/web-app/src/mocks/` is **empty** (zero files). All UI calls real backend. Risk: DTO drift between `api/types.ts` (hand-written) and backend responses. Examples:
  - `Wallet.tsx:138` expects flat `res.message` and `res.coinsReceived`; backend wraps in `ApiResponse<T>` per audit.
  - `wallet.ts:66 getBalance` defensively unwraps in three ways — implies backend shape was unstable.
  - `wallet.ts:84 getHistory` issues `POST /wallet/history`; file comment (L85) flags "Swagger says POST but most services expose GET" — possible silent failure.

### 4.6 UI defects
1. **Orphaned components:** `MarketplaceItemCard.tsx` + `MarketplaceOfferCard.tsx` (`components/student/`) have zero importers. The plan-intended render surface for denormalized teacher fields (feature #23) is unused.
2. **Plan wording broken** (see §4.3).
3. **No review UI** (features #11, #12).
4. **No escrow/refund UI for buyers** (features #9, #10).
5. **No product detail page** (feature #7).
6. **No archive / marketplace hard-delete UI** (features #14, #15).
7. **No wallet holds UI** (feature #5).
8. **`window.prompt` for admin reasons** (`AdminMarketplaceRiskPanel.tsx:144,166`) — inconsistent with rest of MUI/Tailwind UI.
9. **Cash-out TOCTOU**: `TeacherWallet.tsx:68` calls `cashOut` without re-checking `earnedWithdrawable` after modal opens (server enforces, but window exists).

### 4.7 Tests
No test files anywhere in `src/web-app/src`. `package.json` has no `test` script. Aligns with `CLAUDE.md`. ⚠️ No regression protection for the V3 surfaces.

---

## 5. Cross-Cutting Infrastructure — Detailed Findings

### 5.1 Config server (`src/config-service/src/main/resources/configs/`)
- All 8 service YAML files present (wallet/marketplace/identity/profile/notification/flashcard/quiz/reward).
- **V3-specific keys live in DB**, not in YAML — wallet via `SystemConfigService` (`wallet/.../service/SystemConfigService.java:35-45`); marketplace via `MarketplaceConfigService` (`marketplace/.../service/MarketplaceConfigService.java:35-46`).
- ⚠️ **3 Phase 3 metric threshold keys missing**: `TIER_CONSUME_RATE_MIN`, `TIER_REFUND_RATE_MAX`, `TIER_APPROVAL_REJECTION_RATE_MAX` — not seeded by `MarketplaceConfigService`. Tier calc hardcodes them instead.

### 5.2 API gateway (`src/api-gateway/src/main/resources/application.yaml`)
- Routes for `IDENTITY-SERVICE, FLASHCARD-SERVICE, PROFILE-SERVICE, WALLET-SERVICE, QUIZ-SERVICE, NOTIFICATION-SERVICE, REWARD-SERVICE` defined ✅.
- **❌ No `/api/marketplace/**` route defined.** Only an OpenAPI aggregation entry exists (`openapi-marketplace` L57-62). Frontend calls to `/api/marketplace/...` via `localhost:8080` will return 404. Frontend must call marketplace directly on port 8085, or this is a hard bug.
- Public endpoints whitelist does **not** include V3 marketplace public routes (`GET /api/marketplace/products`, `/products/{id}`, `/teachers/{id}/rating`). They will require JWT — likely intentional.
- AuthenticationFilter injects `X-User-Id, X-User-Name, X-User-Roles` ✅.
- Swagger aggregation includes 7 services; reward-service swagger URL is in `api-gateway.yaml` (config server) but missing from runtime `application.yaml` ⚠️.

### 5.3 RabbitMQ topology — completeness check
| Event | Exchange | Routing key | Producer | Consumer | Bound? |
| --- | --- | --- | --- | --- | --- |
| `user.registered` | `identity.events` | `user.registered` | identity `UserEventPublisher.java:32` | wallet + notification + profile | ✅ |
| `reward.granted` | `learning.events` | `reward.granted` | reward-service | wallet + profile | ✅ |
| `flashcard.set.created` | `content.events` | `flashcard.set.created` | flashcard `ContentEventPublisher.java:22` | marketplace + profile | ✅ |
| `flashcard.set.updated` | `content.events` | `flashcard.set.updated` | flashcard `ContentEventPublisher.java:45` | marketplace (R1 hook) | ✅ |
| `flashcard.set.consumed` | `content.events` | `flashcard.set.consumed` | flashcard `ContentEventPublisher.java:67` | marketplace | ✅ |
| `quiz.set.created` | `content.events` | `quiz.set.created` | quiz `ContentEventPublisher.java:23` | marketplace + profile | ✅ |
| `quiz.set.updated` | `content.events` | `quiz.set.updated` | quiz `ContentEventPublisher.java:46` | marketplace (R1 hook) | ✅ |
| `quiz.set.consumed` | `content.events` | `quiz.set.consumed` | quiz `ContentEventPublisher.java:67` | marketplace | ✅ |
| `content.purchased` | `marketplace.events` | `content.purchased` | marketplace | wallet (no-op log) + flashcard/quiz/profile (stats) | ✅ |
| `wallet.debit.requested` | `wallet.commands` | `wallet.debit.requested` | marketplace outbox | wallet `WalletEventListener` | ✅ |
| `wallet.debit.succeeded/failed` | `wallet.events` | `wallet.debit.*` | wallet | marketplace `WalletDebitEventListener` | ✅ |
| `wallet.credit.requested` | `wallet.commands` | `wallet.credit.requested` | marketplace outbox | wallet | ✅ |
| `wallet.credit.succeeded/failed` | `wallet.events` | `wallet.credit.*` | wallet | marketplace | ✅ |
| `wallet.refund.requested` | `wallet.commands` | `wallet.refund.requested` | marketplace outbox | wallet | ✅ |
| `wallet.refund.succeeded/failed` | `wallet.events` | `wallet.refund.*` | wallet | marketplace | ✅ |
| `teacher.tier.updated` | `marketplace.events` | `teacher.tier.updated` | marketplace `TeacherRatingService.java:185-203` | **NONE** | ⚠️ Phase-2 follow-up deferred |
| `collusion.flagged` | `marketplace.events` | `collusion.flagged` | marketplace `CollusionFlagService.java:204-225` | wallet `CollusionEventConsumer` | ✅ |
| `wallet.hold.*` / `wallet.freeze.*` | — | — | — | — | ❌ NOT IMPLEMENTED anywhere |

### 5.4 Outbox / Inbox (D13)
- ✅ Marketplace has outbox (`OutboxEvent` entity + `OutboxProcessor` polling every 3s) for `wallet.credit.requested` / `wallet.refund.requested` / `wallet.debit.requested`.
- ✅ Marketplace has inbox (`InboxEvent` entity, `WalletEventHandler` dedupe on `messageId`) for `wallet.debit.succeeded/failed`, `wallet.credit.*`, `wallet.refund.*`.
- ❌ Wallet does **not** use outbox pattern for publishing `wallet.debit.succeeded` / `wallet.credit.succeeded` / `wallet.refund.succeeded` — direct `rabbitTemplate.convertAndSend`. A crash between DB commit and AMQP publish loses the event. Idempotency-key dedupe downstream would absorb duplicates, but if the publish is permanently lost, marketplace never credits/releases.

### 5.5 Docker compose + .env
- All 8 services wired with `SPRING_PROFILE=${SPRING_PROFILE}` and `CONFIG_SERVER_URL=${CONFIG_SERVER_URL}`.
- Config server `healthcheck` (`docker-compose.yml:215-223`) hits `/actuator/health`. `depends_on.config-service.condition: service_healthy` enforced.
- No V3-specific env vars needed (config keys are DB-driven).

### 5.6 Spring Cloud Config fail-fast
- ✅ 5/8 services set `fail-fast: true` (wallet, marketplace, identity, profile, notification).
- ⚠️ flashcard, quiz, reward set `fail-fast: false` — if config-server is unreachable, those services default-config silently. Inconsistent with the rest.

---

## 6. Logic Defects — Cross-Cutting

### 6.1 Refund idempotency relies entirely on wallet-side dedupe
Marketplace publishes `escrow:{id}:refund` once via outbox. If the outbox processor publishes twice (rare), wallet-side `wallet_idempotency_keys` dedupes the credit, but marketplace's `wallet.refund.succeeded` handler will set `refundedAt` again on the second pass. Functionally harmless (DB state already correct) but timestamp drifts.

### 6.2 `collusion.flagged` publish is not via outbox
`CollusionFlagService.publishEvent` (L204-225) uses direct `rabbitTemplate.convertAndSend`. If RabbitMQ down, publish is lost; the flag transition persists. Inconsistent with the outbox pattern used elsewhere. If wallet-side `CollusionEventConsumer` is down, the WASH_HOLD is also lost — no retry.

### 6.3 `Wallet.frozen` column is permanently `false`
No code path sets `Wallet.frozen = true`. Plan Phase 3 mandates `MALICIOUS` flags freeze buyer/seller wallets (`v3.md` L549). `applyFreeze` / `removeFreeze` methods don't exist. A marketplace `MARK_MALICIOUS` action currently only places a `WASH_HOLD` on the teacher (`CollusionEventConsumer.java:36`); buyer freeze does not happen.

### 6.4 Lookback window hardcoded
`CollusionFlagService.detectAndFlagCollusion` (L80) hardcodes `now.minus(30, DAYS)`. `KEY_COLLUSION_LOOKBACK_DAYS` exists in `MarketplaceConfigService` but is never read. Retroactive review transition (L99-107) does not filter by `createdAt` within the window either — affects all-time reviews for the pair, not just recent ones.

### 6.5 `reviewVelocityAbnormal` undefined
Boolean parameter; no threshold defined. Plan called for config-driven; not implemented (not even hardcoded). Affects the risk score by up to 15 points (full `riskScore`).

### 6.6 Phase-2 doc vs code divergence
Phase 3 implementation doc claimed `GOLD ≥ 4.8 / ≥ 50 reviews`. Code uses V3 plan canonical `GOLD ≥ 4.0 / ≥ 100`. The code follows the canonical V3 plan; the Phase 3 implementation doc is stale. Recommendation: update the Phase 3 doc to match code, or change code to match doc — but pick one and document.

### 6.7 Endpoint route mismatch
`AdminRevenueController` exposes `/api/wallet/admin/transactions` (L29-35). Plan v3.md requires `/api/wallet/admin/ledger`. Frontend `wallet.ts` calls `getSystemTransactions` → `/wallet/admin/transactions`. The two systems silently disagree; admin needs to know which path is canonical.

### 6.8 Hardcoded `WASH_HOLD_DAYS = 30`
`CollusionEventConsumer.java:35`: `LocalDateTime.now().plusDays(30)`. Plan v3.md D19 requires wallet-service to read `WASH_HOLD_DAYS` via Feign or event publish. No `MarketplaceClient` exists in wallet-service. D19 violated.

---

## 7. Recommended Next Actions (prioritized)

### 🔴 P0 — Blocks go-live
1. **Fix `applyFreeze` / `removeFreeze` in wallet-service** — implement methods, set `Wallet.frozen=true` on `MARK_MALICIOUS` admin action, expose admin endpoint to lift freeze. Phase 3 risk-review is non-functional without this.
2. **Fix admin revenue-stats** — implement `realRevenueVnd`, `paidBackedFeeCoins`, `promoSinkCoins`, `withdrawableCoinCirculation`, `nonWithdrawableCoinCirculation` per plan §Revenue Reporting. Use `PLATFORM_FEE_REAL` / `PLATFORM_FEE_PROMO_SINK` ledger entries.
3. **Add API gateway route for `/api/marketplace/**`** — frontend cannot reach marketplace via gateway on port 8080 right now.
4. **Fix `flashcard-service.yaml` Eureka** — add `eureka.client.service-url.defaultZone: ${EUREKA_SERVER_URL}`; otherwise gateway's `lb://FLASHCARD-SERVICE` route fails.

### 🟠 P1 — Major UX gaps
5. **Wire frontend for product detail** (`GET /api/marketplace/products/{id}`) — add `marketplaceApi.getProductById`, add route + page.
6. **Wire frontend for reviews** — add `marketplaceApi.submitReview`, `getProductReviews`, review form + list components on the product detail page.
7. **Wire frontend for self-service refund UI** — buyer-side escrow panel that triggers `requestRefund` before `consumedAt`. Server gate already works.
8. **Wire frontend for `GET /api/wallet/holds/me`** — add `walletService.getMyHolds`, render hold card on teacher wallet screen.
9. **Fix Vietnamese wording in teacher wallet** — replace `"Co the rut"`, `"Chi dung trong app"`, `"Dang cho escrow"` with diacritic strings per plan. Reuse the wording in `TeacherDashboardHome.tsx:91` across `TeacherWalletHeader.tsx` and `SellerEscrowPanel.tsx`.
10. **Render teacher-tier badge on student marketplace cards** — either use the orphaned `MarketplaceItemCard.tsx`/`MarketplaceOfferCard.tsx` or extend the inline `Marketplace.tsx:155-202` card to show `teacherTier` / `teacherAverageRating` / `teacherValidReviewCount`. The denormalized fields are already on the DTO.

### 🟡 P2 — Correctness & polish
11. **Implement `GET /api/marketplace/products/{id}`** on backend (currently only `getActiveProductById` exists in service).
12. **Implement `GET /api/marketplace/admin/collusion-flags/{id}`** detail endpoint on backend.
13. **Decide & align on admin ledger path** — rename `/wallet/admin/transactions` to `/wallet/admin/ledger` or document the divergence.
14. **Add `@Scheduled` risk-scan job** in marketplace (`CollusionFlagService.detectAndFlagCollusion` is dead code). Daily cron at off-peak; respect `KEY_COLLUSION_LOOKBACK_DAYS` instead of hardcoded 30.
15. **Seed the 3 missing Phase 3 config keys** (`TIER_CONSUME_RATE_MIN`, `TIER_REFUND_RATE_MAX`, `TIER_APPROVAL_REJECTION_RATE_MAX`) in `MarketplaceConfigService`, then read them in `TeacherRatingService.calculateTier` instead of hardcoding.
16. **Implement `adminPartialRefund`** on backend + add admin UI button. Plan still requires it.
17. **Add Feign `MarketplaceClient` to wallet-service** for reading `WASH_HOLD_DAYS` and other config per D19 (or switch to event publish on config change).
18. **Fix Phase 2 doc ↔ code tier-threshold divergence** — pick one source of truth, update the other.
19. **Switch `quiz.set.updated` payload to a typed DTO with `eventType` field**, and add `*_SET_UPDATED_ROUTING_KEY` constants in flashcard/quiz `RabbitMQConfig`. Make `consumedAt` a typed `Instant` instead of `String`.
20. **Add `role-change` event in identity-service** so wallet + profile refresh on `AdminService.changeRole`.
21. **Replace `window.prompt` for admin reasons** (`AdminMarketplaceRiskPanel.tsx:144,166`) with a MUI dialog.
22. **Move `marketplace.publishEvent` for `collusion.flagged` through outbox** for consistency and retry safety.

### 🟢 P3 — Cleanup
23. **Remove dead wallet endpoints** (`POST /api/wallet/withdraw`, `/deposit`, `/history` legacy `Transaction`) — or document them as pre-V3 leftovers.
24. **Remove dead `flashcard-service` `wallet.queue` declaration** (`RabbitMQConfig.java:51`).
25. **Remove dead legacy `WalletConsumer.learnReward`** (hardcoded `BigDecimal.valueOf(20)`, uses `System.out.println`).
26. **Delete unused frontend components** `MarketplaceItemCard.tsx` / `MarketplaceOfferCard.tsx` (orphaned) — or wire them up.
27. **Replace `System.out.println` in `WalletConsumer.java`** with `log.info`.
28. **Rename `Wallet.updateAt` → `updatedAt`** to match plan field name.
29. **Add `counterpartyUserId` to refund/cash-out/top-up ledger entries** (currently nulled at line 448 etc.).
30. **Add `heldBalance` accounting** — field exists but is never updated. Plan implies it tracks in-flight escrows at the wallet level.
31. **Add frontend tests** for critical paths: wallet split view, refund flow, review submit, admin collusion action.

---

## 8. Cross-reference: Phase 1/2/3 Implementation Status

| Plan section | Phase | Backend | Frontend |
| --- | --- | --- | --- |
| §Flow 1 Registration + lazy wallet | 1 | ✅ | ✅ (via auth slice + register page) |
| §Flow 2 Top-up to PAID | 1 | ✅ | ✅ |
| §Source buckets (bonus/reward/paid/earnedWithdrawable/earnedPromo) | 1 | ✅ | partial (DTOs exist; UI ignores earnedPromo split) |
| §Spend order BONUS→REWARD→PAID | 1 | ✅ (4-bucket extension) | n/a |
| §Frozen block matrix | 1 | ✅ | n/a |
| §Cash-out only earnedWithdrawable | 1 | ✅ | ✅ |
| §Marketplace config table | 1 | ✅ | ✅ |
| §R1/R2/R3 hooks | 1 | ✅ | n/a |
| §Hard delete 409 | 1 | ✅ | ❌ no UI |
| §Archive endpoint | 1 | ✅ | ❌ no UI |
| §EscrowTransaction + lifecycle | 2 | ✅ | partial (escrows/me fetched but no UI) |
| §EscrowReleaseJob | 2 | ✅ | n/a |
| §Outbox/inbox pattern | 2 | ✅ marketplace / ❌ wallet | n/a |
| §Self-service refund | 2 | ✅ | ❌ no UI button |
| §Admin refund/force-release/no-refund | 2 | ✅ (3/4) | ✅ (3/4) |
| §Admin partial-refund | 2 | ❌ | ❌ |
| §`content.consumed` events | 2 | ✅ | n/a |
| §`Review` + tier | 2 | ✅ | ❌ no UI |
| §Denormalized product DTO | 2 | ✅ | ⚠️ fields ignored in render |
| §`teacher.tier.updated` event | 2 | ✅ (publish) / ❌ (no consumer) | n/a |
| §Phase 3 `CollusionFlag` entity | 3 | ✅ | ✅ |
| §Risk score formula | 3 | ✅ | n/a |
| §`@Scheduled` risk-scan job | 3 | ❌ | n/a |
| §`PENDING_RISK_REVIEW` review state | 3 | ✅ | n/a |
| §Admin risk review dashboard | 3 | ✅ | ✅ (in AdminMarketplaceRiskPanel) |
| §`WalletHold` enforcement (WASH_HOLD) | 3 | ✅ cash-out only | ❌ no UI |
| §FROZEN enforcement | 3 | ❌ `applyFreeze` missing | n/a |
| §Wallet `holds/me` endpoint | 3 | ✅ | ❌ no client/UI |
| §Notifications on confirmed/malicious | 3 | partial (`collusion.flagged` published, not as outbox) | n/a |
| §AdminActionLog | 3 | ✅ | n/a |
| §D19 config-key cross-service | 3 | ❌ `WASH_HOLD_DAYS` hardcoded | n/a |
| §Admin revenue separation (realRevenue / paidBackedFee / promoSink / liability / split circulation) | 3 | ❌ 5/6 fields missing | partial (renders what backend exposes) |

---

## 9. Files cited (master index)

### Wallet service
- `src/services/wallet-service/src/main/java/com/cardy/walletService/domain/Wallet.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/domain/WalletLedgerEntry.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/domain/WalletHold.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/domain/WalletIdempotencyKey.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/service/WalletService.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/service/WalletSourceAllocator.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/service/WalletHoldService.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/service/SystemConfigService.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/service/AdminRevenueService.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/dto/admin/AdminRevenueStatsDTO.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/consumer/WalletEventListener.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/consumer/CollusionEventConsumer.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/consumer/RewardEventConsumer.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/consumer/WalletConsumer.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/controller/WalletController.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/controller/WalletHoldController.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/controller/AdminRevenueController.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/controller/AdminConfigController.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/controller/SystemConfigPublicController.java`
- `src/services/wallet-service/src/main/resources/configs/wallet-service.yaml` (config server)
- `src/services/wallet-service/src/test/java/com/cardy/walletService/service/WalletSourceAllocatorTest.java`
- `src/services/wallet-service/src/test/java/com/cardy/walletService/service/WalletHoldServiceTest.java`

### Marketplace service
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/entity/{Product,Order,OrderItem,UserInventory,EscrowTransaction,Review,TeacherRating,CollusionFlag,AdminActionLog,MarketplaceConfig,OutboxEvent,InboxEvent}.java`
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/enums/{EscrowState,ReviewStatus,TeacherTier,CollusionFlagStatus}.java`
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/EscrowService.java`
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/TeacherRatingService.java`
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/CollusionFlagService.java`
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/ReviewService.java`
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/ProductService.java`
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/AdminProductService.java`
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/AdminActionLogService.java`
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/MarketplaceConfigService.java`
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/MarketplaceEscrowSafetyService.java`
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/EscrowSafetyRules.java`
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/consumer/ProductEventListener.java`
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/consumer/WalletDebitEventListener.java`
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/controller/{ProductController,OrderController,EscrowController,ReviewController,AdminMarketplaceConfigController,AdminCollusionController,AdminProductController}.java`
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/processor/OutboxProcessor.java`
- `src/services/marketplace-service/src/test/java/com/seika/marketplace_service/service/{EscrowSafetyRulesTest,TeacherRatingServiceTest,CollusionFlagServiceTest,ReviewServiceTest,ProductServiceTest}.java`

### Other backend services
- `src/services/flashcard-service/src/main/java/com/seika/flashcard_service/service/{ContentEventPublisher,CardSetService}.java`
- `src/services/flashcard-service/src/main/java/com/seika/flashcard_service/config/RabbitMQConfig.java`
- `src/services/flashcard-service/src/main/resources/configs/flashcard-service.yaml`
- `src/services/quiz-service/src/main/java/com/seika/quiz_service/service/{ContentEventPublisher,QuizService,QuizSetService}.java`
- `src/services/quiz-service/src/test/java/com/seika/quiz_service/service/QuizServiceTest.java`
- `src/services/identity-service/src/main/java/com/seika/identity_service/service/{UserEventPublisher,AuthService,JwtService,AdminService}.java`
- `src/services/identity-service/src/main/java/com/seika/identity_service/repository/httpclient/ProfileClient.java`
- `src/services/identity-service/src/test/java/com/seika/identity_service/unit/AuthServiceTest.java`
- `src/services/profile-service/src/main/java/com/seika/profile_service/consumer/{UserRegisteredConsumer,TeacherStatsConsumer,RewardEventConsumer}.java`
- `src/services/profile-service/src/main/java/com/seika/profile_service/config/RabbitMQConfig.java`

### Frontend
- `src/web-app/src/routes.tsx`
- `src/web-app/src/api/client.ts`
- `src/web-app/src/api/services/{auth,userProfiles,flashcards,quizzes,wallet,teacherProfile,marketplace,notifications,rewards,statistics,admin}.ts`
- `src/web-app/src/layouts/{StudentDashboardLayout,TeacherDashboardLayout,AdminDashboardLayout}.tsx`
- `src/web-app/src/store/{authSlice,userProfileSlice,notificationSlice,statisticsSlice,adminSlice,index,hooks}.ts`
- `src/web-app/src/components/teacher/wallet/{TeacherWalletHeader,WalletStatsGrid,TransactionHistory,CashOutForm,CashOutConfirmModal,SellerEscrowPanel,useWalletData,types}.tsx`
- `src/web-app/src/components/teacher/dashboard/*`
- `src/web-app/src/components/teacher/{TeacherTierBadge,useTeacherRating}.tsx`
- `src/web-app/src/components/student/{MarketplaceItemCard,MarketplaceOfferCard,StudentActionButton,StudentBadge}.tsx`
- `src/web-app/src/pages/admin/{AdminDashboardHome,AdminUsers,AdminContentModeration,AdminSystemConfig,AdminRevenue,AdminMarketplaceRiskPanel}.tsx`
- `src/web-app/src/pages/teacher/{TeacherDashboardHome,ContentManager,TeacherWallet,TeacherStatistics,TeacherProfile}.tsx`
- `src/web-app/src/pages/student/{DashboardHome,LearningHub,Marketplace,Wallet,StudentProfile,FlashcardDetail,QuizDetail}.tsx`
- `src/web-app/src/pages/auth/{Login,Register}.tsx`

### Cross-cutting
- `src/api-gateway/src/main/resources/application.yaml`
- `src/config-service/src/main/resources/configs/{wallet,marketplace,identity,profile,notification,flashcard,quiz,reward}-service.yaml`
- `docker-compose.yml`
- `.env`

---

## 10. Methodology

This audit was assembled from five independent read-only subagent investigations (wallet-service, marketplace-service, flashcard/quiz/identity/profile, cross-cutting infra, frontend) running in parallel. Each subagent produced file:line-cited evidence for its domain; this report synthesizes them into a single cross-stack view. No code was modified during the audit. All findings can be re-verified by reading the cited files.