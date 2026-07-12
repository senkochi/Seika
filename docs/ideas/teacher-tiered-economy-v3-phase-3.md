# Phase 3 — Risk Review + Wallet Holds + Admin Action Logs

Phase 3 of Teacher Tiered Economy V3 adds collusion detection, wallet enforcement, and admin audit trail per the [V3 plan](file:///f:/Microservices%20Projects/Seika/docs/ideas/teacher-tiered-economy-v3.md#L734-L742).

## User Review Required

> [!IMPORTANT]
> Phase 3 adds **new DB tables** (`collusion_flags`, `admin_action_logs`) and **new columns** to `teacher_ratings` (`consume_rate`, `refund_rate`, `approval_rejection_rate`). This requires a DB reset or manual migration.

> [!WARNING]
> The `FROZEN` wallet state already exists in the `Wallet` entity (`frozen` boolean). Phase 3 adds a `WalletHold` entity for `WASH_HOLD` enforcement which is a time-bounded hold on cash-out only. The existing `frozen` field handles full freeze (blocks all operations). Both need to coexist.

## Proposed Changes

### Component 1: Marketplace Service — CollusionFlag Entity & Enums

New entity and enum for collusion risk detection.

#### [NEW] [CollusionFlagStatus.java](file:///f:/Microservices%20Projects/Seika/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/enums/CollusionFlagStatus.java)

Enum: `SUSPICIOUS`, `CONFIRMED`, `MALICIOUS`, `DISMISSED`

#### [NEW] [CollusionFlag.java](file:///f:/Microservices%20Projects/Seika/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/entity/CollusionFlag.java)

Entity with fields: `id`, `teacherId`, `buyerId`, `riskScore`, `transactionCount`, `promoBackedRatio`, `noConsumeRatio`, `reciprocalRatio`, `reviewVelocityAbnormal`, `status`, `adminId`, `adminReason`, `resolvedAt`, `createdAt`, `updatedAt`. Indexes on `(teacherId, buyerId)`, `status`.

#### [NEW] [CollusionFlagRepository.java](file:///f:/Microservices%20Projects/Seika/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/repository/CollusionFlagRepository.java)

Queries: `findByStatus`, `findByTeacherIdOrBuyerId`, `existsByTeacherIdAndBuyerIdAndStatusIn`.

> **Comment:** Nên cân nhắc lưu thêm phạm vi dữ liệu dùng để chấm điểm, ví dụ `lookbackStart`, `lookbackEnd`, `lastEvaluatedAt`. Khi admin mở chi tiết flag, các trường này giúp giải thích vì sao cặp buyer/seller bị đánh dấu, và tránh việc sau này dữ liệu thay đổi làm score hiện tại khó truy vết.

---

### Component 2: Marketplace Service — AdminActionLog Entity

Audit trail for all admin manual decisions per the plan (Flow 6, Flow 9).

#### [NEW] [AdminActionLog.java](file:///f:/Microservices%20Projects/Seika/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/entity/AdminActionLog.java)

Fields: `id`, `adminId`, `actionType`, `targetType`, `targetId`, `reason`, `metadata` (JSON string for context), `createdAt`. Index on `adminId`, `targetType+targetId`.

#### [NEW] [AdminActionLogRepository.java](file:///f:/Microservices%20Projects/Seika/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/repository/AdminActionLogRepository.java)

#### [NEW] [AdminActionLogService.java](file:///f:/Microservices%20Projects/Seika/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/AdminActionLogService.java)

Simple `log(adminId, actionType, targetType, targetId, reason, metadata)` method. Called from EscrowService admin methods and CollusionFlagService.

---

### Component 3: Marketplace Service — CollusionFlagService (Risk Score Job)

Daily job computing risk score from 30-day data per Flow 9.

#### [NEW] [CollusionFlagService.java](file:///f:/Microservices%20Projects/Seika/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/CollusionFlagService.java)

**Risk score formula** (from the plan):

```
riskScore =
  25 if transactionCount > COLLUSION_TX_THRESHOLD
+ 25 if promoBackedRatio > 0.6
+ 20 if noConsumeRatio > 0.7
+ 15 if reciprocalRatio > 0.7
+ 15 if reviewVelocity abnormal
```

**Scheduled job** (`@Scheduled`): queries distinct `(seller, buyer)` pairs from escrow transactions within lookback window, computes metrics, creates `CollusionFlag` with status `SUSPICIOUS` if `riskScore >= COLLUSION_RISK_THRESHOLD`.

> **Comment:** Khi tạo mới `SUSPICIOUS` flag, kế hoạch nên nói rõ các review `VALID` hiện có trong lookback window của cặp `(seller, buyer)` có được chuyển sang `PENDING_RISK_REVIEW` hay không. Nếu chỉ xử lý review được tạo sau thời điểm có flag, teacher rating có thể vẫn đang tính các review nghi ngờ trước đó, lệch với mục tiêu Flow 9 trong V3.
>
> **Comment:** Nên đưa `COLLUSION_TX_THRESHOLD`, `COLLUSION_RISK_THRESHOLD`, các ratio threshold và lookback days vào `MarketplaceConfig`/application config thay vì hardcode. Đồng thời định nghĩa chính xác từng metric: mẫu số của `promoBackedRatio`, thế nào là `noConsumeRatio`, cách nhận diện reciprocal trade, và điều kiện `reviewVelocityAbnormal`. Phần này càng rõ thì test càng ít mơ hồ.

**Admin action methods:**

- `confirmCollusion(flagId, adminId, reason)` → status `CONFIRMED`, linked reviews → `EXCLUDED_WASH`, publish `wallet.hold.requested` for seller `WASH_HOLD`
- `markMalicious(flagId, adminId, reason)` → status `MALICIOUS`, publish `wallet.freeze.requested` for both buyer and seller
- `dismissFlag(flagId, adminId, reason)` → status `DISMISSED`, linked `PENDING_RISK_REVIEW` reviews → `VALID`

> **Comment:** Các admin action nên là idempotent theo `flagId + actionType`. Nếu admin double-click hoặc outbox publish lại event, hệ thống không nên tạo nhiều hold/freeze trùng hoặc ghi nhiều quyết định mâu thuẫn. Có thể enforce bằng status transition hợp lệ và idempotency key trong event.
>
> **Comment:** Nên bổ sung notification event sau khi `CONFIRMED` hoặc `MALICIOUS`, vì kế hoạch V3 có nói admin quyết định cần thông báo cho user bị ảnh hưởng. Ví dụ: seller bị WASH_HOLD, buyer/seller bị FROZEN, hoặc review bị loại khỏi rating.

---

### Component 4: Marketplace Service — TeacherRating Phase 3 Upgrade

#### [MODIFY] [TeacherRating.java](file:///f:/Microservices%20Projects/Seika/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/entity/TeacherRating.java)

Add 3 new columns: `consumeRate` (BigDecimal), `refundRate` (BigDecimal), `approvalRejectionRate` (BigDecimal) with defaults of 0.

#### [MODIFY] [TeacherRatingService.java](file:///f:/Microservices%20Projects/Seika/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/TeacherRatingService.java)

- `recompute()` now also calculates `consumeRate`, `refundRate`, `approvalRejectionRate` from escrow/inventory/product data.
- `calculateTier()` uses the full 5-metric rules for SILVER/GOLD/ELITE per Phase 3 tier table.

> **Comment:** Nên ghi rõ công thức cho 3 metric mới để tránh mỗi service hiểu khác nhau. Ví dụ `consumeRate = consumed purchases / completed purchases`, `refundRate = refunded escrows / completed or resolved escrows`, `approvalRejectionRate = rejected products / submitted products`. Nếu denominator bằng 0 thì cũng cần quy ước rõ là 0, null, hay bỏ qua metric.
>
> **Comment:** Khi review bị đổi sang `PENDING_RISK_REVIEW`, `EXCLUDED_WASH`, hoặc được restore về `VALID`, cần trigger recompute teacher rating cho seller liên quan. Nếu không, tier có thể stale dù trạng thái review đã đúng.

---

### Component 5: Marketplace Service — Review Risk Integration

#### [MODIFY] [ReviewService.java](file:///f:/Microservices%20Projects/Seika/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/ReviewService.java)

When creating a review, check if an active `SUSPICIOUS` collusion flag exists for the `(sellerId, buyerId)` pair. If so, set review status to `PENDING_RISK_REVIEW` instead of `VALID`.

> **Comment:** Nên dùng cùng một query/utility để lấy "active risk flag" cho cả review mới và job chuyển review cũ sang `PENDING_RISK_REVIEW`. Như vậy rule giữa realtime flow và scheduled risk job không bị lệch.

---

### Component 6: Marketplace Service — Admin Collusion Controller

#### [NEW] [CollusionFlagController.java](file:///f:/Microservices%20Projects/Seika/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/controller/CollusionFlagController.java)

Admin APIs:

```
GET  /api/marketplace/admin/collusion-flags?status=SUSPICIOUS
GET  /api/marketplace/admin/collusion-flags/{id}
POST /api/marketplace/admin/collusion-flags/{id}/action
```

All `@PreAuthorize("hasRole('ADMIN')")`.

> **Comment:** API action nên có request body rõ ràng, ví dụ `{ "action": "CONFIRM_COLLUSION" | "MARK_MALICIOUS" | "DISMISS", "reason": "..." }`, và validate bắt buộc `reason`. Đây là dữ liệu audit quan trọng, nên không nên cho phép reason rỗng.

---

### Component 7: Wallet Service — WalletHold Entity & Hold Enforcement

#### [NEW] [WalletHold.java](file:///f:/Microservices%20Projects/Seika/src/services/wallet-service/src/main/java/com/cardy/walletService/domain/WalletHold.java)

Fields: `id`, `userId`, `holdType` (`WASH_HOLD`), `reason`, `createdBy`, `expiresAt`, `active`, `createdAt`. Index on `userId+active`.

#### [NEW] [WalletHoldRepository.java](file:///f:/Microservices%20Projects/Seika/src/services/wallet-service/src/main/java/com/cardy/walletService/repository/WalletHoldRepository.java)

#### [MODIFY] [WalletService.java](file:///f:/Microservices%20Projects/Seika/src/services/wallet-service/src/main/java/com/cardy/walletService/service/WalletService.java)

- Cash-out method checks for active `WASH_HOLD` and rejects if present.
- New methods: `applyWashHold(userId, reason, durationDays, createdBy)`, `applyFreeze(userId, reason, createdBy)`, `removeFreeze(userId, createdBy)`.

#### [MODIFY] [WalletEventListener.java](file:///f:/Microservices%20Projects/Seika/src/services/wallet-service/src/main/java/com/cardy/walletService/consumer/WalletEventListener.java)

Listen for `wallet.hold.requested` and `wallet.freeze.requested` events from marketplace and call the corresponding WalletService methods.

> **Comment:** Wallet listener cần xử lý duplicate event. Event nên có `eventId`/`idempotencyKey`, `flagId`, `targetUserId`, `reason`, `createdBy`, `expiresAt` hoặc `durationDays`, và wallet-service nên lưu dấu đã xử lý hoặc enforce unique active hold theo `userId + holdType + sourceFlagId`.

#### [MODIFY] [RabbitMQConfig.java](file:///f:/Microservices%20Projects/Seika/src/services/wallet-service/src/main/java/com/cardy/walletService/config/RabbitMQConfig.java)

Add binding for `wallet.hold.*` and `wallet.freeze.*` routing keys.

> **Comment:** Nên bổ sung API user-facing `GET /api/wallet/holds/me` để app biết vì sao cash-out bị chặn và hold hết hạn khi nào. Nếu không có endpoint này, frontend chỉ nhận lỗi cash-out nhưng không có dữ liệu để hiển thị trạng thái hold rõ ràng.
>
> **Comment:** Với `FROZEN`, kế hoạch nên liệt kê chính xác các operation bị block: top-up, spend, cash-out, receive reward, escrow release/refund, hay internal adjustment. Vì freeze "blocks all operations" có thể va vào các luồng bắt buộc như refund cho người dùng vô tội, nên cần quyết định rõ exception nếu có.

---

### Component 8: Marketplace Service — Wallet Hold/Freeze Event Publishing

#### [NEW] [WalletHoldRequestedEvent.java](file:///f:/Microservices%20Projects/Seika/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/event/WalletHoldRequestedEvent.java)

#### [NEW] [WalletFreezeRequestedEvent.java](file:///f:/Microservices%20Projects/Seika/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/event/WalletFreezeRequestedEvent.java)

Published via outbox from CollusionFlagService when admin confirms/marks malicious.

> **Comment:** Payload event nên được thiết kế như contract ổn định giữa marketplace-service và wallet-service. Tối thiểu nên có `eventId`, `idempotencyKey`, `flagId`, `actionType`, `targetUserId`, `reason`, `adminId`, `occurredAt`, và với hold thì thêm `holdType` + `expiresAt`/`durationDays`.

---

### Component 9: Existing Admin EscrowService — Add AdminActionLog

#### [MODIFY] [EscrowService.java](file:///f:/Microservices%20Projects/Seika/src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/EscrowService.java)

Inject `AdminActionLogService` and call `log()` from `adminFullRefund`, `adminForceRelease`, `adminNoRefund`.

> **Comment:** Vì phần mô tả nói audit trail cho "all admin manual decisions", scope hiện tại vẫn hơi hẹp. Nên thêm log cho collusion actions, product approve/reject/hide, và các quyết định admin khác đã tồn tại trong marketplace-service; hoặc ghi rõ Phase 3 chỉ cover escrow + collusion để tránh kỳ vọng sai.

---

## Verification Plan

### Automated Tests

**Unit tests (TDD — write first, then implement):**

| Test Class                          | Tests                                                                                               | Service             |
| ----------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------- |
| `CollusionRiskScoreTest`            | Risk score formula: all 5 factors, threshold boundary, zero score                                   | marketplace-service |
| `TeacherRatingServiceTest` (extend) | 5-metric tier calculation for SILVER/GOLD/ELITE with consumeRate, refundRate, approvalRejectionRate | marketplace-service |
| `WalletHoldEnforcementTest`         | WASH_HOLD blocks cash-out, allows spend/top-up; FROZEN blocks all                                   | wallet-service      |

```bash
mvn -pl src/services/marketplace-service "-Dtest=CollusionRiskScoreTest,TeacherRatingServiceTest" test
mvn -pl src/services/wallet-service "-Dtest=WalletHoldEnforcementTest,WalletSourceAllocatorTest" test
```

> **Comment:** Nên thêm test cho các case còn thiếu: job tạo `SUSPICIOUS` chuyển review cũ sang `PENDING_RISK_REVIEW`, admin confirm chuyển review sang `EXCLUDED_WASH` và recompute rating, wallet event duplicate không tạo hold/freeze trùng, `GET /api/wallet/holds/me`, và config threshold override.

### Manual Verification

- Docker Compose up → verify new tables created (`collusion_flags`, `admin_action_logs`, `wallet_holds`, new columns on `teacher_ratings`)
- Register test users and verify existing Phase 1/2 flows still work
