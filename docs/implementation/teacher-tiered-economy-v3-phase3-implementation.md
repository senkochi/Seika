# Teacher Tiered Economy V3 Phase 3 Implementation Report

## Overview

Phase 3 of `teacher-tiered-economy-v3.md` has been implemented across `marketplace-service` and `wallet-service` adhering strictly to standard coding guidelines (`CODING_STANDARDS.md`) and following Spec-Driven, Test-Driven (TDD), and Source-Driven methodologies.

Phase 3 establishes the **Risk Review, Collusion/Wash Trading Detection, Advanced Tier Evaluation (5 Metrics), Admin Governance & Audit Logging, and Account Cash-Out Hold Protection** layer of the Seika Teacher Tiered Economy.

---

## 1. Advanced 5-Metric Tier Evaluation (`marketplace-service`)

### Extended Metrics & Entity Changes

Extended `TeacherRating` entity (`com.seika.marketplace_service.entity.TeacherRating`) with Phase 3 multi-axis tier metrics:

- `consumeRate`: Ratio of consumed units (`content.consumed`) vs total active inventory purchases.
- `refundRate`: Ratio of refunded transactions vs total escrow transactions.
- `approvalRejectionRate`: Ratio of rejected product submissions vs total submissions.

### Tier Calculation Matrix (`TeacherRatingService`)

Refactored `TeacherRatingService.recompute(teacherId)` and overloaded `calculateTier` to evaluate all 5 V3 metrics:

- **GOLD**: `averageRating >= 4.8`, `validReviewCount >= 50`, `consumeRate >= 0.85`, `refundRate <= 0.05`, `approvalRejectionRate <= 0.10`.
- **SILVER**: `averageRating >= 4.5`, `validReviewCount >= 20`, `consumeRate >= 0.70`, `refundRate <= 0.10`, `approvalRejectionRate <= 0.20`.
- **BRONZE**: `averageRating >= 4.0`, `validReviewCount >= 5`, `consumeRate >= 0.50`, `refundRate <= 0.15`, `approvalRejectionRate <= 0.30`.
- **STANDARD**: Base tier when metrics do not satisfy Bronze thresholds.

---

## 2. Collusion & Wash Trading Risk Detection (`marketplace-service`)

### Entities & Enums

- **`CollusionFlagStatus`**: Lifecycle states (`SUSPICIOUS`, `CONFIRMED`, `MALICIOUS`, `DISMISSED`).
- **`CollusionFlag`**: Risk trace entity recording:
  - Buyer/Seller pair (`teacherId`, `buyerId`).
  - Risk Score (`riskScore`, 0–100 capped).
  - Risk factors: `transactionCount`, `promoBackedRatio`, `noConsumeRatio`, `reciprocalRatio`, `reviewVelocityAbnormal`.
  - Traceability window: `lookbackStart`, `lookbackEnd`, `lastEvaluatedAt` (addressing audit feedback on score drift).
  - Resolution audit fields: `adminId`, `adminReason`, `resolvedAt`.

### Risk Engine & Retroactive Review Handling (`CollusionFlagService`)

- Evaluates buyer-seller interactions over a lookback window (`30 days`).
- Flags pair as `SUSPICIOUS` if composite risk score `>= 50`.
- **Retroactive Review Exclusion**: When a `SUSPICIOUS` flag is created:
  - Existing `VALID` reviews between the buyer and teacher in the lookback window are transitioned to `PENDING_RISK_REVIEW`.
  - Triggers `TeacherRatingService.recompute(teacherId)` immediately so teacher rating/tier no longer benefits from suspicious wash reviews.

---

## 3. Review Submission Safeguard (`ReviewService`)

Updated `ReviewService.createReview()`:

- Checks if an active `SUSPICIOUS` or `CONFIRMED` flag exists for `(sellerId, buyerId)`.
- If active risk flag exists, new reviews are automatically assigned `ReviewStatus.PENDING_RISK_REVIEW` instead of `VALID`.

---

## 4. Admin Governance & Audit Logging

### Central Admin Audit Logging (`AdminActionLogService`)

- **`AdminActionLog`**: Records every manual admin intervention (`adminId`, `actionType`, `targetType`, `targetId`, `reason`, `metadata`).
- All manual decisions enforce non-empty reason validation.

### Admin Collusion Controller (`AdminCollusionController`)

Endpoints under `/api/marketplace/admin/collusion-flags`:

- `GET /api/marketplace/admin/collusion-flags?status={status}&page={page}&size={size}`: Paginated inspection of flags.
- `POST /api/marketplace/admin/collusion-flags/{flagId}/action`:
  - Enforces mandatory reason in request body (`CollusionActionRequest`).
  - Supported actions:
    - **`CONFIRM_COLLUSION`**: Sets status to `CONFIRMED` (idempotent).
    - **`MARK_MALICIOUS`**: Sets status to `MALICIOUS`, transitions all `PENDING_RISK_REVIEW` reviews between pair to `EXCLUDED_WASH`, recomputes teacher tier, and places/triggers wallet hold.
    - **`DISMISS`**: Sets status to `DISMISSED`, restores `PENDING_RISK_REVIEW` reviews to `VALID`, and recomputes teacher tier.

---

## 5. Account Cash-Out Hold Enforcement (`wallet-service`)

### Wallet Hold Entity & Repository (`WalletHold`)

- Records active holds (`WASH_HOLD`, etc.) against a `userId` with optional `expiresAt`, `sourceFlagId`, and `reason`.
- Prevents duplicate holds via `sourceFlagId` idempotency check.

### Cash-Out Blocking (`WalletHoldService` & `WalletService`)

- `WalletHoldService.canCashOut(userId)` verifies whether any active non-expired hold exists.
- `WalletService.cashOut(...)` checks `canCashOut(userId)` before processing cash-out requests; throws an explicit exception if blocked.
- Added public user endpoint: `GET /api/wallet/holds/me` (`WalletHoldController`) for teachers to inspect active holds on their wallet.

### Cross-Service Asynchronous Integration (`CollusionEventConsumer`)

- Consumes `CollusionFlaggedEvent` from RabbitMQ queue `wallet.collusion.flags.queue`.
- Automatically places a `30-day` `WASH_HOLD` on the teacher's wallet when a collusion flag transitions to `CONFIRMED` or `MALICIOUS`.

---

## 6. Test Suite & Verification

Verified using automated JUnit 5 / Mockito unit tests across services:

### `marketplace-service` Tests

- **`TeacherRatingServiceTest`**:
  - Validates 5-metric tier thresholds across `GOLD`, `SILVER`, `BRONZE`, and `STANDARD`.
  - Verifies tier degradation when consume rate or refund rate fails thresholds.
- **`CollusionFlagServiceTest`**:
  - Verifies risk score computation and capping (`computeRiskScore`).
  - Verifies retroactive review transition (`VALID -> PENDING_RISK_REVIEW`) and rating recomputation on flag creation.
  - Verifies idempotency of admin confirmation actions.
- **`ReviewServiceTest`**:
  - Verifies that new reviews are assigned `PENDING_RISK_REVIEW` when an active collusion flag exists.

### `wallet-service` Tests

- **`WalletHoldServiceTest`**:
  - Verifies that an active `WASH_HOLD` blocks cash-out attempts (`canCashOut -> false`).
  - Verifies that expired holds permit cash-out (`canCashOut -> true`).
