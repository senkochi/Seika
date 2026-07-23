# Seika V3 Audit Remediation — Code Review

**Scope:** Review of commits `f719389..e44fec1` on branch `cuong/dev` against the audit at `docs/implementation/teacher-tiered-economy-v3-audit.md`.
**Reviewers:** Five parallel reviewers (wallet, marketplace, profile+infra, frontend, audit-completeness).
**Headline:** All 4 P0 audit items and all 6 P1 audit items are addressed at the surface level. The fix surface is real, but it ships with **1 Critical correctness bug** in the new collusion-detection logic, **3 Required correctness/security issues**, and ~15 smaller structural items.

---

## 0. Scoreboard

| Category | Addressed | Partial | Not Addressed |
|---|---|---|---|
| P0 — blocks go-live (4) | 4 | 0 | 0 |
| P1 — major UX gaps (6) | 6 | 0 | 0 |
| P2 — correctness & polish (12) | 6 | 1 | 5 |
| §6 — logic defects (8) | 4 | 2 | 2 |

**Net diff:** 67 files / +3388 / -396 LoC across 8 commits.

---

## 1. Critical (blocks merge)

### C-1. Collusion reciprocal-ratio is always 0 → scan-based flags systematically miss bilateral wash-trade patterns
**File:** `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/CollusionFlagService.java:124-143`

The Map key on L129 is `new Pair(escrow.getSellerId(), escrow.getBuyerId())`. The reciprocal lookup on L142 builds `new Pair(pair.buyerId(), pair.teacherId())` — which is never inserted. `getOrDefault` always returns `List.of()`, so `reciprocalRatio = 0` and the +15 risk-score points are never awarded, regardless of true reciprocal activity.

The unit test `scheduledRiskScanCreatesSuspiciousFlagFromRecentEscrows` only seeds a single escrow pair, so the bug is not caught.

**Fix:** Canonicalize the `Pair` (e.g. `Pair(min, max)` sorted) so both directions hit the same key, or do two passes with both orderings.

---

## 2. Required (must fix before merge)

### Correctness

#### R-1. `transitionValidReviewsToPending` ignores the lookback window
**File:** `CollusionFlagService.java:284-294`

`findBySellerIdAndBuyerIdAndStatus(...)` has no `createdAt >= lookbackStart` filter. Every flag creation demotes a teacher's tier based on potentially ancient reviews. Audit §6.4 was explicit; this is a fix-it-now item.

#### R-2. `requestPartialRefund` does not invalidate a previously-scheduled release credit
**File:** `EscrowService.java:208-245`

If `EscrowReleaseJob` already published `wallet.credit.requested` for the escrow, the partial refund lands alongside the full release. The path needs to null `creditRequestedAt` (mirroring `adminForceRelease`).

#### R-3. No admin REST endpoint to lift a freeze
**Files:** `WalletController.java` (no entry); `WalletService.java:333-349` (method exists).

`removeFreeze` is implemented but no controller route invokes it. A user frozen via `MALICIOUS` can never transact again unless another collusion event is republished. Add `POST /api/wallet/admin/freeze` and `.../unfreeze` with `@PreAuthorize("hasRole('ADMIN')")`.

### Reliability

#### R-4. Wallet-side outbox processor has no row claim lock
**File:** `src/services/wallet-service/src/main/java/com/cardy/walletService/processor/WalletOutboxProcessor.java:25-47`

Two scheduler ticks / replicas can pick the same `PENDING` row, both publish to RabbitMQ, and one overwrites the other's state. Need `SELECT ... FOR UPDATE SKIP LOCKED` + a `CLAIMED` state, or optimistic version on save.

#### R-5. Outbox processor has no publisher confirms, no DLQ, no max-retry
**File:** `WalletOutboxProcessor.java:32-44`

A poison event republishes every 3 s forever, and a broker-accept-without-route is marked `SENT` silently. Enable `spring.rabbitmq.publisher-confirm-type: correlated` + `publisher-returns: true`, add a `DEAD` state and a `nextAttemptAt` ceiling.

#### R-6. `CollusionEventConsumer` swallows all exceptions
**File:** `src/services/wallet-service/src/main/java/com/cardy/walletService/consumer/CollusionEventConsumer.java:53-55`

`catch (Exception e) { log.error(...) }` — Spring AMQP acks the message. Combined with R-3, a transient DB hiccup during a freeze leaves a malicious user permanently locked with no alarm and no recovery path. Rethrow and bind a DLT.

#### R-7. `event.getBuyerId()` may be null on `MALICIOUS`
**File:** `CollusionEventConsumer.java:44-51`

`UUID.fromString(null)` throws, caught silently, teacher gets frozen but buyer does not. Validate up front; whole transaction must be atomic across both freeze calls.

#### R-8. Profile-service `teacher.tier.updated` consumer has no `eventId`-level idempotency
**File:** `src/services/profile-service/src/main/java/com/seika/profile_service/consumer/TeacherStatsConsumer.java:92-121`

Out-of-order redelivery can step tier backwards (e.g. ELITE overwritten by stale GOLD). Add an `InboxEvent` table or `last_event_id` column on `TeacherProfile`.

### Security / Auth

#### R-9. Self-service refund button does not check `escrow.buyerId === userId`
**File:** `src/web-app/src/pages/student/ProductDetail.tsx:454-470`

Server enforces, but the UI gives no defense-in-depth. Rename the gate to also assert the buyer match.

#### R-10. Review form does not check `product.sellerUserId !== userId`
**File:** `ProductDetail.tsx:553-558`

A seller could self-review, which is the canonical wash signal that the rest of the collusion-detection machinery specifically looks for. Add the seller-exclusion gate.

### Structural

#### R-11. Split 629-line `ProductDetail.tsx` and de-duplicate shared helpers
**Files:** `src/web-app/src/pages/student/ProductDetail.tsx:1-629`, `src/web-app/src/pages/student/Marketplace.tsx:46-57, 22-44`

`productKind` / `tierVariant` / `waitForPaidOrder` / `toNumber` / `formatCoins` are copy-pasted between the two pages. File size + duplicated helpers are real maintenance debt. Extract a `useProductDetail` hook, `<ProductHeader>` / `<ProductActionPanel>` / `<ReviewList>` / `<ReviewForm>` subcomponents, and hoist shared helpers to `src/lib/marketplace.ts`.

#### R-12. `WalletCommandOutboxService` has three near-identical enqueue methods
**File:** `src/services/wallet-service/src/main/java/com/cardy/walletService/service/WalletCommandOutboxService.java:91-153`

`enqueueDebitResult` / `enqueueCreditResult` / `enqueueRefundResult` are ~80% similar. Collapse to one generic `enqueueResult(aggregateType, aggregateId, eventType, payload, reason)`. The smell is small now; it will grow.

#### R-13. `MarketplaceItemCard.tsx` / `MarketplaceOfferCard.tsx` still have zero importers
**Files:** `src/web-app/src/components/student/MarketplaceItemCard.tsx`, `MarketplaceOfferCard.tsx`

Audit §4.6 #1 explicitly called these out. Either wire or delete.

#### R-14. `window.prompt` still in admin risk panel
**File:** `src/web-app/src/pages/admin/AdminMarketplaceRiskPanel.tsx:146,168`

Audit §4.6 #8 not addressed. Replace with a MUI Dialog.

#### R-15. Archive + hard-delete UI is still missing (audit #14, #15)
**Files:** `src/web-app/src/api/services/marketplace.ts` (no `archiveProduct` / `hardDeleteProduct`); `src/web-app/src/pages/teacher/ContentManager.tsx` (only deletes underlying flashcard/quiz-set).

No `archiveProduct` or `hardDeleteProduct` in `marketplace.ts`. `ContentManager.tsx` only deletes the underlying flashcard/quiz-set, not the marketplace product entity.

#### R-16. `partialRefundEscrow` is wired to API but no admin UI calls it
**File:** `src/web-app/src/api/services/admin.ts:252-262`

Backend exposes the endpoint, FE doesn't render the button. Audit #18 stays at 3/4.

---

## 3. Audit items still open (carry forward)

These were listed as P2 in the audit; the remediation didn't close them. Track them:

| # | Item | Status | Why |
|---|---|---|---|
| P2 #13 | `/admin/ledger` vs `/admin/transactions` rename | NOT FIXED | Path mismatch silently persists |
| P2 #18 | Phase 2 doc ↔ code tier-threshold divergence | NOT FIXED | Doc not updated |
| P2 #19 | `*_SET_UPDATED_ROUTING_KEY` constants + typed DTO | NOT FIXED | Hardcoded routing keys remain |
| P2 #20 | identity-service `role-change` event | NOT FIXED | No identity-service diff at all |
| P2 #21 | `window.prompt` → MUI dialog | NOT FIXED | See R-14 |
| §6.6 | Phase 2 doc vs code tier divergence | NOT FIXED | Same as P2 #18 |
| §6.7 | `/admin/ledger` path | NOT FIXED | Same as P2 #13 |

---

## 4. New regression introduced by `e44fec1`

The "Fix UI bugs" commit converted Vietnamese marketplace UI strings on `src/web-app/src/pages/student/Marketplace.tsx:139-189` to English ("Browse teacher-made flashcard decks...", "Refresh", "Not enough coins..."). This contradicts the project's stated Vietnamese-UI commitment (CLAUDE.md). The audit only required diacritic fixes on the teacher wallet screens, not English conversions on the student marketplace. **This is likely unintended** — verify and roll back if so.

---

## 5. Optional / Nit (suggestions, not blockers)

- `applyFreeze` publishes `wallet.updated` with `amount = BigDecimal.ZERO`; verify the notification consumer doesn't spam users with zero-balance updates. (`WalletService.java:328-329`)
- `OutboxProcessor.resolveExchange()` defaults unknown event types to `MARKETPLACE_EVENTS_EXCHANGE` — silent misroute on typos. Use a registry or fail-closed.
- `WalletController.java:50,69,78` legacy `withdraw` / `deposit` / `history` endpoints still marked `@Deprecated(forRemoval=false)` with no planned milestone — pick a date or delete.
- `AdminRevenueStatsDTO` keeps both `cashOutLiabilityVnd` and the legacy `potentialLiabilityVnd` with the same value — drop the legacy field.
- `teacher.tier.updated` event payload includes `eventType` field that the consumer never reads.
- `useWalletData.ts` retains an `as any` cast on `historyRes.data` — CLAUDE.md says "never use `any` for backend payloads`.
- N+1 query in `CollusionFlagService.countNoConsume` — `findByOrderIdAndProductIdAndActiveTrue` called per escrow in a loop. Batch it.
- `TeacherRatingService.recompute` reloads all products / inventories / escrows per flag — moving it off the flag-creation transaction (or async) avoids pathologically expensive flag operations.
- `RabbitMQConfig.objectMapper()` overrides Spring Boot's auto-config bean — remove and let Boot's `ObjectMapper` win.
- `CollusionFlagService` has four constructor overloads (legacy + 3 transitional) for test compatibility — code smell.
- `flashcard-service.yaml:33-39` sets `eureka.client.enabled: true` which is the Spring default — redundant.
- `flashcard-service.yaml` adds a JWT secret block though flashcard-service never validates JWT itself (gateway does it) — verify intent.
- `MarketplaceConfigService` `KEY_COLLUSION_TX_THRESHOLD` is used as the threshold for `reviewVelocityAbnormal` — semantically odd; consider a dedicated key.
- `MarketplaceConfigService.KEY_TIER_RATING_THRESHOLDS` is seeded but never consulted — dead seed.
- `escrowController.resolveAdminId` falls back to `auth.getPrincipal().toString()` — the principal is the username, not the userId; audit trail records usernames instead of UUIDs.
- `InventoryController.getMyInventoryDetails` does not handle deleted/hard-removed products (`productsById.get(...)` returns null).
- `ProductController.getProduct` returns 400 (not 404) on missing product — `IllegalArgumentException` → `GlobalExceptionHandler` mismatch.
- `WalletEventListener` should validate `X-User-Id` from gateway, not `X-Auth-User-Id` (which is never gateway-injected and is a spoof vector if anyone sends it).

---

## 6. Verification status

**What was not run for this review:** tests, build, manual UI walk-through. The review is code-static only.

Recommended commands before merge:

```bash
# Compile each affected service
./src/services/wallet-service/mvnw -pl src/services/wallet-service -am compile -q -DskipTests
./src/services/marketplace-service/mvnw -pl src/services/marketplace-service -am compile -q -DskipTests
./src/services/profile-service/mvnw -pl src/services/profile-service -am compile -q -DskipTests

# Run the new test classes
./src/services/wallet-service/mvnw -pl src/services/wallet-service -am test \
  -Dtest='WalletServiceFreezeTest,WalletCommandOutboxServiceTest,WalletOutboxProcessorTest,AdminRevenueServiceTest,CollusionEventConsumerTest'
./src/services/marketplace-service/mvnw -pl src/services/marketplace-service -am test \
  -Dtest='EscrowServiceTest,CollusionFlagServiceTest,TeacherRatingServiceTest,OutboxProcessorTest,ProductControllerTest'

# Web-app
cd src/web-app && npm run typecheck && npm run lint && npm run build
```

Particularly important: **run `CollusionFlagServiceTest` after fixing the reciprocal-ratio bug (C-1)** — it should fail before the fix and pass after.

---

## 7. Verdict

**Request changes.** Approve once the 1 Critical (C-1) and the top correctness/security Required items (R-1, R-2, R-9, R-10) are addressed. The structural Required items (R-11 through R-16) can ride a follow-up if you'd rather keep this PR scoped, but ideally close them in this PR — the audit cycle has gone on long enough.

**Good news:** Real, substantial progress against the audit. The freeze column finally has a writer; the outbox pattern is now consistent across both services; the gateway routes and Eureka config are fixed; the Vietnamese wording on the teacher wallet is corrected; and the student-facing card now renders the tier/rating data the backend was already shipping. Most of the missing pieces (product detail, reviews, holds UI, refund button, partial refund) are now wired and tests are in place.

**Bad news:** The most consequential fix — Phase-3 risk review — has a broken risk-score formula at its core (C-1), and the wallet-side freeze plumbing, while real, can't be undone once it triggers (R-3 + R-6). Those two items deserve another look before this lands on `master`.

---

## 8. Files reviewed

### Wallet service
- `src/services/wallet-service/src/main/java/com/cardy/walletService/WalletServiceApplication.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/consumer/WalletEventListener.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/consumer/CollusionEventConsumer.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/controller/WalletController.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/controller/AdminRevenueController.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/controller/WalletHoldController.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/domain/Wallet.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/domain/WalletOutboxEvent.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/dto/admin/AdminRevenueStatsDTO.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/enums/WalletLedgerSource.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/enums/WalletLedgerType.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/enums/WalletOutboxStatus.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/event/CollusionFlaggedEvent.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/event/WalletDebitEvent.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/event/WalletEscrowResultEvent.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/processor/WalletOutboxProcessor.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/repository/WalletOutboxEventRepository.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/service/AdminRevenueService.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/service/WalletCommandOutboxService.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/service/WalletHoldService.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/service/WalletNotificationPublisher.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/service/WalletService.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/service/WalletSourceAllocator.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/config/RabbitMQConfig.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/config/SecurityConfig.java`
- `src/services/wallet-service/src/main/java/com/cardy/walletService/security/JwtAuthenticationFilter.java`
- `src/services/wallet-service/src/test/java/com/cardy/walletService/service/WalletServiceFreezeTest.java`
- `src/services/wallet-service/src/test/java/com/cardy/walletService/service/WalletCommandOutboxServiceTest.java`
- `src/services/wallet-service/src/test/java/com/cardy/walletService/processor/WalletOutboxProcessorTest.java`
- `src/services/wallet-service/src/test/java/com/cardy/walletService/service/AdminRevenueServiceTest.java`
- `src/services/wallet-service/src/test/java/com/cardy/walletService/consumer/CollusionEventConsumerTest.java`

### Marketplace service
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/EscrowService.java`
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/TeacherRatingService.java`
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/CollusionFlagService.java`
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/CollusionRiskScanJob.java`
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/MarketplaceConfigService.java`
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/ProductService.java`
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/controller/ProductController.java`
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/controller/OrderController.java`
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/controller/EscrowController.java`
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/controller/ReviewController.java`
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/controller/AdminMarketplaceConfigController.java`
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/controller/AdminCollusionController.java`
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/controller/AdminProductController.java`
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/controller/InventoryController.java`
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/processor/OutboxProcessor.java`
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/event/CollusionFlaggedEvent.java`
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/dto/InventoryItemResponse.java`
- `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/config/RabbitMQConfig.java`
- `src/services/marketplace-service/src/test/java/com/seika/marketplace_service/service/EscrowServiceTest.java`
- `src/services/marketplace-service/src/test/java/com/seika/marketplace_service/service/CollusionFlagServiceTest.java`
- `src/services/marketplace-service/src/test/java/com/seika/marketplace_service/service/TeacherRatingServiceTest.java`
- `src/services/marketplace-service/src/test/java/com/seika/marketplace_service/processor/OutboxProcessorTest.java`
- `src/services/marketplace-service/src/test/java/com/seika/marketplace_service/controller/ProductControllerTest.java`

### Profile + cross-cutting infra
- `src/services/profile-service/src/main/java/com/seika/profile_service/config/RabbitMQConfig.java`
- `src/services/profile-service/src/main/java/com/seika/profile_service/consumer/TeacherStatsConsumer.java`
- `src/services/profile-service/src/main/java/com/seika/profile_service/event/TeacherTierUpdatedEvent.java`
- `src/services/profile-service/src/main/java/com/seika/profile_service/enity/TeacherProfile.java`
- `src/services/profile-service/src/main/java/com/seika/profile_service/service/TeacherProfileService.java`
- `src/services/profile-service/src/main/java/com/seika/profile_service/dto/teacher_profile/TeacherProfileResponse.java`
- `src/services/profile-service/src/test/java/com/seika/profile_service/consumer/TeacherStatsConsumerTest.java`
- `src/api-gateway/src/main/resources/application.yaml`
- `src/api-gateway/src/main/java/com/seika/api_gateway/filter/AuthenticationFilter.java`
- `src/config-service/src/main/resources/configs/flashcard-service.yaml`
- `src/config-service/src/main/resources/configs/api-gateway.yaml`

### Frontend
- `src/web-app/src/pages/student/ProductDetail.tsx`
- `src/web-app/src/pages/student/Marketplace.tsx`
- `src/web-app/src/pages/teacher/TeacherWallet.tsx`
- `src/web-app/src/pages/teacher/ContentManager.tsx`
- `src/web-app/src/pages/admin/AdminRevenue.tsx`
- `src/web-app/src/pages/admin/AdminMarketplaceRiskPanel.tsx`
- `src/web-app/src/components/teacher/wallet/TeacherWalletHeader.tsx`
- `src/web-app/src/components/teacher/wallet/SellerEscrowPanel.tsx`
- `src/web-app/src/components/teacher/wallet/CashOutForm.tsx`
- `src/web-app/src/components/teacher/wallet/WalletControlPanel.tsx`
- `src/web-app/src/components/teacher/wallet/useWalletData.ts`
- `src/web-app/src/components/student/MarketplaceItemCard.tsx`
- `src/web-app/src/components/student/MarketplaceOfferCard.tsx`
- `src/web-app/src/components/ui/Input.tsx`
- `src/web-app/src/components/home/Features.tsx`
- `src/web-app/src/api/services/admin.ts`
- `src/web-app/src/api/services/marketplace.ts`
- `src/web-app/src/api/services/wallet.ts`
- `src/web-app/src/api/types.ts`
- `src/web-app/src/routes.tsx`
- `src/web-app/src/index.css`

---

## 9. Methodology

This review was assembled from five independent read-only subagent investigations running in parallel: wallet-service, marketplace-service, profile+infra, frontend, and audit-completeness. Each produced file:line-cited evidence for its domain; this report synthesizes them into a single cross-stack view. No code was modified during the review.