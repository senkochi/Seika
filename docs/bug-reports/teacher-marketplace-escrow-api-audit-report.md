# Báo cáo kiểm thử API luồng Teacher Marketplace và Escrow

## 1. Thông tin chung

- Ngày kiểm thử: 19/07/2026
- Phạm vi: giáo viên tạo nội dung, admin duyệt sản phẩm, học sinh mua, wallet debit, escrow, refund, payout cho giáo viên và phí nền tảng.
- Môi trường: Docker Compose local, API Gateway `http://localhost:8080`.
- Dữ liệu test: tài khoản và nội dung có prefix `e2e_*` hoặc `audit_*` kèm timestamp.
- Script tự động: `scripts/api-tests/teacher-marketplace-escrow-audit.ps1`.
- E2E run hoàn chỉnh: `20260719190820`, kết quả `PASS`.

## 2. Các invariant tài chính được dùng để kiểm tra

Mỗi giao dịch phải bảo toàn coin theo từng nguồn, không chỉ đúng tổng số:

```text
Coin buyer đã trả
= coin hoàn lại buyer
+ coin giáo viên nhận
+ phí nền tảng
```

Các nguồn `BONUS`, `REWARD` và `EARNED_PROMO` không được biến thành tiền có thể rút. Chỉ phần được hỗ trợ bởi `PAID` mới có thể tạo `EARNED_WITHDRAWABLE` cho giáo viên và `PLATFORM_FEE_REAL` cho nền tảng.

Với giáo viên tier `NEWBIE`, phí tier là 20% và escrow operation fee là 0%:

| Trường hợp                |          Buyer trả |         Hoàn buyer |                    Teacher |                  Platform | Tổng đối soát |
| ------------------------- | -----------------: | -----------------: | -------------------------: | ------------------------: | ------------: |
| Bonus-only                |          100 bonus |                  0 |                   80 promo |             20 promo sink |           100 |
| Paid-only                 |           100 paid |                  0 |            80 withdrawable |               20 real fee |           100 |
| Mixed, refund 40          | 50 bonus + 50 paid | 20 bonus + 20 paid | 24 promo + 24 withdrawable | 6 promo sink + 6 real fee |           100 |
| Full refund trước release |          100 bonus |          100 bonus |                          0 |                         0 |           100 |

## 3. Kịch bản API đã chạy

### E2E-01 - Tạo ví và bonus khởi tạo

1. Đổi tạm `STUDENT_INITIAL_COIN` theo từng scenario.
2. Đăng ký student và gọi ngay API đọc wallet để kích hoạt trường hợp tranh chấp thứ tự.
3. Chờ event `user.registered` và kiểm tra bucket nguồn.

Kết quả: student nhận đúng bonus cấu hình sau bản sửa.

### E2E-02 - Tạo và duyệt sản phẩm

1. Teacher tạo flashcard giá 100.
2. Chờ `flashcard.set.created` tạo product `PENDING_REVIEW`.
3. Admin approve thành `PUBLISHED`.
4. Thử mua product chưa approve và yêu cầu phải bị từ chối.

Kết quả: pass.

### E2E-03 - Chống sửa giá và người bán từ client

Gửi order item có dữ liệu giả:

```json
{
  "productType": "QUIZ",
  "referenceId": "forged-reference",
  "productName": "forged-name",
  "unitPrice": 1,
  "sellerUserId": "forged-seller"
}
```

Trong database, product thật là flashcard giá 100 và thuộc teacher test.

Kết quả sau bản sửa:

- Order total là 100, không phải 1.
- Escrow gross là 100.
- Seller, type, reference và name được lấy từ product trong database.
- Product chưa publish bị từ chối.
- Quantity khác 1 đối với nội dung số bị từ chối.

### E2E-04 - Bonus-only release

- Buyer: 500 bonus trước mua, 400 sau mua.
- Escrow: gross 100, bonus-backed 100.
- Sau release: teacher nhận 80 `EARNED_PROMO`.
- Platform ghi nhận 20 `PLATFORM_FEE_PROMO_SINK`.

Kết quả: pass và bảo toàn 100 coin.

### E2E-05 - Paid-only release

- Student khởi tạo 0 coin, top-up 20.000 VND tại tỷ giá 200 VND/Coin để nhận 100 paid coin.
- Escrow: paid-backed 100.
- Sau release: teacher nhận 80 `EARNED_WITHDRAWABLE`.
- Platform ghi nhận 20 `PLATFORM_FEE_REAL`.
- Thử refund sau release bị từ chối.

Kết quả: pass và bảo toàn 100 coin.

### E2E-06 - Mixed source, partial refund rồi release phần còn lại

- Student có 50 bonus và top-up 50 paid.
- Mua sản phẩm 100 tạo escrow gồm 50 bonus + 50 paid.
- Admin partial refund 40, buyer nhận lại 20 bonus + 20 paid.
- Escrow còn lại 60, gồm 30 bonus + 30 paid.
- Release phần còn lại trả teacher 24 promo + 24 withdrawable.
- Platform nhận 6 promo sink + 6 real fee.

Kết quả: pass và bảo toàn riêng từng source.

### E2E-07 - Self-service refund trước release

- Student mua sản phẩm 100 bằng bonus.
- Refund khi escrow còn `HELD` và nội dung chưa consume.
- Buyer nhận lại đúng 100 bonus.
- Teacher không nhận coin, platform không phát sinh phí.
- Escrow chuyển `REFUNDED`.

Kết quả: pass.

## 4. Vấn đề đã phát hiện và đã sửa

### CRITICAL-01 - Order tin tưởng giá và seller do client gửi

**Dấu hiệu**

Product có giá 100 nhưng client gửi `unitPrice = 1`; server tạo order total bằng 1. Client cũng có thể thay seller, product type, name và reference ID.

**Nguyên nhân**

`OrderService` không đọc bảng `products`. Toàn bộ order item được dựng trực tiếp từ request của frontend.

**Cách sửa**

- Inject `ProductRepository` vào `OrderService`.
- Chỉ cho mua product `active = true` và `status = PUBLISHED`.
- Lấy price, seller, type, reference và name từ database.
- Chặn product trùng trong cùng order.
- Chặn quantity khác 1 cho nội dung số.

**Trạng thái**: đã sửa, unit test pass, E2E pass.

### CRITICAL-02 - Race condition làm student mất bonus khởi tạo

**Dấu hiệu**

Student mới đăng ký có `balance = 0` dù `STUDENT_INITIAL_COIN = 500`.

**Nguyên nhân dễ hiểu**

1. Student gọi API wallet trước khi event đăng ký tới wallet-service.
2. API tự tạo một wallet rỗng.
3. Event `user.registered` tới sau, thấy wallet đã tồn tại nên không cấp bonus nữa.

**Cách sửa**

- Tách khái niệm “wallet đã tồn tại” khỏi “wallet đã được initialize”.
- Dùng idempotency key `user:{userId}:wallet-initialized`.
- Nếu wallet rỗng đã tồn tại nhưng chưa initialize, vẫn cộng bonus đúng một lần.
- Nếu event bị gửi lại, không cấp bonus lần hai.
- Nếu dữ liệu cũ đã có ledger `INITIAL_BONUS`, chỉ backfill idempotency key và không cộng thêm coin.

**Trạng thái**: đã sửa trong source; regression test pass. Phần fix chính đã E2E pass. Guard backfill ledger cũ được thêm sau lần build gần nhất nên cần rebuild wallet-service để đưa phần cuối này vào container.

### CRITICAL-03 - Partial refund không giảm giá trị escrow

**Dấu hiệu**

Escrow 100 đã hoàn 40 nhưng vẫn giữ gross 100 và các source bucket ban đầu. Nếu force-release tiếp, teacher được trả dựa trên 100 thay vì 60.

**Hậu quả trước sửa**

Buyer nhận refund 40, trong khi teacher và platform vẫn chia đủ 100. Tổng coin sau xử lý có thể thành 140.

**Cách sửa**

Khi nhận `wallet.refund.succeeded` cho partial refund:

- Trừ bonus đã hoàn khỏi `bonusBackedAmount`.
- Trừ reward, paid và earned promo tương ứng.
- Giảm `grossAmount` đúng tổng refund.
- Tính lại `promoBackedAmount`.
- Xóa các giá trị payout cũ để lần release sau tính lại từ số dư escrow còn lại.

**Trạng thái**: đã sửa, unit test pass, E2E mixed-source pass.

### CRITICAL-04 - Có thể refund sau khi escrow đã release

**Dấu hiệu**

Admin endpoint refund không kiểm tra trạng thái escrow. Buyer có thể được cộng lại tiền sau khi teacher đã nhận payout và platform đã ghi nhận phí.

**Hậu quả trước sửa**

Refund chỉ cộng tiền buyer, không thu hồi teacher earning và platform fee, do đó tạo thêm coin.

**Cách sửa hiện tại**

- Chặn full/partial refund khi escrow là `RELEASED` hoặc `REFUNDED`.
- Thông báo rõ rằng refund sau release cần một nghiệp vụ reversal riêng.

**Trạng thái**: đã sửa theo chính sách “không refund sau release”, unit test pass, E2E negative pass.

### CRITICAL-05 - Credit và refund có thể cùng chạy

**Dấu hiệu**

Code cũ xóa `creditRequestedAt` khi admin chọn refund và cho rằng credit đã bị hủy. Tuy nhiên outbox có thể đã publish lệnh credit sang RabbitMQ.

**Nguyên nhân dễ hiểu**

Xóa timestamp trong marketplace database không thể thu hồi message đã rời database.

**Cách sửa**

- Nếu `creditRequestedAt` hoặc `refundRequestedAt` khác null, từ chối tạo wallet command đối nghịch.
- Chỉ cho thao tác tiếp sau khi wallet trả kết quả success/failed.
- Không còn giả lập việc hủy message bằng cách xóa timestamp.

**Trạng thái**: đã sửa và có regression test.

### HIGH-01 - Idempotency key của partial refund có thể trùng

**Dấu hiệu**

Hai lần partial refund cùng amount dùng chung key `escrow:{id}:partial-refund:{amount}`. Wallet có thể coi lần sau là message trùng và bỏ qua.

**Cách sửa**

Key mới chứa cả gross trước refund và amount:

```text
escrow:{id}:partial-refund:{grossBefore}:{refundAmount}
```

**Trạng thái**: đã sửa và có regression test.

## 5. Vấn đề chưa giải quyết hoàn toàn

### OPEN-01 - Chưa có nghiệp vụ reversal sau release

Hiện refund sau release bị chặn để bảo toàn tiền. Nếu nghiệp vụ tương lai yêu cầu admin vẫn có thể hoàn tiền sau payout, cần triển khai saga reversal riêng:

1. Freeze hoặc trừ lại `EARNED_WITHDRAWABLE`/`EARNED_PROMO` của teacher.
2. Đảo `PLATFORM_FEE_REAL` và `PLATFORM_FEE_PROMO_SINK`.
3. Chỉ credit buyer sau khi các bước đảo tiền thành công hoặc đã ghi nhận công nợ.
4. Có idempotency key và ledger reversal riêng cho từng bước.

Mức ưu tiên đề xuất: cao nếu sản phẩm cần hỗ trợ chargeback/refund sau payout; thấp nếu chính sách chính thức là hết thời gian escrow thì không hoàn tiền.

### OPEN-02 - `adminNoRefund` chưa tạo trạng thái kết thúc rõ ràng

Code hiện tại đưa escrow về `PENDING_ADMIN_DECISION` và vẫn để `needsAdminDecision = true`. Tên action là “no refund” nhưng record vẫn chưa được giải quyết, có thể nằm mãi trong queue admin.

Hướng xử lý đề xuất:

- Hoặc `no-refund` phải tiếp tục release phần escrow còn lại.
- Hoặc thêm trạng thái terminal rõ ràng như `REFUND_DENIED`, sau đó scheduler release theo policy.

Mức ưu tiên đề xuất: medium.

### OPEN-03 - Chưa đối soát và sửa dữ liệu lịch sử đã sai

Code mới ngăn giao dịch sai tiếp theo nhưng không tự sửa các order/escrow/ledger đã phát sinh trước đó.

Cần viết một migration/audit script để tìm:

- Order item có unit price khác product price tại thời điểm mua.
- Escrow `RELEASED` nhưng sau đó buyer có ledger refund.
- Partial refund nhưng gross/source bucket chưa giảm.
- Wallet mới có balance 0, không có `INITIAL_BONUS`, dù role/config đáng lẽ được nhận bonus.

Không nên tự động cộng/trừ dữ liệu lịch sử trước khi xuất báo cáo dry-run và duyệt từng nhóm.

Mức ưu tiên đề xuất: high nếu muốn giữ database hiện tại; có thể bỏ qua nếu chấp nhận reset database cá nhân.

### OPEN-04 - Test `contextLoads` phụ thuộc Config Server khi chạy Maven ngoài Docker

Full suite hiện lỗi ở `MarketplaceServiceApplicationTests.contextLoads` vì `${CONFIG_SERVER_URL}` không được resolve trong môi trường Maven local. Các unit/regression test nghiệp vụ đã pass.

Hướng xử lý đề xuất:

- Tạo profile `test` với `spring.config.import=optional:configserver:` hoặc tắt Config Client trong test.
- Dùng H2/Testcontainers cho context test.
- Đưa biến môi trường test vào Maven Surefire/CI.

Mức ưu tiên đề xuất: medium, vì lỗi này làm full test suite không xanh dù logic đã đúng.

### OPEN-05 - Chưa stress-test duplicate delivery và concurrent admin action trên broker thật

E2E hiện kiểm tra tuần tự và unit test kiểm tra idempotency/guard. Chưa bắn đồng thời nhiều request refund/release hoặc chủ động redeliver cùng RabbitMQ message.

Hướng xử lý đề xuất:

- Thêm integration test gửi duplicate debit/credit/refund event.
- Gửi đồng thời force-release và refund trên cùng order item.
- Kiểm tra unique constraint/idempotency ledger đảm bảo chỉ một transaction commit.

Mức ưu tiên đề xuất: medium.

### OPEN-06 - Cảnh báo lấy config giá từ flashcard-service

Trong log có cảnh báo khi flashcard-service gọi wallet-service để lấy min/max product price: `target values must be absolute`. Service hiện dùng default nên E2E vẫn pass, nhưng thay đổi config runtime có thể không được flashcard-service áp dụng.

Hướng xử lý đề xuất: kiểm tra Feign client URL/service discovery config và thêm integration test cho `MIN_PRODUCT_PRICE`/`MAX_PRODUCT_PRICE`.

Mức ưu tiên đề xuất: medium.

## 6. Test tự động đã thêm

- `WalletInitializationTest`
  - Wallet rỗng tạo trước event vẫn nhận bonus.
  - Duplicate registration không cấp bonus lần hai.
  - Ledger bonus của dữ liệu cũ ngăn replay cấp trùng.
- `OrderProductValidationTest`
  - Dùng dữ liệu product canonical.
  - Chặn product chưa active/published.
  - Chặn quantity khác 1.
- `EscrowServiceTest`
  - Partial refund giảm gross và source bucket.
  - Chặn refund sau release.
  - Chặn refund khi credit đang in-flight.
- Cập nhật test full/partial refund cũ theo quy tắc outbox an toàn.

## 7. Kết luận

Các đường gây mất tiền/tạo thêm coin đã quan sát được đều đã được chặn trong source. Script E2E đã xác nhận các luồng bonus-only, paid-only, mixed partial refund, self-refund, product approval và các negative case chính.

Việc nên làm tiếp theo là rebuild wallet-service để nhận guard tương thích ledger cũ, sau đó chạy lại script E2E. Nếu giữ database hiện tại, ưu tiên tiếp theo là audit dữ liệu lịch sử; nếu database chỉ là dữ liệu phát triển có thể reset, có thể bỏ qua migration lịch sử và tập trung hoàn thiện `adminNoRefund`, test concurrency và test profile.
