# Manual Test Script - Teacher Tiered Economy V3

Tài liệu này dùng để manual test các nghiệp vụ hiện tại liên quan tới `docs/ideas/teacher-tiered-economy-v3.md`: protected coin, marketplace purchase, escrow, refund, review/tier, risk review, hold/freeze, content lifecycle conflict và revenue reporting.

## 1. Phạm Vi

Test qua gateway:

```txt
Gateway: http://localhost:8080
Swagger: http://localhost:8080/swagger-ui.html
Frontend: http://localhost:5173 hoặc port web-app trong docker compose
RabbitMQ UI: http://localhost:15672
```

Các service cần chạy:

```txt
identity-service
profile-service
wallet-service
marketplace-service
flashcard-service
quiz-service
reward-service
notification-service
rabbitmq
postgres
mongodb
api-gateway
web-app
```

Lưu ý async:

- Sau thao tác tạo/sửa content, mua hàng, refund, release escrow, review risk: chờ 5-60 giây để outbox/RabbitMQ consumer xử lý.
- Nếu escrow release đang để `ESCROW_HOLD_DAYS = 7`, manual test release sẽ phải chờ 7 ngày. Khi test nên tạm set `ESCROW_HOLD_DAYS = 0`, sau test trả lại `7`.
- Nếu test bằng UI không đủ màn hình admin, dùng API qua Swagger/Postman và đối chiếu UI sau.

## 2. Bộ Tài Khoản Test

Tạo tối thiểu các account sau. Ghi lại `accessToken`, `refreshToken`, `userId` sau khi register/login.

| Biến    | Role    | Mục đích                                                             |
| ------- | ------- | -------------------------------------------------------------------- |
| `ADMIN` | ADMIN   | Duyệt/reject/hide product, config, escrow override, collusion action |
| `T1`    | TEACHER | Teacher bán content chính                                            |
| `T2`    | TEACHER | Teacher phụ để test resale/reciprocal/risk                           |
| `S1`    | STUDENT | Student test bonus-only, refund, consume                             |
| `S2`    | STUDENT | Student test mixed source: bonus + reward + paid                     |
| `S3`    | STUDENT | Student test negative case/duplicate                                 |

Đăng ký user thường:

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "teacher_t1",
  "password": "Password@123",
  "role": "TEACHER",
  "fullName": "Teacher T1",
  "dateOfBirth": "1995-01-01",
  "gender": "MALE",
  "profilePictureUrl": ""
}
```

Đăng nhập:

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "teacher_t1",
  "password": "Password@123"
}
```

Token dùng header:

```txt
Authorization: Bearer <accessToken>
```

## 3. Checklist Trước Khi Test

- [ ] `docker compose up -d --build` chạy thành công.
- [ ] Eureka thấy đủ service.
- [ ] Gateway Swagger load được.
- [ ] RabbitMQ không có queue bị lỗi liên tục.
- [ ] Admin token gọi được endpoint `ADMIN`.
- [ ] Frontend login được bằng student/teacher.
- [ ] Nếu vừa reset DB, account mới có wallet mới.

Config nên kiểm tra trước:

```http
GET /api/wallet/admin/configs
GET /api/marketplace/admin/configs
```

Config khuyến nghị khi manual test:

```http
PUT /api/marketplace/admin/configs/ESCROW_HOLD_DAYS
Body: { "value": "0" }

PUT /api/marketplace/admin/configs/ESCROW_OPERATION_FEE_PERCENT
Body: { "value": "0" }
```

Sau test trả lại:

```http
PUT /api/marketplace/admin/configs/ESCROW_HOLD_DAYS
Body: { "value": "7" }
```

## 4. Luồng MT-01 - Registration Và Wallet Khởi Tạo

Mục tiêu: verify `user.registered` tạo wallet theo source đúng.

Bước test:

1. Register `S1` role `STUDENT`.
2. Register `T1` role `TEACHER`.
3. Login `S1`, gọi:

```http
GET /api/wallet/balance/breakdown
```

Expected `S1`:

- [ ] `bonusBalance = STUDENT_INITIAL_COIN`, mặc định `500`.
- [ ] `rewardBalance = 0`.
- [ ] `paidBalance = 0`.
- [ ] `earnedWithdrawableBalance = 0`.
- [ ] `earnedPromoBalance = 0`.
- [ ] `balance = tổng các bucket`.
- [ ] `frozen = false`.

4. Login `T1`, gọi `GET /api/wallet/balance/breakdown`.

Expected `T1`:

- [ ] `bonusBalance = TEACHER_INITIAL_COIN`, mặc định `0`.
- [ ] Teacher không có coin rút ban đầu.

Negative:

- [ ] Register role khác `STUDENT|TEACHER` bị reject.
- [ ] Register thiếu `username/password/fullName/dateOfBirth/gender` bị reject.

## 5. Luồng MT-02 - Top-up Tạo `PAID` Coin

Mục tiêu: verify top-up chỉ tăng `paidBalance` và tạo ledger `TOP_UP`.

Bước test:

1. Login `S1`.
2. Gọi:

```http
POST /api/wallet/top-up
Content-Type: application/json

{
  "amountVnd": 3000
}
```

Expected:

- [ ] Response có `coinsReceived = 30` nếu `TOPUP_VND_PER_COIN = 100`.
- [ ] `GET /api/wallet/balance/breakdown` thấy `paidBalance` tăng thêm `30`.
- [ ] `bonusBalance` không đổi.
- [ ] Admin `GET /api/wallet/admin/transactions?type=ALL` thấy transaction/ledger top-up.

Negative:

- [ ] `amountVnd <= 0` bị reject.
- [ ] Top-up bằng teacher token bị reject bởi role.
- [ ] Khi admin set `TOPUP_VND_PER_COIN` quá lớn làm amount không đủ 1 coin, request bị reject rõ lý do.

## 6. Luồng MT-03 - Learning Reward Tạo `REWARD` Coin

Mục tiêu: verify reward học tập vào `rewardBalance`, không tạo withdrawable.

Bước test gợi ý:

1. Login `S1`.
2. Hoàn thành một deck:

```http
POST /api/flashcards/complete?deckId=<deckId>
```

3. Hoặc hoàn thành quiz nếu UI/endpoint quiz attempt đang có sẵn.
4. Chờ reward-service xử lý event.
5. Gọi `GET /api/wallet/balance/breakdown`.

Expected:

- [ ] `rewardBalance` tăng theo rule reward hiện tại.
- [ ] `earnedWithdrawableBalance` không tăng.
- [ ] Admin transaction/ledger có type học tập/reward.

Nếu reward không tăng:

- [ ] Kiểm tra reward-service có chạy.
- [ ] Kiểm tra RabbitMQ learning events queue.
- [ ] Kiểm tra `reward-service` hiện chưa có gateway route đặc thù ngoài `/api/rewards`; nếu cần thì test qua event học tập thay vì gọi reward trực tiếp.

## 7. Luồng MT-04 - Teacher Tạo Content, Marketplace Product Pending Review

Mục tiêu: verify content service phát event và marketplace tạo product ở `PENDING_REVIEW`.

Bước test Flashcard:

1. Login `T1`.
2. Tạo flashcard set có price, ví dụ `100`.
3. Chờ marketplace consume `flashcard.set.created`.
4. Login `ADMIN`, gọi:

```http
GET /api/marketplace/admin/products/pending
```

Expected:

- [ ] Product mới xuất hiện.
- [ ] `type = FLASHCARD`.
- [ ] `referenceId = cardSetId`.
- [ ] `sellerUserId = T1.userId`.
- [ ] `price = 100`.
- [ ] `active = false`.
- [ ] `status = PENDING_REVIEW`.

Bước test Quiz:

1. Login `T1`.
2. Tạo quiz set có price.
3. Chờ marketplace consume `quiz.set.created`.
4. Admin kiểm tra pending product.

Expected tương tự với `type = QUIZ`.

## 8. Luồng MT-05 - Admin Approve/Reject/Hide Product

Mục tiêu: verify admin content gate và listing marketplace.

Approve:

```http
POST /api/marketplace/admin/products/{productId}/approve
```

Expected:

- [ ] Product `status = PUBLISHED`.
- [ ] `active = true`.
- [ ] Student gọi `GET /api/marketplace/products` thấy product.
- [ ] `GET /api/marketplace/products/{productId}` trả product.
- [ ] Product listing có metadata teacher: `teacherDisplayName`, `teacherTier`, `teacherAverageRating`, `teacherValidReviewCount` nếu đã được denormalize.

Reject:

```http
POST /api/marketplace/admin/products/{productId}/reject
Body: { "reason": "Nội dung chưa đạt chất lượng" }
```

Expected:

- [ ] Product `status = REJECTED`.
- [ ] `active = false`.
- [ ] Student listing không thấy product.
- [ ] Teacher nhận trạng thái/reason ở màn hình sản phẩm của mình hoặc API `GET /api/marketplace/products/my-products`.

Hide:

```http
POST /api/marketplace/admin/products/{productId}/hide
```

Expected:

- [ ] Product `status = HIDDEN`.
- [ ] `active = false`.
- [ ] Không còn trong listing public.

## 9. Luồng MT-06 - Purchase Validation

Mục tiêu: verify các guard khi tạo order.

Payload mua hàng:

```http
POST /api/marketplace/orders
Content-Type: application/json

{
  "userId": "<ignored_or_current_user_id>",
  "items": [
    {
      "productId": "<productId>",
      "productType": "FLASHCARD",
      "referenceId": "<referenceId>",
      "productName": "Flashcard test",
      "unitPrice": 100,
      "quantity": 1,
      "sellerUserId": "<teacherUserId>"
    }
  ]
}
```

Happy path expected:

- [ ] Response `201`.
- [ ] Order ban đầu `status = PENDING_PAYMENT`.
- [ ] Chờ wallet debit event.
- [ ] `GET /api/marketplace/orders/{orderId}` cuối cùng thành `PAID`.
- [ ] `GET /api/marketplace/inventory/my-items/detail` của student có item active.
- [ ] `GET /api/marketplace/escrows/me` có escrow `HELD`.
- [ ] `GET /api/marketplace/escrows/seller/me` của teacher có escrow pending.
- [ ] Teacher wallet chưa được credit trước release.

Negative:

- [ ] Teacher tự mua product của mình bị reject: "không thể tự mua".
- [ ] Student mua lại product đã sở hữu bị reject hoặc product không còn hiện ở listing.
- [ ] Student đang có order `PENDING_PAYMENT`/`PAID` cho product thì không tạo order trùng.
- [ ] Student thiếu balance bị wallet reject, order không được hoàn tất paid/inventory.
- [ ] Product chưa `PUBLISHED` hoặc `active=false` không mua được qua UI. Nếu API order vẫn cho tạo bằng payload thủ công, ghi bug vì spec yêu cầu marketplace validate product published/active.

## 10. Luồng MT-07 - Spend Allocation `BONUS -> REWARD -> PAID -> EARNED_PROMO`

Mục tiêu: verify wallet debit theo thứ tự source và marketplace escrow nhận đúng breakdown.

Chuẩn bị `S2` có bucket chính xác:

1. Admin tạm set initial student coin:

```http
PUT /api/wallet/admin/configs/STUDENT_INITIAL_COIN
Body: { "value": "50" }
```

2. Register `S2`.
3. Login `S2`, top-up:

```http
POST /api/wallet/top-up
Body: { "amountVnd": 3000 }
```

4. Cho `S2` nhận `20` reward bằng luồng học tập.
5. Kiểm tra breakdown:

```txt
bonusBalance = 50
rewardBalance = 20
paidBalance = 30
```

6. Tạo/approve product của `T1` giá `100`.
7. `S2` mua product giá `100`.
8. Chờ order paid/escrow created.

Expected buyer wallet:

- [ ] `bonusBalance = 0`.
- [ ] `rewardBalance = 0`.
- [ ] `paidBalance = 0`.
- [ ] Không debit vào `earnedWithdrawableBalance`.

Expected escrow:

- [ ] `grossAmount = 100`.
- [ ] `bonusBackedAmount = 50`.
- [ ] `rewardBackedAmount = 20`.
- [ ] `paidBackedAmount = 30`.
- [ ] `promoBackedAmount = 70`.

Sau test trả config:

```http
PUT /api/wallet/admin/configs/STUDENT_INITIAL_COIN
Body: { "value": "500" }
```

## 11. Luồng MT-08 - Escrow Release Và Split Teacher Earning

Mục tiêu: verify teacher chỉ được credit khi escrow release, và split withdrawable/app-only đúng lineage.

Điều kiện:

- Có escrow `HELD`.
- `ESCROW_HOLD_DAYS = 0` hoặc `releaseAt <= now`.
- `ESCROW_OPERATION_FEE_PERCENT = 0`.

Bước test:

1. Chờ scheduled job `EscrowReleaseJob` chạy.
2. Admin gọi:

```http
GET /api/marketplace/admin/escrows?status=RELEASED
```

3. Teacher gọi:

```http
GET /api/wallet/balance/breakdown
```

Expected với teacher `NEWBIE` mặc định, fee `20%`, mixed source `70 promo + 30 paid`:

- [ ] `teacherPromoNet = 70 * 80% = 56`.
- [ ] `teacherWithdrawableNet = 30 * 80% = 24`.
- [ ] `platformFeePromoSink = 70 * 20% = 14`.
- [ ] `platformFeeReal = 30 * 20% = 6`.
- [ ] Teacher `earnedPromoBalance` tăng `56`.
- [ ] Teacher `earnedWithdrawableBalance` tăng `24`.

Expected nếu teacher đã đạt `SILVER`, fee `10%` như ví dụ V3:

- [ ] `teacherPromoNet = 63`.
- [ ] `teacherWithdrawableNet = 27`.
- [ ] `platformFeePromoSink = 7`.
- [ ] `platformFeeReal = 3`.

Invariant:

- [ ] Trước release teacher wallet không tăng.
- [ ] Marketplace chỉ mark escrow `RELEASED` sau khi wallet credit succeeded.
- [ ] Gửi duplicate credit event/idempotency key không làm teacher bị double-credit.

## 12. Luồng MT-09 - Cash-out Chỉ Từ `EARNED_WITHDRAWABLE`

Mục tiêu: verify teacher không rút được `BONUS`, `REWARD`, `EARNED_PROMO`.

Bước test:

1. Teacher có `earnedPromoBalance > 0` và `earnedWithdrawableBalance = 0` hoặc nhỏ hơn amount muốn rút.
2. Gọi:

```http
POST /api/wallet/cash-out
Body: {
  "amount": 10,
  "description": "Manual test cash out"
}
```

Expected:

- [ ] Nếu withdrawable không đủ, request bị reject.
- [ ] `earnedPromoBalance` không bị trừ.
- [ ] `bonusBalance/rewardBalance/paidBalance` không bị trừ.

Happy path:

- [ ] Với `earnedWithdrawableBalance >= 10`, cash-out amount `10` thành công.
- [ ] Amount nhỏ hơn `CASH_OUT_MIN_COINS` bị reject.
- [ ] Amount không là bội số `CASH_OUT_MULTIPLE` bị reject.
- [ ] Sau cash-out, `earnedWithdrawableBalance` giảm đúng amount.

## 13. Luồng MT-10 - Self-service Refund Trước Khi Consume

Mục tiêu: verify refund trước consume trả coin về đúng source bucket và không credit teacher.

Bước test:

1. `S1` mua product mới nhưng chưa học/làm quiz.
2. Gọi:

```http
GET /api/marketplace/escrows/me
POST /api/marketplace/escrows/{escrowId}/refund
```

Expected:

- [ ] Escrow chuyển `REFUNDED` sau wallet refund succeeded.
- [ ] Inventory item bị revoke: `active=false`, có `revokedAt`, `revocationReason=escrow_refund`.
- [ ] Buyer wallet được cộng lại đúng source ban đầu: bonus về bonus, reward về reward, paid về paid, earnedPromo về earnedPromo.
- [ ] Teacher wallet không tăng.
- [ ] Platform fee không phát sinh.
- [ ] Product có thể xuất hiện lại ở listing nếu user không còn active inventory/pending order.

Negative:

- [ ] User khác gọi refund escrow không thuộc mình bị reject.
- [ ] Escrow không ở `HELD` bị reject self-service refund.
- [ ] Escrow đang `PENDING_ADMIN_DECISION` hoặc `CANCELLED_BY_ADMIN` bị reject self-service refund.

## 14. Luồng MT-11 - Content Consumed Chặn Self-service Refund

Mục tiêu: verify sau consume, refund chuyển sang admin-only.

Bước test Flashcard:

1. `S1` mua flashcard product.
2. Gọi:

```http
POST /api/flashcards/learn
Body: {
  "cardSetId": "<referenceId>",
  "...": "payload theo LearnProgressDTO hiện tại"
}
```

3. Chờ marketplace consume `flashcard.set.consumed`.
4. Gọi:

```http
GET /api/marketplace/inventory/my-items/detail
```

Expected:

- [ ] Inventory có `consumedAt != null`.

5. Gọi self-service refund.

Expected:

- [ ] Request bị reject: consumed content requires admin refund override.

Bước test Quiz:

- [ ] Làm quiz attempt lần đầu.
- [ ] Marketplace inventory `consumedAt` được set.
- [ ] Self-service refund bị chặn tương tự.

## 15. Luồng MT-12 - Admin Refund Override Sau Consume

Mục tiêu: verify admin xử lý refund dispute sau consume.

Chuẩn bị:

- Order item đã có escrow.
- Inventory đã `consumedAt != null`.
- Self-service refund bị chặn.

Admin full refund:

```http
POST /api/marketplace/admin/order-items/{orderItemId}/refund
Body: { "reason": "Nội dung không đúng mô tả" }
```

Expected:

- [ ] Refund request được gửi wallet.
- [ ] Escrow cuối cùng `REFUNDED`.
- [ ] Inventory bị revoke.
- [ ] Buyer nhận lại coin theo source gốc.
- [ ] Teacher không nhận payout nếu chưa release.
- [ ] `AdminActionLog` có decision.

Admin partial refund:

```http
POST /api/marketplace/admin/order-items/{orderItemId}/partial-refund
Body: {
  "amount": 40,
  "reason": "Hoàn một phần do lỗi nhỏ"
}
```

Expected:

- [ ] Amount > 0 và < gross mới hợp lệ.
- [ ] Buyer nhận lại tỷ lệ theo source gốc.
- [ ] Escrow còn `PENDING_ADMIN_DECISION` để admin chọn bước tiếp theo.
- [ ] Admin action log có metadata amount.

Admin no refund:

```http
POST /api/marketplace/admin/order-items/{orderItemId}/no-refund
Body: { "reason": "Student đã sử dụng đầy đủ, dispute không hợp lệ" }
```

Expected:

- [ ] Escrow vẫn cần quyết định/admin trace rõ reason.
- [ ] Buyer không được refund.

Admin force release:

```http
POST /api/marketplace/admin/order-items/{orderItemId}/force-release
Body: { "reason": "Content hợp lệ, release payout" }
```

Expected:

- [ ] Escrow chuyển về release path.
- [ ] Wallet credit teacher theo split source.
- [ ] Escrow cuối cùng `RELEASED`.

## 16. Luồng MT-13 - Teacher Edit Trong Lúc Escrow `HELD`

Mục tiêu: verify R1 - teacher edit content không release âm thầm.

Bước test:

1. Tạo product `P_EDIT`, admin approve.
2. Student mua `P_EDIT`, escrow `HELD`.
3. Teacher sửa flashcard/quiz tương ứng:

```http
PUT /api/flashcards/{id}
PUT /api/quiz-sets/{id}
```

4. Chờ marketplace consume `flashcard.set.updated` hoặc `quiz.set.updated`.
5. Admin gọi:

```http
GET /api/marketplace/admin/orders/pending-decision
```

Expected:

- [ ] Product reset `status = PENDING_REVIEW`.
- [ ] Product `active = false`.
- [ ] Escrow `status = PENDING_ADMIN_DECISION`.
- [ ] `needsAdminDecision = true`.
- [ ] `reviewReason = content_edit_by_teacher`.
- [ ] Escrow release job bỏ qua item này.
- [ ] Admin có thể refund/partial-refund/no-refund/force-release.

## 17. Luồng MT-14 - Admin Reject/Hide Trong Lúc Escrow `HELD`

Mục tiêu: verify R2 - reject/hide không auto refund, mà đưa vào admin decision.

Bước test:

1. Tạo product `P_HIDE`, admin approve.
2. Student mua, escrow `HELD`.
3. Admin reject hoặc hide product:

```http
POST /api/marketplace/admin/products/{productId}/reject
Body: { "reason": "Vi phạm chất lượng" }

POST /api/marketplace/admin/products/{productId}/hide
```

Expected:

- [ ] Product `REJECTED` hoặc `HIDDEN`, `active=false`.
- [ ] Held order item chuyển `CANCELLED_BY_ADMIN`.
- [ ] Escrow `status = CANCELLED_BY_ADMIN`.
- [ ] `needsAdminDecision = true`.
- [ ] Không có auto refund ngay.
- [ ] Item xuất hiện trong pending decision queue.

## 18. Luồng MT-15 - Hard Delete Guard Và Archive

Mục tiêu: verify R3 - không hard delete product khi escrow/audit còn unresolved.

Bước test hard delete blocked:

1. Product đã có order item `HELD`, `PENDING_ADMIN_DECISION`, hoặc `CANCELLED_BY_ADMIN` chưa full refund.
2. Teacher gọi:

```http
DELETE /api/marketplace/products/{productId}
```

Expected:

- [ ] Response conflict/error.
- [ ] Message yêu cầu archive thay vì hard delete.
- [ ] Product vẫn còn trong database/my-products.

Bước test archive:

```http
POST /api/marketplace/products/{productId}/archive
```

Expected:

- [ ] Product `status = HIDDEN`.
- [ ] `active=false`.
- [ ] Product không xuất hiện ở public listing.
- [ ] User đã mua vẫn thấy inventory/access nếu chưa bị revoke/refund.
- [ ] Escrow audit vẫn còn.

## 19. Luồng MT-16 - Review Và Teacher Tier

Mục tiêu: verify verified purchase review, unique review, tier recompute và denormalized listing.

Bước test:

1. Student mua product và có active inventory.
2. Student tạo review:

```http
POST /api/marketplace/reviews
Body: {
  "productId": "<productId>",
  "rating": 5,
  "comment": "Nội dung rõ ràng, dễ học"
}
```

Expected:

- [ ] Response `201`.
- [ ] Review `status = VALID` nếu không có suspicious flag.
- [ ] `GET /api/marketplace/products/{productId}/reviews` thấy review.
- [ ] `GET /api/marketplace/teachers/{teacherId}/rating` tăng `validReviewCount`.
- [ ] `averageRating` tính đúng.
- [ ] Product listing cập nhật `teacherTier`, `teacherAverageRating`, `teacherValidReviewCount`.

Negative:

- [ ] User chưa mua product review bị reject.
- [ ] Review lần thứ 2 cùng `(buyerId, productId)` bị reject.
- [ ] `rating < 1` hoặc `rating > 5` bị reject.

Tier threshold cần test:

- [ ] `< 5` valid reviews: `NEWBIE`, fee `20`.
- [ ] `>= 5` valid reviews và rating `>= 3.0`: `BRONZE`, fee `15`.
- [ ] `>= 20` valid reviews và rating `>= 3.5` cộng metric hiện tại đạt ngưỡng: `SILVER`, fee `10`.
- [ ] `>= 100` valid reviews và rating `>= 4.0` cộng metric hiện tại đạt ngưỡng: `GOLD`, fee `5`.
- [ ] `>= 500` valid reviews và rating `>= 4.5` cộng metric hiện tại đạt ngưỡng: `ELITE`, fee `3`.

Ghi chú implementation:

- Spec V3 nói Phase 2 MVP chỉ cần rating + valid review count, Phase 3 mới dùng thêm `consumeRate`, `refundRate`, `approvalRejectionRate`.
- Code hiện tại đã tính đủ 5 metric trong `TeacherRatingService`, nên khi manual test `SILVER/GOLD/ELITE` cần seed/điều kiện để các metric này đạt ngưỡng, không chỉ đủ review count.

## 20. Luồng MT-17 - EARNED_PROMO Resale Không Biến Thành Withdrawable

Mục tiêu: verify invariant `Non-withdrawable source can never become withdrawable through resale`.

Chuẩn bị:

1. `S1` dùng `BONUS/REWARD` mua product của `T1`.
2. Escrow release xong.
3. `T1` có `earnedPromoBalance > 0`, `earnedWithdrawableBalance` không tăng từ phần promo.
4. `T2` có product giá nhỏ hơn hoặc bằng `T1.earnedPromoBalance`, admin approve.

Bước test:

1. Login `T1`.
2. Mua product của `T2` bằng marketplace order.
3. Chờ debit và escrow.
4. Kiểm tra escrow của `T2`.

Expected:

- [ ] Debit từ `T1.earnedPromoBalance`.
- [ ] Escrow ghi phần đó là promo-backed hoặc `earnedPromoBackedAmount`.
- [ ] Khi release, `T2` nhận `teacherPromoNet`, không nhận withdrawable từ phần này.
- [ ] `T2.earnedWithdrawableBalance` không tăng do nguồn `EARNED_PROMO`.
- [ ] Admin revenue không tính phần này là real revenue.

## 21. Luồng MT-18 - Risk Review, WASH_HOLD Và FROZEN

Mục tiêu: verify collusion flag, pending review, admin action, hold/freeze.

Chuẩn bị dữ liệu suspicious:

1. Một cặp `T1` - `S3`.
2. `S3` mua nhiều product của `T1` trong lookback 30 ngày.
3. Giao dịch chủ yếu dùng bonus/reward/promo.
4. Không consume nội dung.
5. Tạo review nhanh/nhiều nếu màn hình/API cho phép.

Chờ risk job hoặc seed/test trigger scan nếu có test utility.

Admin kiểm tra:

```http
GET /api/marketplace/admin/collusion-flags?status=SUSPICIOUS
GET /api/marketplace/admin/collusion-flags/{flagId}
```

Expected suspicious:

- [ ] Có flag `SUSPICIOUS`.
- [ ] `riskScore >= COLLUSION_RISK_THRESHOLD`, mặc định `50`.
- [ ] Các review liên quan chuyển `PENDING_RISK_REVIEW`.
- [ ] Review pending không tính vào tier.
- [ ] User chưa bị thông báo/block login chỉ vì suspicious.

Dismiss:

```http
POST /api/marketplace/admin/collusion-flags/{flagId}/action
Body: {
  "action": "DISMISS",
  "reason": "Giao dịch hợp lệ sau khi kiểm tra"
}
```

Expected:

- [ ] Flag `DISMISSED`.
- [ ] Pending reviews chuyển `VALID`.
- [ ] Teacher tier recompute.

Confirm collusion:

```http
POST /api/marketplace/admin/collusion-flags/{flagId}/action
Body: {
  "action": "CONFIRM_COLLUSION",
  "reason": "Có dấu hiệu wash trading"
}
```

Expected:

- [ ] Flag `CONFIRMED`.
- [ ] Wallet hold `WASH_HOLD` được publish/xử lý.
- [ ] Teacher login vẫn được.
- [ ] Teacher spend/top-up vẫn được nếu không frozen.
- [ ] Teacher cash-out bị chặn.
- [ ] `GET /api/wallet/holds/me` thấy hold active.

Mark malicious:

```http
POST /api/marketplace/admin/collusion-flags/{flagId}/action
Body: {
  "action": "MARK_MALICIOUS",
  "reason": "Lạm dụng nghiêm trọng"
}
```

Expected:

- [ ] Flag `MALICIOUS`.
- [ ] Pending reviews chuyển `EXCLUDED_WASH`.
- [ ] Teacher rating recompute, excluded count tăng.
- [ ] Wallet bị `FROZEN` qua consumer/control.
- [ ] Login vẫn được.
- [ ] Top-up/spend/cash-out đều bị chặn.

Manual freeze/unfreeze fallback:

```http
POST /api/wallet/admin/freeze
Body: { "userId": "<uuid>", "reason": "Manual freeze test" }

POST /api/wallet/admin/unfreeze
Body: { "userId": "<uuid>", "reason": "Manual unfreeze test" }
```

Expected:

- [ ] `frozen=true` chặn wallet operations.
- [ ] `frozen=false` cho phép wallet operations lại.

## 22. Luồng MT-19 - Admin Revenue Reporting

Mục tiêu: verify promo-backed fee không bị tính là doanh thu thật.

Bước test:

1. Tạo ít nhất 1 purchase paid-backed và release escrow.
2. Tạo ít nhất 1 purchase promo-backed và release escrow.
3. Admin gọi:

```http
GET /api/wallet/admin/revenue-stats
GET /api/wallet/admin/transactions?type=ALL
GET /api/wallet/admin/total-circulation
```

Expected:

- [ ] Paid-backed fee xuất hiện trong `platformFeeReal`/real revenue bucket.
- [ ] Promo-backed fee xuất hiện như `PLATFORM_FEE_PROMO_SINK`, không quy đổi thành real revenue.
- [ ] `cashOutLiabilityVnd` chỉ tính từ withdrawable circulation.
- [ ] Non-withdrawable circulation gồm bonus/reward/earnedPromo.
- [ ] Tổng circulation khớp tổng wallet balance.

## 23. Luồng MT-20 - Teacher Dashboard Và Statistics

Mục tiêu: verify teacher nhìn đúng tiền có thể rút, tiền chỉ dùng trong app và escrow pending.

Bước test:

1. Teacher có:
   - Escrow pending.
   - `earnedWithdrawableBalance > 0`.
   - `earnedPromoBalance > 0`.
2. Login teacher trên frontend.
3. Đối chiếu API:

```http
GET /api/wallet/balance/breakdown
GET /api/marketplace/escrows/seller/me
GET /api/marketplace/orders/seller/me/revenue?period=month
GET /api/marketplace/orders/seller/me/top-products
GET /api/marketplace/orders/seller/me/students
GET /api/flashcards/my/statistics
GET /api/quiz-sets/my/statistics
```

Expected UI wording:

- [ ] Có thể rút = `earnedWithdrawableBalance`.
- [ ] Chỉ dùng trong app = `earnedPromoBalance + bonusBalance + rewardBalance + paidBalance` nếu teacher có các bucket này.
- [ ] Đang chờ escrow = tổng escrow `HELD/PENDING_ADMIN_DECISION` của teacher.
- [ ] Không dùng "total balance" làm số chính trên màn cash-out.
- [ ] Top products/students/revenue không lộ dữ liệu seller khác.

## 24. Luồng MT-21 - Notification Và Realtime Smoke Test

Mục tiêu: verify event phụ trợ không phá luồng chính.

Bước test:

1. Login frontend bằng student/teacher.
2. Mở notification panel nếu có.
3. Thực hiện các action:
   - Admin approve/reject content.
   - Student mua content.
   - Wallet top-up.
   - Escrow release/refund.
   - Admin collusion action.
4. Theo dõi notification stream/API:

```http
GET /api/notifications/**
```

Expected:

- [ ] Không có lỗi auth refresh/SSE làm logout.
- [ ] Notification hiển thị đúng user nhận.
- [ ] Notification lỗi không làm fail transaction chính.

## 25. Regression Matrix Nhanh

Chạy bảng này trước khi coi V3 pass.

| ID  | Case                          | Expected                                          |
| --- | ----------------------------- | ------------------------------------------------- |
| R01 | Student register              | Wallet bonus mặc định                             |
| R02 | Teacher register              | Wallet initial mặc định, không withdrawable       |
| R03 | Student top-up                | Chỉ tăng paid                                     |
| R04 | Learning reward               | Chỉ tăng reward                                   |
| R05 | Teacher create content        | Marketplace product pending review                |
| R06 | Admin approve                 | Product published/active/listing                  |
| R07 | Admin reject/hide             | Product inactive, listing ẩn                      |
| R08 | Buy own product               | Reject                                            |
| R09 | Duplicate purchase            | Reject/ẩn khỏi listing                            |
| R10 | Insufficient balance          | Reject, không inventory                           |
| R11 | Purchase with bonus-only      | Teacher payout app-only sau release               |
| R12 | Purchase with paid-only       | Teacher payout withdrawable sau release           |
| R13 | Mixed purchase                | Split promo/paid đúng                             |
| R14 | Escrow release                | Không double credit, release sau wallet succeeded |
| R15 | Self refund before consume    | Restore original buckets, revoke inventory        |
| R16 | Refund after consume          | Self-service reject                               |
| R17 | Admin full refund             | Refund + admin log                                |
| R18 | Admin partial refund          | Partial source-ratio refund                       |
| R19 | Admin force release           | Teacher credited                                  |
| R20 | Teacher edit during held      | Pending admin decision                            |
| R21 | Admin hide/reject during held | Cancelled by admin, no auto refund                |
| R22 | Hard delete unresolved escrow | Reject/conflict                                   |
| R23 | Archive product               | Hidden listing, purchased access preserved        |
| R24 | Verified review               | Valid review + tier recompute                     |
| R25 | Duplicate/unverified review   | Reject                                            |
| R26 | Suspicious risk               | Pending risk reviews                              |
| R27 | Dismiss risk                  | Reviews valid                                     |
| R28 | Confirm wash                  | WASH_HOLD blocks cash-out                         |
| R29 | Mark malicious/freeze         | Wallet ops blocked, login allowed                 |
| R30 | Promo resale                  | Không biến thành withdrawable                     |
| R31 | Revenue stats                 | Promo sink không là real revenue                  |
| R32 | Teacher dashboard             | 3 số dư tách rõ                                   |

## 26. Mẫu Ghi Kết Quả

Copy block này cho từng test case khi chạy:

```txt
Case ID:
Tester:
Date:
Environment:
Accounts:
Precondition:
Steps executed:
Actual result:
Expected result:
Status: PASS / FAIL / BLOCKED
Evidence:
- Screenshot:
- API response:
- Logs:
Bug link:
Notes:
```

## 27. Tiêu Chí Kết Luận

V3 được coi là pass manual regression khi:

- [ ] Không có case critical fail ở wallet debit/credit/refund/cash-out.
- [ ] Không có case double debit/double credit khi event duplicate.
- [ ] Không có đường nào biến `BONUS`, `REWARD`, `EARNED_PROMO` thành withdrawable.
- [ ] Refund trước/sau consume đúng quyền.
- [ ] Escrow conflict luôn vào admin decision, không release/refund âm thầm.
- [ ] Teacher dashboard và admin revenue không gây hiểu nhầm tiền thật với coin app-only.
- [ ] Risk action không khóa login nhưng chặn đúng wallet operation.
- [ ] Các bug còn lại được phân loại severity và có quyết định fix/defer rõ ràng.
