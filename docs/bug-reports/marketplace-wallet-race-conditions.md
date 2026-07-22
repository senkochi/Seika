# Báo cáo lỗi: Race condition trong Marketplace và Wallet

## Thông tin

| Thuộc tính        | Giá trị                                                                           |
| ----------------- | --------------------------------------------------------------------------------- |
| Ngày phát hiện    | 2026-07-22                                                                        |
| Mức độ tổng thể   | High                                                                              |
| Service liên quan | `marketplace-service`, `wallet-service`, RabbitMQ, PostgreSQL                     |
| Phạm vi           | Checkout, inventory, inbox/outbox, debit, credit, refund, cash-out và wallet hold |
| Trạng thái        | Đã khắc phục trong code; chờ xác nhận staging PostgreSQL/RabbitMQ                 |

## Tóm tắt

Sản phẩm là nội dung số và không có số lượng tồn kho, nhưng hệ thống vẫn có cạnh tranh trên các tài nguyên logic: quyền sở hữu `(userId, productId)`, số dư wallet, trạng thái escrow và idempotency key. Một số luồng hiện dùng mẫu `check-then-insert` hoặc kiểm tra trạng thái trước khi lấy khóa. Hai request hoặc hai RabbitMQ delivery đồng thời vì vậy có thể cùng vượt qua bước kiểm tra.

## Các vấn đề

### RC-01 — Hai order mua cùng sản phẩm có thể cùng được tạo

`OrderService.createOrder()` kiểm tra lịch sử mua trước rồi mới tạo order. Query kiểm tra không khóa một tài nguyên chung, còn unique constraint của `order_items` chỉ áp dụng trong cùng một order.

Interleaving:

1. Request A và B cùng kiểm tra, đều chưa thấy giao dịch trước.
2. A và B tạo hai order khác ID.
3. Mỗi order sinh một key `order:{orderId}:debit` khác nhau.
4. Wallet xem đây là hai nghiệp vụ hợp lệ và có thể debit hai lần.
5. Unique inventory chỉ phát hiện xung đột sau debit, hoặc order thứ hai bỏ qua inventory nhưng vẫn tạo escrow.

Tác động: double charge, hai order `PAID`, hai escrow cho một entitlement, hoặc order/payment bị lệch trạng thái.

### RC-02 — Marketplace outbox không claim row atomically

Scheduler đọc các row `PENDING/FAILED`, publish rồi mới đổi `SENT`. Nhiều replica có thể cùng đọc và publish một row. Crash sau publish nhưng trước khi lưu `SENT` cũng tạo redelivery.

Tác động: cùng một debit/credit/refund command được gửi nhiều lần; mọi consumer bắt buộc phải idempotent theo business key.

### RC-03 — Credit/refund kiểm tra idempotency trước khi khóa wallet

Hai delivery đồng thời có thể cùng thấy key chưa tồn tại. Giao dịch thứ hai cuối cùng rollback do trùng primary key, nhưng listener hiện diễn giải exception này thành lỗi nghiệp vụ và phát thêm `wallet.credit.failed` hoặc `wallet.refund.failed`.

Tác động: Marketplace có thể nhận cả `succeeded` và `failed` cho cùng escrow, dẫn đến trạng thái escrow/order-item mâu thuẫn dù số dư không bị cộng hai lần.

### RC-04 — Inbox deduplication là check-then-insert

Hai consumer cùng đọc `messageId` chưa tồn tại rồi đều chạy business handler. Unique constraint rollback một transaction khi commit, nhưng side effect RabbitMQ trực tiếp như `content.purchased` không thể rollback. Việc lưu inbox `FAILED` rồi rethrow trong cùng transaction cũng bị rollback.

Tác động: xử lý lặp tạm thời, ghost event, retry count không phản ánh lỗi thực tế và consumer có thể requeue liên tục.

### RC-05 — Cash-out đua với wallet hold

`canCashOut()` chạy trước khi wallet được khóa. Hold có thể được đặt sau lần kiểm tra nhưng trước khi cash-out ghi sổ.

Tác động: tiền vẫn được rút trong thời điểm tài khoản đáng lẽ phải bị giữ để điều tra wash trading.

### RC-06 — Khởi tạo wallet lần đầu là select-then-insert

Hai transaction trên user chưa có wallet đều có thể không tìm thấy row và cùng insert. Unique `wallets.user_id` rollback một transaction; listener có thể biến lỗi kỹ thuật này thành kết quả nghiệp vụ thất bại thay vì load wallet vừa được tạo.

## Invariant cần đảm bảo

- Tại mọi thời điểm chỉ có một purchase claim chưa hủy hoặc entitlement cho `(userId, productId)`.
- Một business idempotency key chỉ làm thay đổi ledger đúng một lần.
- Duplicate delivery trả lại kết quả thành công tương đương, không sinh event `failed` mâu thuẫn.
- Một outbox row chỉ được một worker claim tại một thời điểm; consumer vẫn chịu được at-least-once delivery.
- Inbox phải claim message trước business logic và không phát side effect ngoài transaction trước commit.
- Cash-out và place-hold phải tuần tự hóa trên cùng transaction advisory lock theo user.

## Phương án khắc phục

1. Thêm purchase claim có unique `(user_id, product_id)` và tạo claim trong cùng transaction với order/outbox. Claim được release khi debit thất bại; inventory tái sử dụng claim khi thanh toán thành công.
2. Thêm checkout idempotency key ổn định ở API; DB uniqueness của purchase claim vẫn là lớp bảo vệ cuối cùng.
3. Chuyển Marketplace outbox sang `FOR UPDATE SKIP LOCKED`, có trạng thái claim, retry/backoff hữu hạn.
4. Với Wallet, lấy khóa wallet trước rồi mới kiểm tra key; duplicate trả success/no-op. Xử lý concurrent wallet creation bằng insert-or-load/retry an toàn.
5. Claim inbox atomically bằng insert có conflict handling; chuyển `content.purchased` sang transactional outbox.
6. Cash-out lấy khóa wallet trước, sau đó kiểm tra hold; place-hold cũng khóa cùng wallet.
7. Bổ sung test concurrency với PostgreSQL/Testcontainers hoặc test transaction có barrier/latch, bên cạnh unit test cho contract và query locking.

## Tiêu chí nghiệm thu

- Hai checkout đồng thời cùng user/product chỉ tạo tối đa một order có purchase claim; request còn lại nhận conflict/idempotent result và không gửi debit thứ hai.
- Hai credit/refund command cùng key chỉ tạo một thay đổi số dư và chỉ phát kết quả thành công tương thích.
- Hai outbox worker không claim cùng row.
- Duplicate wallet result không chạy business handler hai lần và không tạo ghost `content.purchased`.
- Hold và cash-out cùng user được tuần tự hóa; cash-out bị từ chối nếu hold thắng khóa trước.
- Toàn bộ test Marketplace và Wallet liên quan pass; có regression test riêng cho từng RC ở trên.

## Kết quả

Các biện pháp RC-01 đến RC-06 đã được triển khai và full test của hai service đều pass ngày 2026-07-22. Việc xác nhận tải đồng thời trên PostgreSQL/RabbitMQ thật vẫn cần thực hiện ở staging trước khi phát hành production.

Xem quy trình, thay đổi và bằng chứng kiểm thử tại [báo cáo triển khai](../implementation/marketplace-wallet-race-condition-remediation.md).
