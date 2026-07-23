# Báo cáo trạng thái sửa lỗi Teacher Marketplace và Escrow

## 0. Cập nhật sau vòng sửa lỗi

Các trạng thái trong mục 4 được ghi lại tại thời điểm review ban đầu. Sau vòng sửa lỗi tiếp theo, các mục sau đã được đóng:

| Mã cũ              | Trạng thái mới | Cách giải quyết                                                                                                                                            |
| ------------------ | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CRITICAL-OPEN-01` | Đã sửa         | Escrow result đi qua inbox với SHA-256 của `eventType + idempotencyKey`; hai result event khác `eventId` nhưng cùng business key chỉ được áp dụng một lần. |
| `HIGH-OPEN-02`     | Đã sửa         | Giữ cột PostgreSQL hiện tại là `value`; H2 dùng `NON_KEYWORDS=VALUE`, không cần migration rename cột production.                                           |
| `MEDIUM-OPEN-03`   | Đã sửa         | Partial refund dùng allocator có giới hạn source balance, tổng phân bổ luôn bằng refund amount và không sinh amount âm.                                    |
| `MEDIUM-OPEN-04`   | Đã sửa         | Test tắt Config Client và Rabbit listeners; scheduling chỉ bật ở profile khác `test`; H2 tạo schema sạch.                                                  |
| `MEDIUM-OPEN-05`   | Đã sửa         | Main application trở lại `configserver:` và `fail-fast: true`; chỉ test profile tắt Config Client.                                                         |
| `LOW-OPEN-06`      | Đã sửa         | Create-order controller chỉ dựng item từ `productId` và `quantity`; buyer lấy từ authentication/header.                                                    |
| `OPEN-09`          | Đã gia cố      | Inbox chống duplicate result và repository dùng `PESSIMISTIC_WRITE` cho escrow lookup/due-release query.                                                   |

Các hạng mục còn mở sau vòng sửa:

- Reversal sau release: là nghiệp vụ mới, hiện hệ thống chủ động từ chối refund sau payout.
- Đối soát dữ liệu lịch sử: cần chọn reset database hoặc chạy audit dry-run trước khi sửa dữ liệu.
- Stress test trên RabbitMQ thật: unit tests đã kiểm tra business idempotency và DB locking, nhưng chưa thay thế load test đa instance.
- Cảnh báo min/max product price: cấu hình hiện tại dùng absolute URL `http://wallet-service:8084`; chưa tái hiện lại được cảnh báo cũ.

Kết quả kiểm chứng sau sửa:

- Marketplace regression suite: 40 test pass trước khi thêm DB-lock test; DB-lock test riêng pass.
- Wallet full suite: 30/30 pass.
- Wallet context test sau sửa JSON/H2: pass, không còn lỗi tạo bảng `wallet_outbox_events`.
- Test logs không còn fetch Config Server, kết nối RabbitMQ hoặc chạy scheduler trong profile `test`.

## 1. Thông tin chung

- Ngày review: 19/07/2026.
- Phạm vi: tạo và duyệt sản phẩm, mua hàng, wallet debit, escrow, refund, payout cho giáo viên và phí nền tảng.
- Nguồn đối chiếu: `teacher-marketplace-escrow-api-audit-report.md`, staged changes hiện tại và source code liên quan.
- Trạng thái Git tại thời điểm review: các thay đổi nghiệp vụ đang nằm trong staging area, chưa thuộc commit `HEAD` hiện tại.

## 2. Kết quả kiểm thử

| Hạng mục                       | Kết quả    | Ghi chú                                                            |
| ------------------------------ | ---------- | ------------------------------------------------------------------ |
| Marketplace unit/context tests | 37/37 pass | Context vẫn kết nối Config Server và RabbitMQ thật.                |
| Wallet unit/context tests      | 30/30 pass | Có lỗi background scheduler truy vấn H2 sau khi schema đã bị drop. |
| Kiểm tra định dạng staged diff | Pass       | `git diff --cached --check` không phát hiện lỗi whitespace.        |
| API E2E gần nhất               | Pass       | Run `20260719190820` theo báo cáo audit trước đó.                  |

Kết quả test xanh xác nhận được nhiều nhánh nghiệp vụ chính, nhưng chưa đủ để kết luận toàn bộ luồng an toàn trước duplicate delivery và concurrent processing.

## 3. Các vấn đề đã sửa

### FIXED-01 - Order không còn tin giá và seller từ client

**Trạng thái:** Đã sửa và có unit test/E2E.

`OrderService` đọc lại product đang `active` và `PUBLISHED` từ database, sau đó dùng dữ liệu canonical cho:

- Giá sản phẩm.
- Seller.
- Product type.
- Reference ID.
- Tên sản phẩm.

Server cũng chặn product chưa publish, product trùng trong cùng order và quantity khác 1 đối với nội dung số. Thay đổi này ngăn client sửa giá hoặc chuyển tiền cho seller giả.

### FIXED-02 - Wallet tạo sớm không còn làm mất bonus khởi tạo

**Trạng thái:** Đã sửa và có regression test.

Wallet initialization không còn dùng điều kiện “wallet đã tồn tại” để kết luận bonus đã được cấp. Hệ thống dùng idempotency key `user:{userId}:wallet-initialized` và kiểm tra ledger `INITIAL_BONUS` cũ trước khi cấp bonus.

Kết quả mong đợi:

- Wallet rỗng được tạo bởi API trước event đăng ký vẫn nhận bonus.
- Event đăng ký bị gửi lại không cấp bonus lần hai.
- Dữ liệu cũ đã có ledger bonus chỉ được backfill idempotency key.

### FIXED-03 - Partial refund đã giảm giá trị escrow còn lại

**Trạng thái:** Đã sửa cho luồng tuần tự chuẩn và có unit test/E2E.

Khi nhận `wallet.refund.succeeded`, marketplace đã:

- Trừ số tiền hoàn khỏi từng source bucket.
- Giảm `grossAmount`.
- Tính lại `promoBackedAmount`.
- Xóa payout calculation cũ để lần release sau tính lại.

Ví dụ escrow 100 hoàn 40 sẽ còn 60 để chia cho teacher và platform, thay vì tiếp tục release theo 100.

### FIXED-04 - Chặn refund sau khi escrow đã release

**Trạng thái:** Đã sửa theo chính sách hiện tại.

Full refund và partial refund bị từ chối khi escrow đã `RELEASED` hoặc `REFUNDED`. Việc này ngăn buyer được cộng lại coin sau khi teacher và platform đã nhận payout.

Hệ thống hiện chưa hỗ trợ reversal sau release; đây là giới hạn nghiệp vụ có chủ đích để bảo toàn coin.

### FIXED-05 - Chặn credit và refund chạy đồng thời

**Trạng thái:** Đã sửa và có regression test.

Admin action bị từ chối nếu escrow đang có `creditRequestedAt` hoặc `refundRequestedAt`. Code không còn xóa timestamp để giả lập việc hủy một wallet command có thể đã được publish.

### FIXED-06 - Giảm nguy cơ trùng idempotency key giữa nhiều partial refund

**Trạng thái:** Đã sửa cho các lần refund tuần tự.

Partial refund key hiện chứa cả gross trước refund và amount:

```text
escrow:{escrowId}:partial-refund:{grossBefore}:{refundAmount}
```

Hai lần hoàn cùng amount trên hai số dư escrow khác nhau không còn bị wallet coi là cùng một command.

### FIXED-07 - `adminNoRefund` không còn để escrow mắc kẹt trong hàng chờ

**Trạng thái:** Đã sửa và có unit test.

Khi admin từ chối refund:

- Escrow trở lại `HELD`.
- `needsAdminDecision` được xóa.
- Nếu đã đến hạn release, payout được request ngay.
- Nếu chưa đến hạn, scheduler sẽ release theo `releaseAt`.
- Quyết định admin được ghi log.

### FIXED-08 - Maven context test đã có H2 và có thể chạy đến trạng thái pass

**Trạng thái:** Sửa một phần.

Hai service đã có H2 test dependency, test profile và `contextLoads` hiện pass. Tuy nhiên test vẫn chưa được cô lập hoàn toàn khỏi Config Server, RabbitMQ và scheduler; phần còn thiếu được ghi ở `OPEN-04`.

## 4. Các vấn đề chưa sửa hoặc chưa hoàn tất

### CRITICAL-OPEN-01 - Duplicate escrow result có thể áp dụng partial refund nhiều lần

**Trạng thái:** Chưa sửa. Cần xử lý trước khi coi luồng refund là an toàn.

Marketplace chỉ dùng inbox idempotency cho `wallet.debit.*`. Các event `wallet.credit.*` và `wallet.refund.*` được chuyển thẳng vào `EscrowService`.

Nếu cùng wallet command được xử lý lại:

1. Wallet nhận ra idempotency key và không cộng tiền buyer lần hai.
2. Wallet vẫn tạo một `wallet.refund.succeeded` mới.
3. Marketplace không deduplicate result theo business idempotency key.
4. `applyPartialRefund()` tiếp tục trừ escrow lần hai.

Ví dụ escrow 100 partial refund 40 có thể bị giảm từ 100 xuống 60, rồi từ 60 xuống 20 dù buyer chỉ được hoàn 40. Phần còn lại dùng để payout bị thiếu 40 coin.

**Hướng sửa đề xuất:**

- Lưu và kiểm tra refund/credit request key trên escrow; hoặc
- Dùng inbox có unique key `(eventType, idempotencyKey)` cho toàn bộ escrow result;
- Chỉ áp dụng result nếu key khớp wallet operation đang chờ;
- Thêm test redelivery cùng event và test hai event ID khác nhau nhưng cùng idempotency key.

### HIGH-OPEN-02 - Đổi cột `value` thành `config_value` chưa có database migration

**Trạng thái:** Chưa an toàn khi deploy trên database hiện tại.

Entity `MarketplaceConfig` đã đổi mapping từ cột `value` sang `config_value`, nhưng không có migration SQL. Database PostgreSQL hiện tại dùng `marketplace_configs.value` và Hibernate đang chạy `ddl-auto: update`.

Rủi ro:

- Service có thể không khởi động khi thêm cột `NOT NULL` vào bảng đã có dữ liệu.
- Config cũ không được đọc từ cột mới.
- Hibernate tạo cột mới thay vì rename cột cũ.

**Hướng sửa đề xuất:**

- Nếu rename là chủ đích, thêm migration `RENAME COLUMN value TO config_value`.
- Nếu thay đổi chỉ để tương thích H2, giữ mapping production là `value` và cấu hình H2 với `NON_KEYWORDS=VALUE`.

### MEDIUM-OPEN-03 - Partial refund có thể tạo source amount âm do rounding

**Trạng thái:** Chưa sửa.

Các nguồn bonus, reward và earned promo được nhân tỷ lệ rồi làm tròn riêng. `paidAmount` được tính bằng phần còn lại. Trong trường hợp nhiều source nhỏ, tổng phần đã làm tròn có thể lớn hơn refund amount, làm `paidAmount` âm và wallet từ chối command.

**Hướng sửa đề xuất:** dùng source allocator có giới hạn, đảm bảo mỗi source không âm, không vượt source balance và tổng source luôn bằng refund amount.

### MEDIUM-OPEN-04 - Test profile chưa cô lập khỏi hạ tầng ngoài

**Trạng thái:** Sửa một phần.

Trong lần review:

- Marketplace context test vẫn fetch config từ `localhost:8888`.
- Marketplace vẫn tạo kết nối RabbitMQ.
- Wallet scheduler vẫn chạy và log lỗi `wallet_outbox_events not found` sau khi H2 drop schema.

Điều này làm test có thể pass trên máy đang chạy hạ tầng local nhưng cho kết quả khác trên CI hoặc máy mới.

**Hướng sửa đề xuất:** tắt Config Client, Rabbit listener và scheduling trong test profile; không để remote Config Server ghi đè test properties.

### MEDIUM-OPEN-05 - Main application đã chuyển Config Server thành optional

**Trạng thái:** Chưa xác nhận đây có phải thay đổi chủ đích.

`marketplace-service` và `wallet-service` đã đổi từ `configserver:` sang `optional:configserver:` để hỗ trợ test local. Thay đổi này tác động cả runtime chính và có thể làm service tiếp tục khởi động khi remote config bị thiếu.

**Hướng sửa đề xuất:** giữ fail-fast trong main application và tắt Config Client riêng trong test profile.

### LOW-OPEN-06 - Order controller vẫn parse dữ liệu client trước canonicalization

**Trạng thái:** Chưa hoàn tất việc đơn giản hóa API contract.

Controller vẫn gọi `ProductType.valueOf(itemReq.getProductType())` trước khi `OrderService` đọc product thật. Request thiếu hoặc gửi product type không hợp lệ có thể thất bại trước bước canonicalization, dù server không cần tin trường này.

**Hướng sửa đề xuất:** request mua hàng chỉ cần `productId` và `quantity`; các trường price, seller, name, type và reference không nên là input bắt buộc.

### OPEN-07 - Chưa có reversal sau release

**Trạng thái:** Chưa triển khai; hiện được thay bằng chính sách từ chối refund sau release.

Nếu sau này cần chargeback sau payout, phải có saga đảo teacher earning, platform fee và buyer refund theo từng ledger/idempotency key. Không nên mở lại endpoint refund sau release nếu chưa có luồng reversal này.

### OPEN-08 - Chưa đối soát và sửa dữ liệu lịch sử

**Trạng thái:** Chưa sửa.

Code mới chỉ ngăn lỗi cho giao dịch tiếp theo. Các order, escrow hoặc ledger sai trước đó chưa được audit và backfill. Nếu giữ database hiện tại, cần script dry-run trước khi điều chỉnh dữ liệu.

### OPEN-09 - Chưa stress-test duplicate delivery và concurrent admin action

**Trạng thái:** Chưa thực hiện đầy đủ.

E2E hiện chủ yếu chạy tuần tự. Cần test broker redelivery, nhiều admin action đồng thời và crash giữa publish message với cập nhật trạng thái outbox. Hạng mục này đặc biệt quan trọng vì đã phát hiện `CRITICAL-OPEN-01`.

### OPEN-10 - Cảnh báo lấy min/max product price chưa được xử lý

**Trạng thái:** Chưa sửa.

Flashcard-service từng log cảnh báo khi gọi wallet-service để lấy `MIN_PRODUCT_PRICE` và `MAX_PRODUCT_PRICE`. Luồng hiện dùng default nên chưa làm E2E thất bại, nhưng thay đổi config runtime có thể không được áp dụng đúng.

## 5. Thứ tự ưu tiên đề xuất

1. Sửa idempotency cho toàn bộ escrow result và thêm duplicate-delivery tests.
2. Quyết định giữ `value` hay migrate sang `config_value`, sau đó bổ sung migration phù hợp.
3. Sửa source allocator của partial refund và test các trường hợp rounding biên.
4. Cô lập context tests khỏi Config Server, RabbitMQ và scheduler.
5. Khôi phục fail-fast cho main config nếu optional Config Server không phải chính sách runtime.
6. Đơn giản hóa create-order request về `productId` và `quantity`.
7. Thực hiện audit dữ liệu lịch sử hoặc reset database nếu dữ liệu chỉ phục vụ phát triển cá nhân.

## 6. Kết luận

Các lỗi nền tảng ban đầu về client sửa giá, mất bonus khởi tạo, payout trên gross cũ, refund sau release, wallet command chạy chồng và `adminNoRefund` mắc kẹt đã được xử lý cho luồng tuần tự chính.

Tuy nhiên, luồng partial refund chưa thể coi là hoàn toàn an toàn trước cơ chế at-least-once delivery của RabbitMQ. `CRITICAL-OPEN-01` và migration của `marketplace_configs` là hai hạng mục cần xử lý trước khi chốt thay đổi hiện tại.
