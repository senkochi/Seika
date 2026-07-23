# Teacher Tiered Economy — Current vs V2 Conflicts

> **Status:** Analysis
> **Scope:** Đối chiếu nghiệp vụ hiện tại với plan trong [teacher-tiered-economy-v2.md](teacher-tiered-economy-v2.md), chỉ ra các điểm xung đột cần xử lý trước khi triển khai.
> **Không phải plan triển khai** — bản đã thống nhất về product rule nằm ở cuối file. Triển khai chi tiết xem plan Phase 1.

## Bối cảnh

Seika hiện có cơ chế admin duyệt content: teacher tạo flashcard/quiz → marketplace tự tạo `Product(status=PENDING_REVIEW, active=false)` → admin `approve` mới trở thành `PUBLISHED` và bán được.

Trong khi đó, v2 plan thay đổi nền tảng tài chính:
- Thay teacher-payout tức thì bằng escrow hold N ngày rồi release.
- Thêm source balances để phân biệt coin top-up thật vs coin bonus/reward.
- Thêm admin refund để xử lý buyer protection.

Hai hệ thống này chưa được thiết kế để nói chuyện với nhau. Có 4 điểm nghiệp vụ xung đột thực sự, nếu không giải quyết thì Phase 2 escrow sẽ ship với bug hoặc cần rewrite.

## Trạng thái hiện tại (baseline)

Để tra cứu nhanh, dưới đây là baseline đã được khảo sát:

### Content lifecycle (không có state machine)

- `flashcard-service`: `CardSet` ([src/services/flashcard-service/src/main/java/com/seika/flashcard_service/domain/CardSet.java](src/services/flashcard-service/src/main/java/com/seika/flashcard_service/domain/CardSet.java)) không có status field, không có admin endpoint. Chỉ có create/update/delete do teacher sở hữu.
- `quiz-service`: `QuizSet` tương tự — không status, không admin endpoint.
- Quyết định "có bán được không" nằm hoàn toàn ở marketplace `ProductStatus`.

### Marketplace Product (state machine duy nhất)

`ProductStatus` ([src/services/marketplace-service/src/main/java/com/seika/marketplace_service/enums/ProductStatus.java](src/services/marketplace-service/src/main/java/com/seika/marketplace_service/enums/ProductStatus.java)):
```
PENDING_REVIEW → PUBLISHED        (admin approve)
                → REJECTED         (admin reject, kèm lý do)
                → HIDDEN           (admin hide, không kèm lý do)
```

Admin transitions ở [AdminProductController.java](src/services/marketplace-service/src/main/java/com/seika/marketplace_service/controller/AdminProductController.java) và [AdminProductService.java](src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/AdminProductService.java).

Listing chỉ filter `status=PUBLISHED AND active=true` ở [ProductService.java](src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/ProductService.java).

Auto-reset khi teacher edit: `ProductEventListener.updateProduct()` reset về `PENDING_REVIEW, active=false, rejectionReason=null` mỗi khi nhận `flashcard.set.updated` / `quiz.set.updated`. Tức là teacher sửa → mất duyệt.

### Purchase + payout (chưa có escrow)

Sequence hiện tại:

1. Student `POST /api/marketplace/orders` → Order(`PENDING_PAYMENT`) + OrderItem + outbox `wallet.debit.requested`.
2. `OutboxProcessor` (3s) → `wallet.commands` exchange.
3. `WalletEventListener.handleWalletDebitRequested` → `walletService.spend()` → debits single `balance` column → publish `wallet.debit.succeeded`.
4. Marketplace `WalletEventHandler` → Order `PAID` → tạo `UserInventory` → publish `content.purchased`.
5. `WalletEventListener.handleContentPurchased` → `walletService.reward(teacher, fullAmount)` → credits teacher `balance` **ngay lập tức**.

Không có hold, không có release job, không có refund, không có admin override.

### Wallet ledger

`Wallet` ([src/services/wallet-service/src/main/java/com/cardy/walletService/domain/Wallet.java](src/services/wallet-service/src/main/java/com/cardy/walletService/domain/Wallet.java)) chỉ có một `BigDecimal balance` (có `CHECK balance >= 0`). `Transaction` chỉ có `amount` + free-form `description`.

`AdminRevenueService` parse VND từ `Transaction.description` bằng regex — chính là điểm đau mà v2 muốn loại bỏ.

`OrderStatus` ([src/services/marketplace-service/src/main/java/com/seika/marketplace_service/enums/OrderStatus.java](src/services/marketplace-service/src/main/java/com/seika/marketplace_service/enums/OrderStatus.java)) có `PENDING_PAYMENT / PAID / CANCELLED / FAILED`, nhưng `CANCELLED` không bao giờ được gán; không có state nào sau `PAID`.

### Không có những thứ sau

- `EscrowTransaction` table / lifecycle (`HELD / RELEASED / REFUNDED`).
- `UserInventory.consumedAt` (refund gate).
- `content.consumed` event từ flashcard/quiz.
- Refund endpoint bất kỳ đâu.
- `Review` / `TeacherRating` / tier system.

---

## 4 xung đột nghiệp vụ

### Xung đột #1 — Teacher edit trong window hold không trigger review

**Hiện tại:** Teacher `PUT /api/flashcards/{id}` → publish `flashcard.set.updated` → `ProductEventListener.updateProduct` reset product về `PENDING_REVIEW` (xử lý hiển thị marketplace). Nhưng **không có logic** xem có Order đang PAID cho product đó không. Orders cũ giữ nguyên, content thay đổi im lặng.

**Trong v2:** Sau Phase 2, mỗi order tạo `EscrowTransaction(status=HELD)`. Teacher edit content trong `ESCROW_HOLD_DAYS=7` sẽ làm student học nhầm nội dung mới, nhưng plan không có rule nào cho việc này. V2 chỉ có:
- `refund eligibility: marketplace mirror consumedAt` (gate refund khi student đã consume).
- Không có rule "phải refund / notify khi teacher edit trong window hold".

**Tác động kinh doanh:**
- Student mua bài "100 từ vựng N1", teacher edit thành "100 từ vựng N2" ngày thứ 2, escrow release đúng hạn → teacher nhận tiền cho content student chưa bao giờ học (đã học content cũ trước edit, hoặc chưa kịp học).
- Tệ hơn: teacher có thể đổi content sau khi student đã consume một phần, lợi dụng escrow.

**Câu hỏi cần trả lời:**
- Có nên cấm edit core content (cards / questions / price) trong window HELD không? Hay cho edit nhưng đánh dấu escrow cần admin review?
- Nếu cho edit, admin mất bao lâu để xử lý queue? Có SLA không?

### Xung đột #2 — Admin reject/hide sau khi đã có orders HELD

**Hiện tại:** `AdminProductService.reject()` chỉ đổi `Product.status=REJECTED, active=false`. Lệnh này vô hiệu hóa listing nhưng không động đến orders đã PAID hay UserInventory đã cấp. Teacher vẫn giữ 100% earning từ những đơn hàng đó.

**Trong v2:** Khi admin reject một product vi phạm (ví dụ: nội dung sai bản quyền), các `EscrowTransaction(status=HELD)` của product đó cần được xử lý. Plan có `Flow 5: Refund` nhưng nó là self-service cho buyer; không có admin-forced cancel.

**Tác động kinh doanh:**
- Admin reject vì vi phạm → student vẫn giữ inventory (và content cũ trong Mongo có thể đã bị teacher sửa để trốn review), teacher vẫn nhận tiền khi escrow release → ngân quỹ admin mất.
- Hoặc admin reject vì lý do marketing (ẩn tạm để chỉnh sửa lại) → không nên refund student, nhưng cũng không nên release teacher ngay (content chưa ổn).

**Câu hỏi cần trả lời:**
- Reject vì vi phạm vs hide vì lý do khác — admin phải chọn rõ khi nào refund và khi nào không?
- Có nên auto-refund khi admin reject với lý do vi phạm, hay luôn để admin xử lý thủ công?

### Xung đột #3 — Teacher hard-delete content đã bán

**Hiện tại:** `CardSetService.delete` và `QuizSetService.deleteByOwner` chỉ check `authorId == requesterId` (hoặc `createdBy == requesterId` cho quiz). Không check `UserInventory` hay `Order`. Teacher có thể `DELETE /api/flashcards/{id}` ngay sau khi student mua.

**Trong v2:** Sau khi `Order.status=PAID` → `UserInventory` được tạo → `content.purchased` event → teacher được credit. Nếu teacher xóa content trước khi escrow release:
- Student vẫn có inventory row trỏ vào `referenceId` không tồn tại.
- Khi student vào flashcard/quiz → 404 từ `flashcard-service` / `quiz-service`.
- Escrow vẫn release bình thường vì không có hook nào check.

**Tác động kinh doanh:**
- Trước escrow: teacher đã nhận tiền rồi, chỉ là student bị 404.
- Sau escrow: teacher chủ động delete để "tận thu" — tạo nhiều escrow nhỏ rồi xóa content để tránh refund/dispute.

**Câu hỏi cần trả lời:**
- Có nên cấm hoàn toàn hard-delete khi còn order PAID không?
- Nếu teacher muốn "ẩn" content vĩnh viễn (vd: bán xong muốn nghỉ), thì làm sao? Soft-archive?

### Xung đột #4 — "Admin approved" không đồng nghĩa "eligible for escrow"

**Hiện tại:** Admin approve chỉ check "content có vi phạm không" (nội dung, hình ảnh, etc.). Không check:
- Teacher wallet có hợp lệ không (đã verify identity chưa).
- Teacher đã đạt tier tối thiểu chưa.
- Có tài khoản trùng / suspicious không.

**Trong v2:** Khi escrow release, nếu teacher wallet không hợp lệ → credit fail. `walletService.reward()` hiện chỉ `updateBalance(teacher, +amount)`, không có guard. Tier fee cũng cần biết teacher tier tại thời điểm approve để áp dụng đúng.

**Tác động kinh doanh:**
- Teacher không có wallet (rare nhưng có thể) → content approved nhưng purchase fail.
- Teacher mới (NEWBIE) → fee 20% có thể quá cao cho content đầu tiên, admin không có cách nào preview fee trước khi approve.

**Câu hỏi cần trả lời:**
- Có cần "teacher onboarding" tách riêng với content approval không?
- Tier có nên là rào cản cho phép teacher publish không, hay chỉ ảnh hưởng fee?

---

## Ma trận tác động

| Xung đột | Hiện tại đã tồn tại? | Phase 2 escrow làm nặng hơn? | Phải fix trước Phase 2? |
|---|:---:|:---:|:---:|
| #1 Edit trong window hold | Có (nhưng vì teacher payout tức thì nên không ai để ý) | **Có** — student mất content, teacher vẫn nhận tiền | Có |
| #2 Reject/hide có order HELD | Có (admin đã có thể reject bất cứ lúc nào) | **Có** — admin reject gây mất tiền ngân quỹ khi escrow release | Có |
| #3 Hard-delete có order | Có (nhưng chỉ gây 404 cho student) | **Có** — teacher có thể "tận thu" rồi xóa | Có |
| #4 Approve không check wallet/tier | Không ai để ý vì teacher credit tức thì | **Có** — escrow release có thể fail hoặc fee không khớp | Phase 2 |

---

## Quyết định nghiệp vụ đã chốt

Sau thảo luận, 4 xung đột trên được giải quyết theo hướng sau:

### R1 — Teacher edit trong window HELD

**Quyết định:** Cho phép teacher edit. Mỗi `OrderItem` của product với `escrow_state='HELD'` sẽ tự động được đánh dấu `escrow_needs_review=true, escrow_review_reason='content_edit_by_teacher'` và `Order.needs_admin_decision=true`.

- Teacher vẫn edit được content bình thường, không bị chặn.
- Product tự reset về `PENDING_REVIEW` (giữ hành vi hiện tại), nhưng giờ có thêm side-effect ở marketplace.
- Admin nhận queue `GET /api/marketplace/admin/orders/pending-decision` để xử lý từng escrow: release (giữ nguyên) hoặc refund.
- Lý do chọn hướng này: cấm edit là quá hà khắc với teacher (vì content có thể cần sửa typo nhỏ trong 7 ngày); auto-refund lại quá tự động vì có thể teacher chỉ sửa metadata không ảnh hưởng nội dung.

### R2 — Admin reject/hide có order HELD

**Quyết định:** Mark tất cả `OrderItem` của product với `escrow_state='HELD'` thành `CANCELLED_BY_ADMIN`. KHÔNG auto-refund. Admin phải xử lý thủ công từng escrow qua:
- `POST /api/marketplace/admin/order-items/{id}/refund` → flip sang `REFUNDED`.
- `POST /api/marketplace/admin/order-items/{id}/force-release` → flip sang `RELEASED`.

- Lý do chọn hướng này: admin reject có thể vì nhiều lý do (vi phạm, marketing, tạm ẩn); không phải lúc nào cũng refund. Để admin quyết định per-item là linh hoạt nhất.
- Phase 1 chỉ flip cờ; Phase 2 mới phát `wallet.credit.requested` để thực sự refund/release tiền.

### R3 — Teacher hard-delete content đã bán

**Quyết định:** Cấm hard-delete khi còn `OrderItem` với `escrow_state IN (HELD, CANCELLED_BY_ADMIN) AND escrow_fully_refunded=false`. Endpoint `DELETE /api/marketplace/products/{id}` (và `DELETE /api/flashcards/{id}` qua marketplace gate) trả **409 Conflict** với body chi tiết. Teacher phải dùng `POST /api/marketplace/products/{id}/archive` (soft-archive, set `status=HIDDEN, soft_archived=true`).

- Lý do chọn hướng này: cấm hoàn toàn mới bảo vệ được escrow audit. Soft-archive đủ cho mọi use case (teacher muốn ẩn vĩnh viễn cũng OK).
- Hard-delete chỉ được phép khi tất cả `OrderItem` liên quan đã `escrow_fully_refunded=true` (admin đã xử lý xong).

### R4 — Approve không check wallet/tier

**Quyết định (defer):** Không xử lý trong release này. Phase 1 chỉ thêm source balances; tier system là Phase 2. Admin approve hiện tại chỉ là content quality gate, không phải financial gate. Tier fee ở Phase 2 sẽ tính tại **escrow release** (không phải tại approve), nên việc approve mà teacher không có wallet vẫn an toàn vì release sẽ fail và admin có thể refund.

- Nếu Phase 2 rollout gặp quá nhiều case "teacher mới không có wallet", sẽ thêm "teacher onboarding" check trong Phase 3.

---

## Tác động đến scope

3 trong 4 xung đột (R1/R2/R3) phải được implement **cùng Phase 1** của v2 plan (Protected Coin Ledger), vì chúng nằm trên cùng event hot path với `flashcard.set.updated` và admin reject/hide. Nếu đợi đến Phase 2 mới làm, sẽ phải rewrite event handler hai lần.

Phase 1 kết hợp 3 hooks = **~13.5 ngày làm việc (~2.5-3 tuần)**, so với estimate 1.5-2 tuần cho ledger alone trong v2 plan. Thêm 3-4 ngày là hợp lý.

R4 defer sang Phase 3 / sau rollout, không ảnh hưởng scope hiện tại.

---

## Liên kết

- [teacher-tiered-economy-v2.md](teacher-tiered-economy-v2.md) — Spec gốc
- [teacher-tiered-economy.md](teacher-tiered-economy.md) — Plan v1 (đã superseded)
- Plan triển khai chi tiết Phase 1: `~/.claude/plans/hi-n-t-i-th-sau-humming-dijkstra.md`