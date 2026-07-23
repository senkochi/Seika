# Plan: V2 Phase 1 — Protected Coin Ledger + 3 Product-Rule Hooks

## Context

The V2 Token Economy plan ([docs/ideas/teacher-tiered-economy-v2.md](docs/ideas/teacher-tiered-economy-v2.md)) splits into 3 phases. **Phase 1 — "Protected Coin Ledger"** must land before Phase 2 (Escrow) because every later hook (escrow release, refund, tier fee, collusion hold) writes to a wallet that needs source-aware balances. If we ship escrow on top of today's flat `balance` column, we cannot distinguish paid-backed earnings from bonus-backed earnings when the teacher tries to cash out, and the admin revenue regex parsing in `AdminRevenueService.resolveVnd()` keeps colliding with edge cases.

**In the same release, we must install 3 product-rule hooks** that resolve conflicts between the current admin-approval workflow and the future escrow lifecycle. Today the flow is:

1. Teacher `POST /api/flashcards` → publishes `flashcard.set.created` → marketplace consumes it → creates a `Product` with `active=false, status=PENDING_REVIEW`.
2. Admin `POST /api/marketplace/admin/products/{id}/approve` → flips to `status=PUBLISHED, active=true` → student can buy.
3. Teacher `PUT /api/flashcards/{id}` → publishes `flashcard.set.updated` → marketplace resets product to `PENDING_REVIEW` and zeroes `rejectionReason`.
4. Student `POST /api/marketplace/orders` → wallet debits → wallet credits teacher immediately (no hold).

The 3 hooks for this release:

| Rule | Trigger | Decision |
|---|---|---|
| **R1** (edit during HELD) | `flashcard.set.updated` for a product that already has PAID orders whose items are in `escrow_state=HELD` | Auto-mark each affected `OrderItem` as `escrow_needs_review=true, escrow_review_reason='content_edit_by_teacher'`. Set `Order.needs_admin_decision=true`. Teacher can still edit; admin gets a queue. |
| **R2** (admin reject/hide) | `POST /api/marketplace/admin/products/{id}/reject` or `/hide` while items are in `escrow_state=HELD` | Set those items to `escrow_state=CANCELLED_BY_ADMIN`. **Do not auto-refund.** Admin must manually decide per item: refund student (→ `escrow_state=REFUNDED`) or force-release to teacher (→ `escrow_state=RELEASED`). |
| **R3** (hard-delete guard) | Teacher `DELETE /api/marketplace/products/{id}` (or `DELETE /api/flashcards/{id}` triggering marketplace gate) | Return **409 Conflict** with `{error: "PRODUCT_HAS_PAID_ORDERS", orderCount: N}` if any `OrderItem.escrow_state IN (HELD, CANCELLED_BY_ADMIN) AND escrow_fully_refunded=false`. Provide a new soft-archive endpoint `POST /api/marketplace/products/{id}/archive` that always succeeds (sets `status=HIDDEN, soft_archived=true`). |

**Intended outcome:**

1. `Wallet` carries 5 source balances + `heldBalance` + `frozen`. `WalletLedgerEntry` records every movement with `source` + `withdrawableAmount`/`nonWithdrawableAmount`.
2. Top-up lands as `PAID`, initial 500 coins as `BONUS`, learning reward as `REWARD`. Cash-out drains only `earnedWithdrawableBalance`. Admin revenue reads ledger fields, drops regex.
3. Order debits return source breakdown to marketplace; marketplace `Order` and `UserInventory` carry `escrowState`/`needsAdminDecision` columns (no behavior change yet — written but only used in Phase 2 unless R1/R2 fires).
4. R1/R2/R3 hooks installed and tested end-to-end, but the actual `EscrowTransaction` table is a Phase 2 concern. We use a **hybrid scaffold**: `escrowState`/`escrowNeedsReview` columns on `OrderItem` map 1:1 to the future `EscrowTransaction.status` so Phase 2 is a column-to-table promotion, not a rewrite.

---

## Architecture Decisions

### Where do R1/R2/R3 hooks live?

**All 3 hooks live in `marketplace-service`**, not split with wallet:

- R1 fires from `ProductEventListener.updateProduct()` (already in marketplace) when an existing Product transitions back to `PENDING_REVIEW`. The check is "any `OrderItem` for this Product with `escrow_state='HELD'`?" — pure marketplace state, no wallet call needed.
- R2 fires from `AdminProductService.reject()` and `.hide()` after the status flip. Same pattern.
- R3 fires from a new `ProductService.archive()` (replaces teacher hard-delete path) and from a hard-delete gate in `ProductService.delete()`. Marketplace owns the Product row and Order rows so it is the only service that can answer "any PAID orders without full refund?".

Wallet is not in the critical path for any of the 3 hooks in Phase 1 because no money moves yet (no real escrow = no real money to lock). Wallet's only role is that R3 needs to know the source of any past refund to validate "fully refunded", and that's a Phase 2 query against `WalletLedgerEntry` — for Phase 1 we rely on `OrderItem.escrow_fully_refunded` alone.

### Should `EscrowTransaction` be a real table in Phase 1?

**No, but we add minimal scaffolding that can be promoted to a real table in Phase 2 without breaking Phase 1 code.** Two options were on the table:

| Option | Pros | Cons |
|---|---|---|
| (a) Real `EscrowTransaction` table now | Phase 2 is just data writes; no migration pain | Ships a near-empty table in Phase 1; admin queue endpoints reference rows that mostly don't exist |
| (b) Columns on `OrderItem` only | Smaller surface; matches the user's "Phase 1 = ledger only" framing | Phase 2 must migrate; the hook logic has to know about both OrderItem columns and the future dedicated table |

**Pick (b) with a clean upgrade path.** Concretely: add `escrow_state` column on `OrderItem` (default `HELD`), and `needsAdminDecision`/`pendingReviewReason` columns on `Order`. Reason: R1/R2 need to mark MULTIPLE `OrderItem` per `Order` (one per product), but the escrow-table design from v2 has one escrow row per `OrderItem` already, so we are *behaving* like the future table from day 1 — Phase 2 just promotes the column to a dedicated table when tier/review/release logic needs the full escrow snapshot.

Why not add a stub `EscrowTransaction` JPA entity now and wire it empty? Because:
- the JPA entity needs `paidBackedAmount`, `bonusBackedAmount`, `rewardBackedAmount`, `tierAtPurchase`, `tierFeePercent`, `escrowFeePercent` — most of those don't exist in Phase 1 (no tier calculation yet).
- We don't have `WalletLedgerEntry` emitting source breakdowns yet in Phase 1, so the values would be wrong or zero.
- Empty JPA entity + future migration is more code debt than "promote column to table later".

### Migration story for existing Wallets/Transactions

```
1. ALTER TABLE wallets ADD COLUMN paid_balance, bonus_balance, reward_balance,
   earned_withdrawable_balance, earned_promo_balance, held_balance, frozen BOOLEAN.
2. UPDATE wallets SET bonus_balance = balance WHERE user_id IN (student_user_ids).
3. UPDATE wallets SET earned_withdrawable_balance = balance WHERE user_id IN (teacher_user_ids).
4. Existing `transactions` rows: read-only historical. New code writes `WalletLedgerEntry`.
5. No backfill of WalletLedgerEntry for past transactions — admin revenue stats
   reconstruct VND totals from `Transaction` for the existing history, and use
   `WalletLedgerEntry` for everything new. After a configurable cutoff date
   (LEGACY_TRANSACTION_CUTOFF_DATE), the legacy `Transaction` table is frozen for revenue reads.
```

Per V2 plan §"Migration Strategy" ("Existing transactions remain read-only historical records"). We do NOT rebuild the legacy ledger.

---

## Data Model Changes

### Wallet — new columns

| Column | Type | Notes |
|---|---|---|
| `paid_balance` | numeric(19,2), default 0 | Top-up + admin grant |
| `bonus_balance` | numeric(19,2), default 0 | Initial grant + promo |
| `reward_balance` | numeric(19,2), default 0 | Learning reward |
| `earned_withdrawable_balance` | numeric(19,2), default 0 | Teacher share of PAID-backed purchase, minus fees |
| `earned_promo_balance` | numeric(19,2), default 0 | Teacher share of BONUS/REWARD-backed purchase, minus fees |
| `held_balance` | numeric(19,2), default 0 | Sum of frozen escrow (used Phase 2) — column exists in Phase 1, always 0 |
| `frozen` | boolean, default false | Risk hold (Phase 3) — exists in Phase 1, always false |

Keep `balance` as legacy/total. Migration default: keep updating `balance = sum(...)` in `updateBalance()`.

### WalletLedgerEntry — new table

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `wallet_id` | UUID FK → wallets | |
| `user_id` | UUID | denormalized for index |
| `type` | varchar(32) | enum: `TOP_UP, INITIAL_BONUS, LEARNING_REWARD, PURCHASE_DEBIT, ESCROW_RELEASE_CREDIT, ESCROW_REFUND_CREDIT, PLATFORM_FEE, CASH_OUT, WALLET_HOLD, WALLET_FREEZE, WALLET_UNFREEZE` |
| `source` | varchar(32) | enum: `PAID, BONUS, REWARD, EARNED_WITHDRAWABLE, EARNED_PROMO, PLATFORM_FEE, MIXED` |
| `amount` | numeric(19,2) | signed (negative for debits) |
| `withdrawable_amount` | numeric(19,2) | portion usable for cash-out |
| `non_withdrawable_amount` | numeric(19,2) | portion not usable for cash-out |
| `order_id` | varchar nullable | |
| `escrow_id` | varchar nullable | populated in Phase 2 |
| `counterparty_user_id` | UUID nullable | |
| `description` | varchar(500) | human-readable but not parsed |
| `created_at` | timestamp | |

Indexes: `(wallet_id, created_at desc)`, `(user_id, type, created_at)`, `(order_id)`.

### Product — new columns (marketplace)

| Column | Type | Notes |
|---|---|---|
| `soft_archived` | boolean, default false | Set when teacher archives their own product (R3) |

### ProductStatus enum — reuses existing `HIDDEN` for soft-archive

No new enum value needed. R2 fires whether the product is `REJECTED` or `HIDDEN` — both states count. R3 teacher archive uses the existing `HIDDEN` value combined with `soft_archived=true` (we deliberately reuse `HIDDEN` so admin listing endpoints stay uniform; the `soft_archived` flag indicates teacher-initiated vs admin-initiated).

### OrderStatus — add `CANCELLED_BY_ADMIN`

Existing: `PENDING_PAYMENT, PAID, CANCELLED, FAILED`. R2 needs a way to mark orders that had PAID status and now need admin decision. Add:

| New value | Meaning | Set by |
|---|---|---|
| `CANCELLED_BY_ADMIN` | Admin rejected/hid the product while this order was PAID. Money has NOT been returned yet — admin must decide per OrderItem. | `AdminProductService.reject/hide()` |

Existing `CANCELLED` and `FAILED` stay as-is. We never set `CANCELLED_BY_ADMIN` for orders in PENDING_PAYMENT — those don't have money in them. Refund/cancel flow in Phase 2 will eventually move `CANCELLED_BY_ADMIN` → `REFUNDED` after admin acts.

### OrderItem — new columns

| Column | Type | Notes |
|---|---|---|
| `escrow_state` | varchar(32), default `HELD` | Phase 1 writes `HELD`, `PENDING_EDIT_REVIEW`, `CANCELLED_BY_ADMIN`, `RELEASED`, `REFUNDED`. Aligned with V2 `EscrowTransaction.status` so future table promotion is 1:1. |
| `escrow_needs_review` | boolean, default false | Set by R1 (`true` = awaiting admin decision) |
| `escrow_review_reason` | varchar(255) nullable | human-readable, set by R1 |
| `escrow_fully_refunded` | boolean, default false | used by R3 — checked to ensure an order is fully undone before allowing hard-delete |

### Order — new columns

| Column | Type | Notes |
|---|---|---|
| `needs_admin_decision` | boolean, default false | aggregate flag (true = at least one OrderItem needs admin review or is CANCELLED_BY_ADMIN) — drives a quick admin queue query |

### UserInventory — new columns

| Column | Type | Notes |
|---|---|---|
| `consumed_at` | timestamp nullable | Phase 2; column added now so migration later is trivial |
| `revocation_reason` | varchar(255) nullable | used by R2 when admin rejects (set to `PRODUCT_REJECTED` etc.) |
| `source_order_id` | varchar(36) nullable | already have `orderId` — keep both for back-compat; new code uses `orderId` |

### Migration tooling

The codebase uses `spring.jpa.hibernate.ddl-auto: update` (no Flyway/Liquibase). We keep using `update` for the new columns — `update` works for additive changes. For the **data migration** (Step 2-3 of the migration story), we add a one-shot `DataMigrationRunner` ApplicationRunner that runs once at boot, guarded by a `SchemaMigrationHistory` row keyed by name. This avoids introducing Flyway just for Phase 1.

---

## API Surface Changes

### Wallet — new endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/wallet/balance/breakdown` | Returns `{paid, bonus, reward, earnedWithdrawable, earnedPromo, held, frozen: boolean, total}` |
| GET | `/api/wallet/admin/ledger?type=...&userId=...&page=...&size=...` | New admin endpoint that pages `WalletLedgerEntry`. Replaces ad-hoc admin queries that today scan `transactions`. |
| GET | `/api/wallet/admin/revenue-stats` | **Existing endpoint**, now reads from `WalletLedgerEntry` grouped by type/source + `transactions` legacy table (for cutoff-date rows). |

The `getBalance()` legacy endpoint continues to return `balance` for client back-compat. New clients should call `/balance/breakdown`.

### Marketplace — R1/R2/R3 endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/marketplace/products/{id}/archive` (teacher) | R3 soft-archive. Sets `status=HIDDEN, soft_archived=true`. 200 always. |
| DELETE | `/api/marketplace/products/{id}` (teacher) | R3 hard-delete. Returns **409 Conflict** with body `{error: "PRODUCT_HAS_PAID_ORDERS", orderCount: N}` if any `OrderItem.escrow_state IN (HELD, CANCELLED_BY_ADMIN) AND escrow_fully_refunded=false`. |
| GET | `/api/marketplace/admin/orders/pending-decision?page=...&size=...` | R1+R2 admin queue. Lists Orders where `needs_admin_decision=true`, grouped/counted by reason. |
| GET | `/api/marketplace/admin/orders/{orderId}/items` | Detail with `escrow_state`/`escrow_review_reason` for each item. |
| POST | `/api/marketplace/admin/order-items/{orderItemId}/refund` | R2 admin action: refund student. In Phase 1 this only updates `OrderItem.escrow_state='REFUNDED'` and `escrow_fully_refunded=true` on the OrderItem; **no money moves** (Phase 2 publishes `wallet.credit.requested`). |
| POST | `/api/marketplace/admin/order-items/{orderItemId}/force-release` | R2 admin action: release to teacher. Phase 1 only flips `escrow_state='RELEASED'`; money flow in Phase 2. |
| GET | `/api/marketplace/teacher/products/{id}/pending-edits` | R1 teacher-facing. Returns list of `{orderId, orderItemId, reason, since}` — the affected escrows teacher should know about. |

### Backward-compatible behavior

- Existing endpoints (`GET /api/marketplace/admin/products/pending`, `POST .../{id}/approve|reject|hide`) keep their signatures.
- `POST .../{id}/reject` and `POST .../{id}/hide` gain a side-effect: they call `EscrowHookService.onProductRejectOrHide(productId)` AFTER the status flip. Reject/hide request bodies stay the same.
- `OrderService.createOrder` keeps emitting `wallet.debit.requested` shape; only the **response** (`wallet.debit.succeeded`) gains fields.

---

## Event Topology Changes

### Updated payloads

**`wallet.debit.succeeded` (NEW shape, additive — backward-compat consumers ignore extra fields):**

```json
{
  "eventId": "uuid",
  "eventType": "wallet.debit.succeeded",
  "orderId": "uuid",
  "userId": "uuid",
  "amount": "100.00",
  "sourceBreakdown": {
    "paid": "60.00",
    "bonus": "30.00",
    "reward": "10.00"
  }
}
```

`WalletEventHandler` writes a `PURCHASE_DEBIT` ledger entry per source line. For the order itself, `OrderItem` does not store source breakdown in Phase 1 (Phase 2's `EscrowTransaction` will). The ledger has the audit trail; the marketplace has the lifecycle.

**`content.purchased` (UNCHANGED in Phase 1):** still fires from `ContentPurchasedEventPublisher`. `WalletEventListener.handleContentPurchased()` continues to credit teacher immediately — this is the *legacy* teacher payout path. Phase 2 will replace this with `EscrowReleaseJob` calling `wallet.credit.requested`. In Phase 1 we keep the old behavior to avoid breaking teacher revenue day-1.

### Phase 2/3 event schemas (added now, no consumer yet)

| Event | Class added in Phase 1? | Consumer added? | Notes |
|---|---|---|---|
| `wallet.credit.requested` | yes | no (Phase 2) | `eventId, eventType, userId, amount, source, withdrawableAmount, nonWithdrawableAmount, orderId, orderItemId, escrowId, reason` |
| `content.consumed` | yes | no (Phase 2) | mirrors `flashcard.set.updated` shape + `progress > 0` or quiz-attempt-creator gating |
| `wallet.hold.requested` / `wallet.hold.released` | no (Phase 3) | no | not needed until collusion work |
| `teacher.tier.updated` | no (Phase 2) | no | |

Rationale: Adding the class records the contract in code review now, so Phase 2 implementation is mechanical and we don't discover schema drift at integration time.

### `flashcard.set.updated` payload — semantic annotation

No schema change, but the marketplace-side `ProductEventListener` annotates its log line with the R1-hook outcome: `product {id} returned to PENDING_REVIEW, marked N OrderItems as PENDING_EDIT_REVIEW`.

### RabbitMQ topology

No new exchanges or queues in Phase 1. The new event classes will publish to existing exchanges once Phase 2 lands.

---

## File-Level Implementation Order

### Database schema (DDL via `ddl-auto: update` + targeted SQL scripts for data migration)

| Path | Purpose | Key fields / methods |
|---|---|---|
| `src/services/wallet-service/src/main/java/com/cardy/walletService/domain/Wallet.java` | Add source balance columns | `paidBalance, bonusBalance, rewardBalance, earnedWithdrawableBalance, earnedPromoBalance, heldBalance, frozen` |
| `src/services/wallet-service/src/main/java/com/cardy/walletService/domain/WalletLedgerEntry.java` | NEW entity | fields per §Data Model |
| `src/services/wallet-service/src/main/java/com/cardy/walletService/repository/WalletLedgerEntryRepository.java` | NEW repo | `findByWalletIdOrderByCreatedAtDesc`, `findByUserIdAndTypeAndCreatedAtBetween`, aggregations for revenue stats |
| `src/services/wallet-service/src/main/resources/db/migration/V2__add_source_balances_and_ledger.sql` | NEW migration script | additive ALTERs + indices |
| NEW `src/services/wallet-service/src/main/java/com/cardy/walletService/migration/V2SourceBalanceMigrationRunner.java` | one-shot boot migration | copy `balance` → `bonus_balance` (student) or `earned_withdrawable_balance` (teacher), idempotent via `migration_history` row |
| `src/services/wallet-service/src/main/java/com/cardy/walletService/migration/MigrationHistory.java` (+ repo) | NEW | tracks which migrations have run |
| `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/entity/Order.java` | Add column | `needsAdminDecision` |
| `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/entity/OrderItem.java` | Add columns | `escrowState, escrowNeedsReview, escrowReviewReason, escrowFullyRefunded` |
| `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/entity/Product.java` | Add column | `softArchived` |
| `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/entity/UserInventory.java` | Add columns | `consumedAt, revocationReason, sourceOrderId` |
| `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/enums/OrderStatus.java` | Add value | `CANCELLED_BY_ADMIN` |

### Enums + DTOs + Event classes

| Path | Purpose |
|---|---|
| `src/services/wallet-service/src/main/java/com/cardy/walletService/enums/CoinSource.java` | NEW enum: `PAID, BONUS, REWARD, EARNED_WITHDRAWABLE, EARNED_PROMO, PLATFORM_FEE, MIXED` |
| `src/services/wallet-service/src/main/java/com/cardy/walletService/enums/LedgerEntryType.java` | NEW enum: per §Data Model |
| `src/services/wallet-service/src/main/java/com/cardy/walletService/enums/TransactionType.java` | Add values: `PURCHASE_DEBIT, ESCROW_RELEASE_CREDIT, ESCROW_REFUND_CREDIT, PLATFORM_FEE, WALLET_HOLD, WALLET_FREEZE, WALLET_UNFREEZE`. Keep existing `DEPOSIT/WITHDRAW/REWARD/CASH_OUT/TOP_UP` for legacy rows. |
| `src/services/wallet-service/src/main/java/com/cardy/walletService/dto/WalletBalanceBreakdownDTO.java` | NEW: 6 numbers + frozen flag + total |
| `src/services/wallet-service/src/main/java/com/cardy/walletService/dto/LedgerEntryDTO.java` | NEW: row view for admin |
| `src/services/wallet-service/src/main/java/com/cardy/walletService/event/WalletCreditRequestedEvent.java` | NEW (Phase 2 schema only) |
| `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/dto/admin/OrderPendingDecisionResponse.java` | NEW: list rows for admin queue |
| `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/dto/admin/RefundOrderItemRequest.java` | NEW: reason field |
| `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/dto/admin/ForceReleaseOrderItemRequest.java` | NEW: reason field |
| `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/enums/EscrowState.java` | NEW: `HELD, PENDING_EDIT_REVIEW, CANCELLED_BY_ADMIN, RELEASED, REFUNDED` |
| `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/event/ContentConsumedEvent.java` | NEW (Phase 2 schema only) |
| `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/event/WalletDebitEvent.java` | Add fields: `sourceBreakdown: Map<String,BigDecimal>` |

### Repository / service logic

#### Wallet

| Path | Purpose | Key methods |
|---|---|---|
| `src/services/wallet-service/src/main/java/com/cardy/walletService/service/WalletService.java` | Refactor | Split `updateBalance` into `credit(source, amount, withdrawable, nonWithdrawable, ledgerType, ...)` and `debit(amount, ledgerType, orderId)`. New allocation order in debit: PAID → BONUS → REWARD → earnedWithdrawable → earnedPromo. Top-up → credit `PAID`. Initial 500 → credit `BONUS` via `INITIAL_BONUS`. Learning reward → credit `REWARD` via `LEARNING_REWARD`. Cash-out → debit only from `earnedWithdrawableBalance`, else `400`. Every movement also writes a `WalletLedgerEntry` row. |
| NEW `src/services/wallet-service/src/main/java/com/cardy/walletService/service/LedgerService.java` | NEW | `record(ledgerEntry)`, `findByUser`, `aggregateByTypeAndSourceBetween` |
| `src/services/wallet-service/src/main/java/com/cardy/walletService/service/AdminRevenueService.java` | REWRITE | Drop regex. New `getRevenueStats()` reads from `WalletLedgerEntry.groupByTypeAndSource` for source-tagged total. Top-up VND = `SUM(amount*rate)` from `TOP_UP` rows. Cash-out VND = `SUM(amount*withdrawalRate)` from `CASH_OUT` rows. Teacher earnings = `SUM(amount) WHERE source IN (EARNED_WITHDRAWABLE)`. |
| NEW `src/services/wallet-service/src/main/java/com/cardy/walletService/service/WalletBalanceService.java` | NEW | `getBreakdown(userId) → WalletBalanceBreakdownDTO`. |
| `src/services/wallet-service/src/main/java/com/cardy/walletService/consumer/WalletEventListener.java` | Modify `handleWalletDebitRequested` | After `walletService.spend`, call new helper to allocate source breakdown. Publish `wallet.debit.succeeded` with `sourceBreakdown`. |
| NEW `src/services/wallet-service/src/main/java/com/cardy/walletService/service/DebitAllocationService.java` | Helper | pure function `allocate(BigDecimal requested, Wallet wallet) → Map<CoinSource, BigDecimal>`. Order: PAID → BONUS → REWARD. |

#### Marketplace

| Path | Purpose | Key methods |
|---|---|---|
| `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/AdminProductService.java` | Add hooks | After `reject()` / `hide()` flips status, call `escrowHookService.onProductRejectOrHide(productId, newStatus)`. |
| NEW `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/EscrowHookService.java` | NEW | `onProductRejectOrHide(productId)` → finds all `OrderItem` with `escrow_state='HELD'`, sets `escrow_state='CANCELLED_BY_ADMIN'`, sets `Order.needsAdminDecision=true`. `onContentEdit(productId)` → finds `OrderItem` with `escrow_state='HELD'`, sets `escrow_needs_review=true, escrow_review_reason='content_edit_by_teacher'`, sets `Order.needsAdminDecision=true`. `refundOrderItem(itemId, reason)`, `forceReleaseOrderItem(itemId, reason)`. |
| `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/ProductService.java` | Modify | Add `archive(productId, teacherUserId)`: sets HIDDEN + softArchived. Add `canDelete(productId)` boolean check used by DELETE endpoint. |
| `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/repository/OrderItemRepository.java` | Add queries | `findByProductIdAndEscrowStateIn(String productId, List<EscrowState> states)`, `existsByProductIdAndEscrowFullyRefundedFalse` |
| `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/repository/OrderRepository.java` | Add query | `findByNeedsAdminDecisionTrueOrderByUpdatedAtDesc(Pageable)` |
| `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/consumer/ProductEventListener.java` | Modify `updateProduct` | After `product.setStatus(PENDING_REVIEW)`, call `escrowHookService.onContentEdit(product.getId())` |
| `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/WalletEventHandler.java` | No behavior change in Phase 1; only observe | Note: this is where `OrderItem` references for the source breakdown will get attached in Phase 2 |

### Controllers

| Path | Endpoints |
|---|---|
| `src/services/wallet-service/src/main/java/com/cardy/walletService/controller/WalletController.java` | Add `GET /api/wallet/balance/breakdown`. |
| `src/services/wallet-service/src/main/java/com/cardy/walletService/controller/WalletAdminController.java` | Add `GET /api/wallet/admin/ledger`. |
| `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/controller/AdminProductController.java` | NO endpoint signature change (reject/hide hooks run as side-effect). |
| NEW `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/controller/AdminOrderController.java` | `GET /admin/orders/pending-decision`, `GET /admin/orders/{id}/items`, `POST /admin/order-items/{id}/refund`, `POST /admin/order-items/{id}/force-release`. |
| NEW `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/controller/TeacherProductController.java` | `POST /products/{id}/archive`, `GET /products/{id}/pending-edits`. |
| `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/controller/ProductController.java` | Modify `DELETE /products/{id}` (teacher). Returns 409 with orderCount detail. |

### Event publishers / consumers

| Path | Change |
|---|---|
| `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/ContentPurchasedEventPublisher.java` | No schema change. |
| `src/services/wallet-service/src/main/java/com/cardy/walletService/consumer/WalletEventListener.java` | `publishWalletEvent` updated to serialize `sourceBreakdown` from new field on `WalletDebitEvent`. `handleContentPurchased` stays the same (legacy teacher credit). |
| NEW `src/services/wallet-service/src/main/java/com/cardy/walletService/event/WalletCreditRequestedEventPublisher.java` | define but do not register RabbitTemplate.send for Phase 1 |
| NEW `src/services/flashcard-service/src/main/java/com/seika/flashcard_service/event/ContentConsumedEventPublisher.java` | define, do not fire in Phase 1 |
| NEW `src/services/quiz-service/src/main/java/com/seika/quiz_service/event/ContentConsumedEventPublisher.java` | define, do not fire in Phase 1 |

### Configuration

| Path | Field |
|---|---|
| `src/services/wallet-service/src/main/java/com/cardy/walletService/service/SystemConfigService.java` | Add new keys: `V2_ENABLED` (boolean, default true in dev), `V2_SOURCE_BALANCE_MIGRATION_DONE` (boolean, default false). Add `LEGACY_TRANSACTION_CUTOFF_DATE` (timestamp). |
| `src/config-service/src/main/resources/configs/wallet-service.yaml` | Add `V2_ENABLED: ${V2_ENABLED:true}`, `LEGACY_TRANSACTION_CUTOFF_DATE: ${LEGACY_TX_CUTOFF:2026-07-09T00:00:00Z}` |
| `src/config-service/src/main/resources/configs/marketplace-service.yaml` | Add `V2_ESCROW_HOOK_ENABLED: ${V2_ESCROW_HOOK_ENABLED:true}` |
| `src/config-service/src/main/resources/configs/marketplace-service-dev.yaml` | default true for dev, false for prod initially behind the flag |

### Tests

| Path | Test name |
|---|---|
| `src/services/wallet-service/src/test/java/.../service/WalletServiceTest.java` | NEW `DebitAllocationServiceTest`: paid-then-bonus order, falls back to reward, throws when total < requested |
| `src/services/wallet-service/src/test/java/.../service/WalletServiceCashOutTest.java` | NEW: cash-out rejects when earnedWithdrawable=0, partial cash-out |
| `src/services/wallet-service/src/test/java/.../service/LedgerServiceTest.java` | NEW: writes ledger row, lists by user, aggregates by type+source |
| `src/services/wallet-service/src/test/java/.../service/AdminRevenueServiceTest.java` | NEW: revenue stats from ledger fields, no regex; legacy cutoff mix |
| `src/services/marketplace-service/src/test/java/.../service/AdminProductServiceTest.java` | NEW: reject with PAID orders → escrowState=CANCELLED_BY_ADMIN, needsAdminDecision=true; reject without orders → no hook fired |
| `src/services/marketplace-service/src/test/java/.../service/EscrowHookServiceTest.java` | NEW: R1 marks HELD items, R2 marks CANCELLED_BY_ADMIN, R3 delete gate |
| `src/services/marketplace-service/src/test/java/.../consumer/ProductEventListenerTest.java` | NEW: receiving `flashcard.set.updated` while order is HELD → mark item for review |
| Integration (Testcontainers + RabbitMQ): `src/services/marketplace-service/src/test/java/.../integration/PurchaseAndEditFlowIT.java` | NEW: full flow top-up → buy → product PENDING_REVIEW → admin approves → second buy → teacher edits → escrow marked → admin confirms release |

---

## Critical files to read while implementing

- [docs/ideas/teacher-tiered-economy-v2.md](docs/ideas/teacher-tiered-economy-v2.md) — the source-of-truth spec
- [ProductEventListener.java](src/services/marketplace-service/src/main/java/com/seika/marketplace_service/consumer/ProductEventListener.java) — entry point for R1 hook
- [WalletEventHandler.java](src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/WalletEventHandler.java) — currently the only place that creates inventory + publishes `content.purchased`
- [AdminProductService.java](src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/AdminProductService.java) — entry point for R2 hook
- [WalletService.java](src/services/wallet-service/src/main/java/com/cardy/walletService/service/WalletService.java) — refactor target
- [AdminRevenueService.java](src/services/wallet-service/src/main/java/com/cardy/walletService/service/AdminRevenueService.java) — the regex we're killing
- [WalletEventListener.java](src/services/wallet-service/src/main/java/com/cardy/walletService/consumer/WalletEventListener.java) — where wallet.debit.succeeded is constructed
- [CardSetService.java](src/services/flashcard-service/src/main/java/com/seika/flashcard_service/service/CardSetService.java) — teacher-content delete path; entry point for R3 gate
- [OrderItem.java](src/services/marketplace-service/src/main/java/com/seika/marketplace_service/entity/OrderItem.java) — new escrow columns
- [SystemConfigService.java](src/services/wallet-service/src/main/java/com/cardy/walletService/service/SystemConfigService.java) — config-driven defaults
- `src/config-service/src/main/resources/configs/wallet-service.yaml` and `marketplace-service.yaml` — config-service overrides pattern

---

## Verification / Testing

### Unit tests (must pass)

- `DebitAllocationServiceTest`: paid-then-bonus-then-reward fallback order; throws when insufficient total.
- `WalletServiceCashOutTest`: rejects when `earnedWithdrawableBalance=0`; partial ok; multiples respected.
- `WalletServiceTopUpTest`: top-up writes `PAID` source + `TOP_UP` ledger entry.
- `WalletServiceInitialBonusTest`: registration writes `BONUS` source + `INITIAL_BONUS` ledger entry.
- `AdminRevenueServiceTest`: top-up/cash-out/admin-fee totals computed from ledger, NOT regex.
- `EscrowHookServiceTest`:
  - onContentEdit(HELD item, published product) → `escrowNeedsReview=true, escrow_review_reason='content_edit_by_teacher', order.needsAdminDecision=true`.
  - onContentEdit(REFUNDED item) → no change.
  - onProductRejectOrHide(HELD items) → `escrowState=CANCELLED_BY_ADMIN`. Already-CANCELLED items untouched.
  - refundOrderItem / forceReleaseOrderItem update fields; nothing else (no money moves Phase 1).
- `AdminProductServiceTest`:
  - reject with PAID order items → cascade sets CANCELLED_BY_ADMIN + Order flag.
  - reject with no PAID orders → no hook fire, behavior identical to today.
- `ProductServiceTest`:
  - delete product with HELD items → returns ConflictException with orderCount.
  - delete product with all items `escrow_fully_refunded=true` → OK.
  - archive → sets HIDDEN + softArchived regardless of escrow state.

### Integration test (single, end-to-end, feature flag ON)

```
1. Student tops up 1000 VND → wallet.paidBalance=10
2. Student buys 100-coin quiz (40 paid, 60 bonus) with teacher A
3. Marketplace publishes wallet.debit.requested (amount=100)
4. Wallet: DebitAllocationService returns paid=40, bonus=60 → 2 ledger rows
5. Wallet publishes wallet.debit.succeeded with sourceBreakdown
6. Marketplace: Order.status=PAID, UserInventory created, content.purchased emitted
7. Teacher A edits CardSet → flashcard.set.updated
8. ProductEventListener.updateProduct → status=PENDING_REVIEW,
   EscrowHookService.onContentEdit → OrderItem.escrowNeedsReview=true,
   order.needsAdminDecision=true
9. Admin GET /api/marketplace/admin/orders/pending-decision → sees order in queue
10. Admin POST /admin/order-items/{id}/force-release with reason
    → escrowState=RELEASED, escrowFullyRefunded=false (Phase 1 stub)
```

### Manual test scenarios

| Scenario | Steps | Expected |
|---|---|---|
| M1: admin rejects with HELD escrows | Student buys product X. Admin rejects X. GET pending-decision. | Order items show `escrow_state=CANCELLED_BY_ADMIN`. Admin sees the queue. Refund one item → `escrow_fully_refunded=true`. Force-release another → `escrow_state=RELEASED`. |
| M2: teacher edits product X with HELD escrows | Student buys. Teacher edits CardSet via flashcard service. | Product goes PENDING_REVIEW. OrderItem.escrowNeedsReview=true. Teacher sees `GET /teacher/products/{id}/pending-edits` showing affected items. |
| M3: teacher tries hard-delete with PAID orders | Teacher buys own student account → student buys product X. Teacher calls DELETE /api/marketplace/products/{id}. | Response 409 with `{error: "PRODUCT_HAS_PAID_ORDERS", orderCount: 1, affectedOrderIds: [...]}`. Teacher then calls archive → succeeds. |
| M4: admin revenue stats reflects ledger | Top-up 500. Buy 100. Cash-out 50. | `/admin/revenue-stats`: topup=500 coins/50000 VND, withdrawal=50 coins/4500 VND, no regex parse errors. |
| M5: feature flag off in prod | Set `V2_ESCROW_HOOK_ENABLED=false` in marketplace yaml, restart. | Reject/hide/edit work as today; no `escrowState` updates. Other Phase 1 changes (wallet split, ledger) still active. |

### Feature flags to add for safe rollout

- `V2_SOURCE_BALANCE_ENABLED` (wallet): when off, debit still uses single `balance` and writes legacy Transaction only.
- `V2_LEDGER_DUAL_WRITE_ENABLED` (wallet): when on, also write `WalletLedgerEntry` alongside legacy Transaction.
- `V2_ESCROW_HOOK_ENABLED` (marketplace): when off, R1/R2/R3 hooks are not installed.

Recommended rollout: dev ON, prod `V2_SOURCE_BALANCE_ENABLED=false` for 1 week, then flip in stages.

---

## Open questions (decide before/while implementing)

1. **Hard-delete gate enforcement point** — block at flashcard-service via sync REST to marketplace (simpler, lower latency, error in HTTP response), or soft-delete event pattern? **Recommendation: sync REST.**
2. **`OrderItem.escrow_state` default of `HELD`** — apply to ALL existing OrderItems in a one-shot bootstrap UPDATE, or only new ones? **Recommendation: apply to all existing PAID OrderItems.**
3. **Existing `content.purchased` listener in wallet** — keep crediting teacher immediately in Phase 1, or add kill-switch flag `V2_DEFER_TEACHER_PAYOUT=true`? **Recommendation: keep; add flag in Phase 2.**
4. **Migration default for existing `balance`** — students → `bonus_balance`, teachers → `earned_withdrawable_balance` per v2 plan. Confirm teacher identification is reliable.
5. **`LEARNING_REWARD` source from day 1 or Phase 2?** **Recommendation: day 1.**
6. **Legacy `/flashcards/buy` and `/quiz-sets/buy` endpoints** — keep in Phase 1 with `@Deprecated`, or remove? **Recommendation: keep deprecated; remove in Phase 2.**
7. **Wallet `balance` legacy column** — drop after migration or keep forever? **Recommendation: keep as derived column; never read directly by client.**
8. **Admin revenue platform fee ledger** — Phase 1 has `source=PLATFORM_FEE` rows in ledger but no real admin revenue wallet. Confirm acceptable as "structured ledger only" without an actual wallet credit.

---

## Effort Estimate

| Sub-task | Files | Estimate |
|---|---|---|
| **1. Wallet source balances + ledger** (new entity, schema migration, DebitAllocationService, LedgerService, balance/breakdown endpoint, admin ledger endpoint, dual-write to legacy Transaction) | Wallet.java, WalletLedgerEntry.java, repo + service + DTOs + migration runner + tests | **5 days** |
| **2. Cash-out source restriction + admin revenue rewrite** (stop draining earned-promo, drop regex, compute from ledger) | WalletService, AdminRevenueService, AdminRevenueStatsDTO, tests | **2 days** |
| **3. Marketplace hook scaffolding** (EscrowState enum, OrderItem/Order/Product/UserInventory columns, EscrowHookService, OrderItemRepository queries, OrderService/AdminProductService/ProductEventListener call-sites) | 8-10 files + tests | **3 days** |
| **4. R1/R2/R3 controllers + product archive endpoint** | AdminOrderController (new), TeacherProductController (new), ProductController delete modifier, tests + integration test | **2 days** |
| **5. Wallet event payload upgrade + Phase 2 schema events + manual rollout smoke tests** | WalletEventListener, WalletDebitEvent, new event classes, dev config flag | **1.5 days** |
| **Total** | | **~13.5 working days (≈ 2.5–3 weeks)** |

The original V2 plan estimated Phase 1 (Protected Coin Ledger) at 1.5-2 weeks. The 3 product-rule hooks add 3-4 days. Combined: 2.5-3 weeks — slightly more than the v2 estimate, reasonable given we're landing ledger + 3 marketplace hookups in one branch with full integration testing.

---

## Critical Files for Implementation

- [src/services/wallet-service/src/main/java/com/cardy/walletService/service/WalletService.java](src/services/wallet-service/src/main/java/com/cardy/walletService/service/WalletService.java)
- [src/services/wallet-service/src/main/java/com/cardy/walletService/domain/Wallet.java](src/services/wallet-service/src/main/java/com/cardy/walletService/domain/Wallet.java)
- [src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/AdminProductService.java](src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/AdminProductService.java)
- [src/services/marketplace-service/src/main/java/com/seika/marketplace_service/consumer/ProductEventListener.java](src/services/marketplace-service/src/main/java/com/seika/marketplace_service/consumer/ProductEventListener.java)
- [src/services/marketplace-service/src/main/java/com/seika/marketplace_service/entity/OrderItem.java](src/services/marketplace-service/src/main/java/com/seika/marketplace_service/entity/OrderItem.java)
