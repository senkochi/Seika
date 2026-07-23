# Seika V3 Audit Remediation Review — Verified Verdict

**Scope:** Verify từng finding trong `docs/implementation/teacher-tiered-economy-v3-audit-remediation-review.md` (do một Agent khác viết) bằng cách đọc code thực tế trên `cuong/dev`, kèm đánh giá mức độ nghiêm trọng thực sự và quyết định "có nên fix hay không".

**Phương pháp:** Đọc trực tiếp từng file:line được review trích dẫn. Kết luận "confirmed" = claim khớp với code. Kết luận "rejected" = claim sai về mặt sự kiện. Kết luận "mis-attributed" = quan sát đúng nhưng review gán nhầm commit/nguyên nhân.

**Nguyên tắc chấm:** Theo CLAUDE.md và code-review-and-quality skill — chỉ flag finding có khả năng gây sai nghiệp vụ, mất tiền, hoặc irrecoverable state. Cosmetic / cleanup / refactor không nằm trong nhóm "phải fix trước merge".

---

## Tổng quan

| Mức độ | Số lượng | Items |
|---|---|---|
| 🔴 Block merge | 2 | C-1, R-3+R-6 (combo) |
| 🟠 Nên fix cùng PR | 5 | R-1, R-2, R-7, R-9, R-10 |
| 🟡 P2 follow-up | 3 | R-4, R-5, R-8 |
| ⚪ Bỏ qua / Nit / Cleanup | 10+ | §3, R-11 → R-16, "Vietnamese→English regression" |

**Headline:** Review của Agent khác phát hiện đúng phần lớn các bug mới phát sinh trong đợt remediation, nhưng có **1 quan sát quan trọng bị gán nhầm commit** (Vietnamese→English regression thực ra từ phase-3 commit trước đó, không phải từ `e44fec1`). Không có finding nào bị "bịa" ra — đáng tin cậy về mặt kỹ thuật.

---

## 🔴 Block merge — Phải fix

### C-1. `reciprocalRatio` luôn bằng 0

**File:** [CollusionFlagService.java:124-143](src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/CollusionFlagService.java#L124-L143)

**Trạng thái:** Confirmed.

Code ở L129 đưa vào map với key `Pair(sellerId, buyerId)`. Code ở L142 lookup với key `Pair(pair.buyerId(), pair.teacherId())` — **đảo thứ tự tham số**, `Pair` constructor không sort nên hai key khác nhau. `getOrDefault(...)` luôn trả về `List.of()`, `reciprocalRatio = 0`, **+15 risk-score không bao giờ được cộng**.

Test `scheduledRiskScanCreatesSuspiciousFlagFromRecentEscrows` chỉ seed 1 cặp escrow nên không bắt được bug. Đây là code mới viết trong remediation cycle này, không phải legacy.

**Tại sao nghiêm trọng:** Đây là core của Phase 3 risk detection. Nếu không fix thì wash-trade bilateral không bao giờ vượt threshold → flag hợp lệ bị bỏ sót, hoặc risk score luôn thiếu 15 điểm → flag bị under-trigger.

**Đề xuất fix:** Canonicalize `Pair` (sort theo `min, max`) hoặc duyệt 2 chiều. Cũng nên thêm test seed cả hai chiều escrow (A→B và B→A) để bắt bug này.

---

### R-3 + R-6 (combo) — Freeze không thể gỡ + exception bị nuốt

**Files:**
- [CollusionEventConsumer.java:53-55](src/services/wallet-service/src/main/java/com/cardy/walletService/consumer/CollusionEventConsumer.java#L53-L55) — catch-all
- [WalletService.java:334-349](src/services/wallet-service/src/main/java/com/cardy/walletService/service/WalletService.java#L334-L349) — `removeFreeze` định nghĩa nhưng không ai gọi

**Trạng thái:** Cả hai đều Confirmed.

**R-3:** Grep `removeFreeze\|unfreeze\|Unfreeze` toàn repo chỉ trả về 1 hit, là chính method definition. Không có `@RestController` nào expose, không có scheduler, không có consumer nào gọi. Khi `MARK_MALICIOUS` → buyer và teacher bị freeze **vĩnh viễn** cho đến khi deploy code mới.

**R-6:** `catch (Exception e) { log.error(...) }` ở L53 nuốt mọi exception. Spring AMQP ack message sau khi log. Không có rethrow, không có DLT.

**Tại sao nghiêm trọng:** Combo này tạo irrecoverable state. Một transient DB hiccup trên `applyFreeze` (ví dụ constraint violation, lock timeout) → log error → message được ack → teacher đã freeze, buyer không (xem R-7) → không có cách nào unfreeze ngoài manual SQL intervention. Đây là trap có thể bite bất cứ lúc nào trong production.

**Đề xuất fix:**
- Thêm `POST /api/wallet/admin/freeze` + `POST /api/wallet/admin/unfreeze` với `@PreAuthorize("hasRole('ADMIN')")`.
- Trong consumer: rethrow exception thay vì nuốt; bind DLT (`x-dead-letter-exchange`) để poison messages đi vào queue riêng cho investigation.

---

## 🟠 Nên fix cùng PR (Correctness gap)

### R-1. `transitionValidReviewsToPending` không filter theo lookback window

**File:** [CollusionFlagService.java:284-294](src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/CollusionFlagService.java#L284-L294)

**Trạng thái:** Confirmed.

`transitionValidReviewsToPending` gọi `findBySellerIdAndBuyerIdAndStatus(...)` ([ReviewRepository.java:21](src/services/marketplace-service/src/main/java/com/seika/marketplace_service/repository/ReviewRepository.java#L21)) — không có filter `createdAt >= lookbackStart`. Mỗi flag mới sẽ chuyển **toàn bộ** review `VALID` của cặp teacher-buyer sang `PENDING_RISK_REVIEW`, không chỉ trong 30 ngày gần nhất.

Audit gốc §6.4 đã flag; remediation plan §2.1 yêu cầu fix. Code vẫn chưa filter.

**Tại sao nghiêm trọng:** Sai nghiệp vụ — một review 2 năm trước có thể bị kéo về `PENDING_RISK_REVIEW` và làm hạ tier của teacher hiện tại. Tier recompute ở L292 cũng chạy trên toàn bộ reviews, không chỉ trong window.

**Đề xuất fix:** Thêm query method `findBySellerIdAndBuyerIdAndStatusAndCreatedAtGreaterThanEqual(...)` hoặc filter post-query. Pass `lookbackStart` xuống `transitionValidReviewsToPending`.

---

### R-7. `applyFreeze` teacher thành công, buyer không freeze và im lặng

**File:** [CollusionEventConsumer.java:44-51](src/services/wallet-service/src/main/java/com/cardy/walletService/consumer/CollusionEventConsumer.java#L44-L51)

**Trạng thái:** Confirmed.

Code ở L46: `UUID.fromString(event.getBuyerId())`. Nếu `event.getBuyerId() == null` → `UUID.fromString(null)` throw NPE → catch-all ở L53 nuốt → message được ack. Nhưng L48 (`applyFreeze` teacher) chạy **trước** L49 (`applyFreeze` buyer) → teacher đã freeze thành công, buyer thì không.

**Tại sao nghiêm trọng:** Trong kịch bản `MARK_MALICIOUS`, một bên wallet được freeze, một bên không. Kết hợp R-3 + R-6, bên không freeze vẫn hoạt động bình thường, bên còn lại irrecoverable. Audit trail nói "MALICIOUS: both wallets frozen" nhưng thực tế chỉ một bên.

**Đề xuất fix:** Validate `event.getBuyerId()` lên đầu method (throw / return sớm nếu null). Hoặc wrap cả 2 `applyFreeze` trong một `@Transactional` boundary để rollback teacher nếu buyer fail.

---

### R-2. `requestPartialRefund` không null `creditRequestedAt`

**File:** [EscrowService.java:208-245](src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/EscrowService.java#L208-L245)

**Trạng thái:** Confirmed.

So sánh:
- `adminForceRelease` (L184-196): có `escrow.setCreditRequestedAt(null)` ở L191 trước khi gọi `requestRelease(escrow)`.
- `requestPartialRefund` (L208-245): không có dòng nào null `creditRequestedAt`.

**Tại sao nghiêm trọng:** Nếu `EscrowReleaseJob` đã gửi `wallet.credit.requested` cho escrow đó, rồi admin partial-refund, cả credit + refund sẽ được wallet xử lý song song. Wallet có idempotency dedupe nhưng escrow state không còn nhất quán — `status = PENDING_ADMIN_DECISION` (do partial-refund set ở L241) trong khi `creditRequestedAt` vẫn còn timestamp → admin decision queue có thể thấy record ở state lẫn lộn.

**Đề xuất fix:** Thêm `escrow.setCreditRequestedAt(null);` ngay sau refund validation, mirror pattern của `adminForceRelease`.

---

### R-9. Self-service refund button không check `escrow.buyerId === userId`

**File:** [ProductDetail.tsx:187](src/web-app/src/pages/student/ProductDetail.tsx#L187)

**Trạng thái:** Confirmed.

```ts
const canRefund = canRequestSelfServiceRefund(escrow, ownedInventory);
```

`canRequestSelfServiceRefund` ở L115-123 chỉ check các điều kiện state (escrow status, needsAdminDecision, refundRequestedAt, creditRequestedAt). Không so khớp `escrow.buyerId` với `userId` lấy từ Redux store ở L128.

**Tại sao nghiêm trọng:** Backend enforce (`EscrowService.requestSelfServiceRefund` check buyerId match), nhưng UI nên defense-in-depth. Nếu backend có bug hoặc cache stale, user có thể thấy refund button cho escrow không phải của họ → click → 403 từ backend → UX tệ.

**Đề xuất fix:** `canRefund = canRequestSelfServiceRefund(...) && escrow.buyerId === userId`.

---

### R-10. Review form cho phép seller tự review

**File:** [ProductDetail.tsx:553-558](src/web-app/src/pages/student/ProductDetail.tsx#L553-L558)

**Trạng thái:** Confirmed.

`!owned` chỉ check user đã mua. Không check `product.sellerUserId !== userId`. Một teacher vào trang sản phẩm của chính mình, mua bằng tài khoản phụ (hoặc test scenario), có thể submit review.

**Tại sao nghiêm trọng:** Đây chính là tín hiệu wash-trade mà `CollusionFlagService` đang cố bắt (xem C-1). Mặc dù backend có thể có check, việc cho phép UI hiển thị review form cho seller-self là sai pattern.

**Đề xuất fix:** Disable review form hoặc hide nó khi `product.sellerUserId === userId`. Verify backend cũng enforce.

---

## 🟡 P2 follow-up — Event reliability hardening

### R-4. Wallet outbox không có row claim lock

**File:** [WalletOutboxProcessor.java:25-47](src/services/wallet-service/src/main/java/com/cardy/walletService/processor/WalletOutboxProcessor.java#L25-L47)

**Trạng thái:** Confirmed.

Processor gọi `findTop50ByStatusInOrderByCreatedAtAsc(PENDING, FAILED)`. Không có `SELECT ... FOR UPDATE SKIP LOCKED`, không có `CLAIMED` state. Hai scheduler tick (nếu interval ngắn) hoặc hai replica có thể pick cùng row, cả hai publish lên RabbitMQ.

**Tại sao không block merge:** Hiện tại single-instance, `fixedDelayString = 3000` đủ dài để không overlap. Sẽ bite khi scale horizontal.

**Đề xuất fix:** Thêm `CLAIMED` state + `UPDATE ... SET status=CLAIMED, claimed_at=... WHERE id=? AND status IN (PENDING, FAILED) RETURNING *` với `@Modifying` query. Hoặc dùng `@Lock(PESSIMISTIC_WRITE)` + `SKIP_LOCKED` hint.

---

### R-5. Outbox không có publisher-confirms, DLQ, retry cap

**File:** [WalletOutboxProcessor.java:32-44](src/services/wallet-service/src/main/java/com/cardy/walletService/processor/WalletOutboxProcessor.java#L32-L44)

**Trạng thái:** Confirmed.

- Không có `spring.rabbitmq.publisher-confirm-type: correlated`.
- Không có `publisher-returns: true` để detect broker-accept-without-route.
- Enum `WalletOutboxStatus` ([line 1-7](src/services/wallet-service/src/main/java/com/cardy/walletService/enums/WalletOutboxStatus.java#L1-L7)) chỉ có `PENDING, SENT, FAILED` — không có `DEAD`.
- Entity có `retryCount` (tăng mỗi lần fail) nhưng không có ceiling.

**Tại sao không block merge:** Poison event hiếm gặp trong pilot. Nhưng khi gặp sẽ republish mãi mãi mỗi 3s, log spam.

**Đề xuất fix:** Enable publisher-confirms + returns; thêm `DEAD` state + `nextAttemptAt` + retry cap (10 lần chẳng hạn); bind DLT.

---

### R-8. Profile `teacher.tier.updated` không có eventId-level idempotency

**File:** [TeacherStatsConsumer.java:92-121](src/services/profile-service/src/main/java/com/seika/profile_service/consumer/TeacherStatsConsumer.java#L92-L121)

**Trạng thái:** Confirmed.

Consumer parse event, lookup profile, `setTeacherTier(event.getTier())` rồi save. Không có:
- InboxEvent table để dedupe theo `eventId`.
- `lastEventId` / version column trên `TeacherProfile` để reject out-of-order.

**Tại sao không block merge:** Tier recompute ở marketplace idempotent (cùng input → cùng output tier), nên duplicate delivery không gây sai giá trị cuối cùng. Out-of-order mới bite (event ELITE đến sau GOLD).

**Đề xuất fix:** Thêm `InboxEvent` table tương tự marketplace-service, dedupe theo `eventId`. Hoặc thêm `teacherTierUpdatedEventId` column trên `TeacherProfile` để guard.

---

## ⚪ Có thể bỏ qua — Nit / cleanup / mis-attribution

### "Vietnamese→English regression" trên Marketplace.tsx

**Review claim:** Commit `e44fec1` "Fix UI bugs" đã convert strings "Browse teacher-made flashcard decks...", "Refresh", "Loading products...", "Not enough coins..." sang tiếng Anh.

**Trạng thái:** Mis-attributed.

**Bằng chứng:**
- `git show e44fec1 --stat` chỉ touch `Input.tsx` và `index.css` (7+27 dòng).
- `git blame -L 146,165 src/web-app/src/pages/student/Marketplace.tsx` cho thấy:
  - L150 "Browse teacher-made flashcard decks..." — commit `1d8618d` (phase 3 product management), author NguyenHungCuongg.
  - L162 "Refresh" — commit `c338199c` (redesign shared primitives), author cuongnh.
  - "Loading products..." ở L177 — commit `c338199c`.

**Quan sát ngầm (UI tiếng Anh thay vì tiếng Việt) là thật** — nhưng đã tồn tại từ phase 3 trước đó, không phải do remediation cycle này gây ra. Nếu bạn muốn chuẩn hóa Vietnamese UI theo CLAUDE.md, đây là cleanup P3 chứ không phải regression.

---

### R-11 → R-16 — Structural / cleanup

| ID | Mô tả | Đánh giá |
|---|---|---|
| R-11 | Split `ProductDetail.tsx` (629 dòng) + de-duplicate helpers với `Marketplace.tsx` | Có thật, nhưng decomposition ~half day. Cân nhắc trong tech-debt pass, không block merge. |
| R-12 | Collapse 3 enqueue methods `WalletCommandOutboxService` thành 1 generic | Nit. Code smell nhỏ, generic method có thể over-abstract. |
| R-13 | `MarketplaceItemCard.tsx` / `MarketplaceOfferCard.tsx` orphaned | Có thật. Quyết định: **wire hoặc xóa** — không thiên về phía nào. Wire sẽ tốt hơn vì DTO đã có fields denormalized sẵn. |
| R-14 | `window.prompt` ở `AdminMarketplaceRiskPanel.tsx:146,168` | Cosmetic. Thay bằng MUI dialog khi rảnh. |
| R-15 | Archive / hard-delete UI missing (`marketplace.ts` không có `archiveProduct` / `hardDeleteProduct`) | Đúng, nhưng backend endpoint tồn tại. Cần button + flow trong `ContentManager.tsx`. P1 theo plan, P3 theo thực tế MVP. |
| R-16 | `partialRefundEscrow` có backend (`admin.ts:252-262`), không có UI button | Đúng, nhưng vì R-3 chưa fix xong thì cũng chưa ai dùng được → thêm button sau. |

---

### §3 "Audit items still open" — phần lớn cleanup / cosmetic

| Item | Tại sao có thể bỏ qua |
|---|---|
| `/admin/ledger` vs `/admin/transactions` rename | Chỉ là naming. Hai path cùng trả data ledger. Đổi tên khi có lý do nghiệp vụ. |
| Phase 2 doc vs code tier divergence | Doc sai, code đúng theo V3 plan canonical. Cập nhật doc khi rảnh. |
| `*_SET_UPDATED_ROUTING_KEY` constants + typed DTO | Refactor thuần tuý. Không bug. |
| identity-service `role-change` event | Cải tiến tương lai. MVP không cần. |
| `window.prompt` → MUI dialog | Trùng R-14. |
| §6.6, §6.7 | Trùng các mục trên. |

---

## Quyết định đề xuất

### Phải fix trước khi merge PR remediation

1. **C-1** — Canonicalize `Pair` key trong `CollusionFlagService.scanRecentEscrowsForCollusion`. Thêm test seed 2 chiều escrow.
2. **R-3** — Thêm `POST /api/wallet/admin/freeze` + `/unfreeze` với `@PreAuthorize("hasRole('ADMIN')")`.
3. **R-6** — Rethrow exception trong `CollusionEventConsumer`, bind DLT.

### Nên gộp cùng PR (effort ~half day)

4. **R-1** — Filter `createdAt >= lookbackStart` trong `transitionValidReviewsToPending`.
5. **R-7** — Validate `event.getBuyerId()` trước `applyFreeze` calls.
6. **R-2** — Null `creditRequestedAt` trong `requestPartialRefund`.
7. **R-9** — `canRefund = ... && escrow.buyerId === userId`.
8. **R-10** — Disable review form khi `product.sellerUserId === userId`.

### Backlog P2 (sau khi merge xong)

9. R-4 — Outbox row claim lock với `CLAIMED` state.
10. R-5 — Publisher-confirms, DLQ, retry cap.
11. R-8 — `InboxEvent` table cho profile-service.

### Bỏ qua

- §3 "Audit items still open" + R-11 → R-16 — cleanup độc lập, không phải bug.
- "Vietnamese→English regression" — mis-attributed, không phải do remediation gây ra.

---

## Files verified

### Wallet service
- [WalletService.java](src/services/wallet-service/src/main/java/com/cardy/walletService/service/WalletService.java) — `applyFreeze`, `removeFreeze` (R-3)
- [CollusionEventConsumer.java](src/services/wallet-service/src/main/java/com/cardy/walletService/consumer/CollusionEventConsumer.java) — R-6, R-7
- [WalletOutboxProcessor.java](src/services/wallet-service/src/main/java/com/cardy/walletService/processor/WalletOutboxProcessor.java) — R-4, R-5
- [WalletOutboxStatus.java](src/services/wallet-service/src/main/java/com/cardy/walletService/enums/WalletOutboxStatus.java)

### Marketplace service
- [CollusionFlagService.java](src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/CollusionFlagService.java) — C-1, R-1
- [EscrowService.java](src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/EscrowService.java) — R-2
- [ReviewRepository.java](src/services/marketplace-service/src/main/java/com/seika/marketplace_service/repository/ReviewRepository.java)

### Profile service
- [TeacherStatsConsumer.java](src/services/profile-service/src/main/java/com/seika/profile_service/consumer/TeacherStatsConsumer.java) — R-8

### Frontend
- [ProductDetail.tsx](src/web-app/src/pages/student/ProductDetail.tsx) — R-9, R-10
- [Marketplace.tsx](src/web-app/src/pages/student/Marketplace.tsx) — strings blame check

### Git
- `e44fec1` — actually touched only `Input.tsx` + `index.css`
- `1d8618d` — actual origin of "Browse teacher-made..." string
- `c338199c` — origin of "Refresh" / "Loading products..."

---

**Verdict cuối:** Review của Agent khác có giá trị cao về mặt correctness/security (đặc biệt C-1, R-3+R-6 combo, R-1, R-7). Có 1 mis-attribution về "Vietnamese→English regression". Phần structural cleanup (R-11 → R-16) và §3 là tech-debt hợp lệ nhưng không block merge. Nên fix nhóm 🔴🟠 trong cùng PR, đẩy 🟡 vào follow-up.
