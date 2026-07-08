Đánh giá: **thiết kế nghiệp vụ tốt, hợp lý cho Seika, nhưng MVP đang hơi rộng và có vài điểm cần chỉnh để tránh lệch logic tài chính/game economy**. File hiện tại chọn hướng **Teacher Tier + Escrow + Anti-collusion**, bỏ two-token và stake trong MVP, phù hợp hơn so với redesign toàn bộ token economy. 

# 1. Điểm mạnh

## 1.1. Hướng B là lựa chọn đúng

Chọn **phân tầng giáo viên + escrow + anti-collusion** là hợp lý vì không phá kiến trúc coin hiện tại nhưng vẫn tăng chiều sâu nghiệp vụ.

Điểm đúng:

```txt
- Không chọn Hướng A vì quá đơn giản.
- Không chọn Hướng C vì two-token quá nặng cho pilot.
- Giữ 500 initial coin để không phá flow Student hiện tại.
- Dùng config-driven để admin có thể chỉnh economics sau.
- Escrow 7 ngày giúp admin có thời gian xử lý refund/dispute.
- Teacher tier tạo động lực dài hạn cho teacher.
```

Đây là hướng tốt cho project microservices vì nó chạm được nhiều bài toán thực tế:

```txt
- wallet transaction
- marketplace order
- escrow lifecycle
- scheduled job
- admin moderation
- rating system
- anti-abuse detection
- audit log
- config-driven business rule
```

## 1.2. Có phân biệt rõ MVP và Out of Scope

File đã tách rõ:

```txt
In scope:
- Teacher rating
- Dynamic withdrawal rate
- Escrow 7 ngày
- Anti-collusion flag
- Config changes

Out of scope:
- Stake/slash
- Two-token
- Appeal system
- Subscription
- Tax/legal
```

Điểm này tốt vì tránh biến project thành token economy quá lớn.

## 1.3. Anti-collusion có human-in-the-loop là đúng

Không tự động ban hoặc slash ngay là hợp lý.

Thiết kế hiện tại:

```txt
Suspicious → log + admin review
Confirmed wash → hold wallet 30 ngày
Malicious abuse → freeze ví + blacklist
```

Cách này giảm false positive. Với project cá nhân/admin ít người, manual review thực tế hơn auto moderation phức tạp.

## 1.4. Migration strategy hợp lý

Phần migration có 3 điểm đúng:

```txt
- Existing teacher chưa có rating → NEWBIE
- WITHDRAWAL_VND_PER_COIN cũ giữ làm fallback
- Escrow chỉ áp dụng cho giao dịch mới
```

Đây là quyết định tốt vì tránh phá dữ liệu cũ và tránh retroactive behavior.

# 2. Vấn đề cần chỉnh

## 2.1. MVP 2–3 tuần đang quá rộng

File ghi MVP ship trong **1 release, ước tính 2–3 tuần**, nhưng scope thực tế khá lớn:

```txt
- 5 entity mới
- 4 endpoint mới
- 3 background jobs
- Admin dashboard wash review
- Teacher dashboard warning/tier/escrow
- Marketplace tier badge
- Review system
- Dynamic withdrawal rate
- Escrow lifecycle
- Refund flow
- Collusion graph detection
```

Với microservices + frontend + testing, 2–3 tuần là lạc quan. Không đủ dữ liệu để xác minh năng lực team/số giờ làm, nhưng theo phạm vi kỹ thuật thì nên tách thành nhiều phase nhỏ hơn.

Đề xuất sửa MVP:

```txt
MVP-1:
- TeacherRating
- Tier calculation
- Tier badge
- Dynamic withdrawal rate

MVP-2:
- EscrowTransaction
- Escrow release job
- Escrow pending UI
- Refund manual

MVP-3:
- CollusionFlag
- Admin review dashboard
- Wallet hold/freeze policy
```

Không nên ship cả rating + escrow + anti-collusion + admin dashboard trong cùng một release đầu.

## 2.2. Dynamic spread đang đặt ở withdrawal, không phải purchase

File mô tả “spread động theo teacher tier”, nhưng implementation lại nói:

```txt
Bỏ WITHDRAWAL_VND_PER_COIN cố định
Thay bằng WITHDRAWAL_VND_PER_COIN_BY_TIER
```

Điều này nghĩa là spread được áp dụng khi **teacher rút coin sang VNĐ**, không phải khi **student mua content**.

Cần quyết rõ: tier spread nằm ở đâu?

### Option A — Spread khi rút tiền

Student mua 100 coin content → Teacher nhận gần đủ coin sau escrow, nhưng khi rút:

```txt
NEWBIE: 1 coin = 80 VNĐ
GOLD: 1 coin = 95 VNĐ
```

Ưu điểm:

```txt
- Dễ implement
- Không ảnh hưởng purchase flow nhiều
- Teacher tier ảnh hưởng trực tiếp cash-out
```

Nhược điểm:

```txt
- Ledger coin trong hệ thống vẫn không phản ánh admin spread ngay lúc giao dịch
- Admin revenue chỉ thực sự xuất hiện khi teacher rút
- Nếu teacher không rút, revenue chưa rõ
```

### Option B — Spread khi purchase/release escrow

Student mua 100 coin → sau 7 ngày release:

```txt
NEWBIE: Teacher nhận 80 coin, Admin fee 20 coin
GOLD: Teacher nhận 95 coin, Admin fee 5 coin
```

Ưu điểm:

```txt
- Đúng nghĩa marketplace spread
- Ledger rõ hơn
- Admin revenue ghi nhận ngay khi release escrow
```

Nhược điểm:

```txt
- Cần thêm platform/admin wallet hoặc revenue ledger
- Teacher có thể phản đối vì thấy coin bị trừ ngay
```

Đánh giá: **Nên dùng Option B cho nghiệp vụ rõ ràng hơn**, còn `WITHDRAWAL_VND_PER_COIN_BY_TIER` chỉ nên là cơ chế phụ nếu bạn muốn mô phỏng quy đổi VNĐ.

Cách chuẩn hơn:

```txt
Purchase price: 100 coin

Escrow release:
- Teacher revenue: amount * teacherSharePercent
- Platform revenue: amount * platformFeePercent
- Reward pool: optional
```

Không nên gọi toàn bộ cơ chế này là `WITHDRAWAL_VND_PER_COIN_BY_TIER`, vì tên đó làm lệch nghĩa từ **marketplace spread** sang **cash-out rate**.

## 2.3. Escrow fee 1% và tier spread đang bị chồng khái niệm

File có:

```txt
Teacher tier spread:
NEWBIE admin lời 20%
GOLD admin lời 5%

Escrow fee:
1% từ teacher
```

Cần xác định 1% này là gì:

```txt
- Là phí xử lý escrow riêng?
- Hay là một phần của admin spread?
```

Nếu NEWBIE đã bị spread 20% mà còn trừ thêm escrow 1%, tổng cost của teacher là 21%.

Ví dụ:

```txt
Student mua 100 coin
NEWBIE teacher share 80 coin
Escrow fee 1% từ teacher
Teacher thực nhận 79.2 coin
Admin/revenue pool nhận 20.8 coin
```

Không sai, nhưng cần ghi rõ để tránh hiểu nhầm.

Đề xuất:

```txt
adminTotalFeePercent = tierPlatformFeePercent + escrowFeePercent
```

Hoặc đơn giản hơn cho MVP:

```txt
Bỏ escrow fee 1%.
Gộp phí escrow vào tier spread.
```

Vì MVP đã có spread 20/15/10/5/3%, thêm 1% escrow fee làm rule rối hơn mà giá trị demo không lớn.

## 2.4. Rating system dễ bị abuse nếu chỉ dựa vào averageRating + totalReviews

Tier hiện tại:

```txt
NEWBIE: < 5 reviews
BRONZE: 5-19 reviews, rating ≥ 3.0
SILVER: 20-99 reviews, rating ≥ 3.5
GOLD: 100+ reviews, rating ≥ 4.0
ELITE: 500+ reviews, rating ≥ 4.5
```

Vấn đề: nếu wash transaction xảy ra, review cũng có thể bị thao túng. Anti-collusion có, nhưng nếu rating đã tính trước khi flag thì tier có thể bị đẩy sai.

Cần thêm rule:

```txt
Chỉ review từ verified purchase mới được tính.
Một student chỉ review một content một lần.
Review từ transaction đang Suspicious không được tính vào tier.
Review từ Confirmed Wash bị loại khỏi tier.
Teacher không được review content của chính mình.
```

Nên thêm trạng thái review:

```txt
VALID
EXCLUDED_SUSPICIOUS
EXCLUDED_WASH
DELETED_BY_ADMIN
```

## 2.5. Threshold anti-collusion `count > 5 cùng cặp buyer-seller` có thể false positive

Rule:

```txt
count > 5 với cùng cặp buyer-seller trong 30 ngày
HOẶC totalAmount > 5000 coin
```

Với Seika, một student thật có thể mua nhiều quiz/flashcard của cùng một teacher tốt. Nếu teacher có nhiều content, `>5 transactions` trong 30 ngày có thể là hành vi hợp lệ.

Nên cải tiến rule thành scoring thay vì threshold đơn:

```txt
riskScore =
  repeatedPairScore
+ reciprocalScore
+ newAccountScore
+ noLearningActivityScore
+ highRefundScore
+ sameDeviceOrIPScore
+ fastPurchaseReviewScore
```

MVP có thể vẫn dùng threshold đơn, nhưng nên thêm điều kiện giảm false positive:

```txt
Flag nếu:
- count > 5
AND learning activity thấp
AND rating pattern bất thường
```

Hoặc:

```txt
Flag nếu:
- count > 5 với cùng buyer-seller
AND buyer chỉ mua gần như duy nhất từ teacher đó
```

## 2.6. “Hoàn coin cho giao dịch hợp lệ còn lại” trong Malicious Abuse đang mơ hồ

File ghi:

```txt
Hoàn coin cho các giao dịch legit còn lại
student nào chưa consume content → refund tự động
```

Cần định nghĩa rõ:

```txt
- Giao dịch nào được coi là legit?
- Nếu content đã consume 10%, có refund không?
- Nếu đã download/export content thì sao?
- Nếu teacher bị malicious nhưng content vẫn có giá trị thì có refund không?
```

Đề xuất rule đơn giản:

```txt
Refund eligible nếu:
- Escrow status = HELD
- Content chưa consume
- Purchase không thuộc confirmed wash pair
```

Không refund nếu:

```txt
- Content đã consume vượt ngưỡng
- Escrow đã RELEASED
- Admin đánh dấu giao dịch hợp lệ
```

## 2.7. Cần thêm ledger/audit rõ hơn

File có `AdminActionLog`, nhưng chưa thấy đề cập transaction ledger đầy đủ cho escrow/admin fee/release/refund.

Nên có ledger event rõ:

```txt
ESCROW_HELD
ESCROW_RELEASED
ESCROW_REFUNDED
PLATFORM_FEE_COLLECTED
TEACHER_REVENUE_CREDITED
WITHDRAWAL_REQUESTED
WITHDRAWAL_HELD
WITHDRAWAL_PAID
WALLET_FROZEN
WALLET_UNFROZEN
```

Không nên chỉ update balance trực tiếp. Với wallet/economy, ledger rất quan trọng để debug và audit.

# 3. Kiến trúc service nên chỉnh

## 3.1. Không nên để quá nhiều nghiệp vụ marketplace nằm trong wallet-service

File đề xuất:

```txt
EscrowReleaseJob
CollusionDetectionJob
TeacherTierRecomputeJob
@Scheduled trong wallet-service hoặc tách job-service
```

Đánh giá:

```txt
- WalletService nên sở hữu balance, ledger, hold/freeze, withdrawal.
- MarketplaceService nên sở hữu order/purchase/content sale.
- RatingService/ProfileService nên sở hữu teacher rating/tier.
- Job-service hoặc message-processor nên chạy scheduled jobs cross-service.
```

Nếu để tất cả trong wallet-service, wallet-service sẽ thành “god service”.

Đề xuất boundary:

```txt
Marketplace Service:
- Order
- Purchase
- EscrowTransaction nếu escrow gắn với order

Wallet Service:
- Wallet balance
- Transaction ledger
- Wallet hold/freeze
- Cash-out

Profile/Rating Service:
- TeacherRating
- Tier calculation

Admin/Moderation Service hoặc Marketplace Admin:
- CollusionFlag
- AdminActionLog
- Review action

Message Processor / Job Service:
- Escrow release job
- Collusion detection job
- Tier recompute job
```

Nếu project hiện tại chưa có nhiều service phụ, MVP có thể giữ đơn giản, nhưng cần tránh để wallet-service biết quá nhiều về teacher rating và marketplace content.

## 3.2. API mới cần tách rõ role

Endpoint đề xuất:

```txt
POST /api/v1/reviews
POST /api/v1/escrow/{id}/refund
GET /api/v1/admin/collusion-flags
POST /api/v1/admin/collusion-flags/{id}/action
```

Cần bổ sung permission:

```txt
POST /api/v1/reviews
- STUDENT only
- Must have verified purchase
- One review per purchase/content

POST /api/v1/escrow/{id}/refund
- STUDENT buyer only
- Escrow must be HELD
- Content not consumed

GET /api/v1/admin/collusion-flags
- ADMIN only

POST /api/v1/admin/collusion-flags/{id}/action
- ADMIN only
- Must require reason
```

Vì Admin hiện “chưa thực hiện” trong hệ thống trước đó, nếu muốn ship admin dashboard thì phải làm Admin role trước. Đây là blocker kỹ thuật/nghiệp vụ.

# 4. Đề xuất chỉnh lại MVP

## MVP nên giảm còn 3 phần

### MVP-1: Teacher Tier + Rating

```txt
- TeacherRating entity
- Review endpoint
- Verified-purchase-only review
- Tier calculation
- Tier badge public
- Tier fallback cho existing teachers
```

### MVP-2: Escrow

```txt
- EscrowTransaction
- Hold coin khi purchase
- Release sau 7 ngày
- Refund nếu chưa consume
- Ledger events
```

### MVP-3: Anti-collusion Admin Review

```txt
- CollusionFlag
- Daily detection
- Admin review action
- Wallet hold/freeze
- Audit log
```

Thứ tự nên làm:

```txt
1. Escrow trước
2. Rating + tier
3. Dynamic spread
4. Anti-collusion
5. Admin dashboard
```

Lý do: escrow là nền tảng để giữ tiền và xử lý dispute. Nếu chưa có escrow, anti-collusion phát hiện xong cũng khó thu hồi.

# 5. Quyết định nên sửa trong file

## Sửa 1: Đổi “spread theo withdrawal rate” thành “spread khi release escrow”

Nên sửa từ:

```txt
WITHDRAWAL_VND_PER_COIN_BY_TIER
```

thành:

```txt
TIER_PLATFORM_FEE_PERCENT
TIER_TEACHER_SHARE_PERCENT
```

Ví dụ:

```txt
NEWBIE:
- teacherSharePercent: 80
- platformFeePercent: 20

BRONZE:
- teacherSharePercent: 85
- platformFeePercent: 15

SILVER:
- teacherSharePercent: 90
- platformFeePercent: 10

GOLD:
- teacherSharePercent: 95
- platformFeePercent: 5

ELITE:
- teacherSharePercent: 97
- platformFeePercent: 3
```

`WITHDRAWAL_VND_PER_COIN` chỉ giữ cho simulator rút tiền.

## Sửa 2: Gộp hoặc bỏ escrow fee 1%

Khuyến nghị cho MVP:

```txt
Bỏ ESCROW_ADMIN_FEE_PERCENT=1.
Admin revenue đã nằm trong tier spread.
```

Nếu vẫn giữ, phải ghi rõ:

```txt
Teacher final received = grossAmount * teacherSharePercent * (1 - escrowFeePercent)
```

## Sửa 3: Review phải gắn với verified purchase

Thêm rule:

```txt
Only verified students who purchased and consumed the content can review.
One review per student per content.
Reviews from suspicious/confirmed wash transactions are excluded from tier calculation.
```

## Sửa 4: Anti-collusion không chỉ dựa vào số transaction

Thêm risk score:

```txt
- repeated pair count
- reciprocal transaction ratio
- account age
- same device/IP signal nếu có
- no learning activity after purchase
- repeated high rating after purchase
- abnormal refund pattern
```

## Sửa 5: Thêm transaction ledger

Thêm entity hoặc enum transaction type:

```txt
ESCROW_HELD
ESCROW_RELEASED
ESCROW_REFUNDED
PLATFORM_FEE_COLLECTED
TEACHER_REVENUE_CREDITED
WALLET_HELD
WALLET_FROZEN
WITHDRAWAL_BLOCKED
```

# 6. Kết luận

## Điểm số đánh giá

```txt
Nghiệp vụ tổng thể: 8/10
Tính phù hợp với Seika: 8.5/10
Khả năng triển khai MVP: 6.5/10
Độ rõ service boundary: 6.5/10
Anti-abuse design: 7.5/10
```

## Kết luận chính

```txt
Thiết kế đúng hướng, có chiều sâu và phù hợp với Seika.

Nhưng cần chỉnh 5 điểm trước khi đưa vào PLAN:
1. Không nên gọi dynamic spread là withdrawal rate; nên tính spread khi release escrow.
2. MVP 2–3 tuần quá rộng, nên chia thành 3 phase.
3. Rating/tier phải loại trừ review từ transaction suspicious/wash.
4. Anti-collusion threshold cần risk score để giảm false positive.
5. Wallet/economy phải có ledger rõ cho escrow, fee, release, refund, hold, freeze.
```

## Quyết định khuyến nghị

```txt
Approve hướng nghiệp vụ.
Request revision trước Phase PLAN.

Không đổi sang two-token.
Không thêm stake trong MVP.
Giữ tier badge public.
Giữ escrow 7 ngày.
Chỉnh dynamic spread sang release-time spread.
Tách MVP thành nhiều phase nhỏ hơn.
```
