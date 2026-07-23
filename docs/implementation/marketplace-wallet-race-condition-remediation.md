# Báo cáo khắc phục race condition Marketplace và Wallet

## Thông tin thực hiện

| Thuộc tính     | Giá trị                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------- |
| Ngày thực hiện | 2026-07-22                                                                                    |
| Phạm vi        | marketplace-service, wallet-service, PostgreSQL, RabbitMQ                                     |
| Kết quả        | Đã triển khai; full test hai service đều pass                                                 |
| Bug report     | [marketplace-wallet-race-conditions.md](../bug-reports/marketplace-wallet-race-conditions.md) |

## Giải pháp đã triển khai

### Marketplace

- Thêm purchase_claims với unique (user_id, product_id). Claim được tạo cùng transaction với order và debit outbox, chuyển OWNED khi debit thành công, xóa khi debit thất bại. Unique collision được trả thành HTTP 409.
- Hỗ trợ header tùy chọn Idempotency-Key; lưu orders.request_key và unique theo (user_id, request_key).
- Marketplace outbox claim batch bằng FOR UPDATE SKIP LOCKED, retry theo exponential backoff và dừng ở DEAD sau 8 lần.
- Inbox claim bằng một câu INSERT ... ON CONFLICT ... WHERE status = 'FAILED'. Duplicate đang/đã xử lý không chạy business logic; message lỗi cũ có thể retry.
- Debit result và escrow result dùng SHA-256 của eventType|idempotencyKey, nên UUID transport thay đổi không tạo lần xử lý mới.
- content.purchased được ghi vào outbox trong cùng transaction thay vì publish RabbitMQ trực tiếp.

### Wallet

- Thêm PostgreSQL transaction advisory lock theo userId, sau đó mới lấy pessimistic row lock của wallet.
- Tạo wallet, debit, escrow credit/refund và các mutation qua getOrCreateWallet() được tuần tự hóa giữa nhiều instance.
- Credit/refund kiểm tra idempotency sau khi khóa user/wallet, loại cửa sổ check-then-act.
- Cash-out lấy khóa trước khi kiểm tra hold; placeHold() dùng đúng cùng advisory lock, tạo một thứ tự tuyến tính cho hai thao tác.

## Quy trình thực hiện

1. Lập bug report và xác định invariant về entitlement, ledger, inbox/outbox và hold.
2. Viết regression test trước từng thay đổi. Các pha RED ghi nhận lỗi compile hoặc assertion cho purchase claim, atomic inbox, outbox claim, business-key deduplication, wallet lock ordering và checkout conflict.
3. Cài đặt thay đổi nhỏ nhất để chuyển từng nhóm test sang GREEN.
4. Review theo sáu trục: correctness, security, reliability, performance, maintainability và test coverage. Review phát hiện và sửa vị trí @Enumerated của Order.status.
5. Chạy full test và kiểm tra git diff --check.

## Kết quả kiểm thử

```powershell
cd src/services/marketplace-service
.\mvnw.cmd test
# 49 tests, 0 failures, 0 errors

cd ../wallet-service
.\mvnw.cmd test
# 35 tests, 0 failures, 0 errors
```

Regression coverage mới gồm checkout idempotency/claim conflict, claim lifecycle, atomic business inbox key, transactional content.purchased, outbox retry/dead state, wallet credit/refund lock ordering, wallet creation và hold/cash-out ordering.

## Thay đổi schema và triển khai

Marketplace cần tạo/cập nhật:

- bảng purchase_claims;
- cột orders.request_key và unique (user_id, request_key);
- cột outbox.claimed_at, outbox.next_attempt_at;
- các giá trị trạng thái outbox CLAIMED, DEAD (cột hiện là chuỗi).

Repository hiện dùng Hibernate ddl-auto=update, nhưng production nên áp dụng migration có version và backup trước khi deploy. Wallet không thêm bảng/cột, nhưng runtime PostgreSQL phải hỗ trợ pg_advisory_xact_lock và hashtextextended.

## Giới hạn và bước xác nhận staging

- H2 xác nhận Spring context/JPA mapping nhưng không thực thi các native PostgreSQL query mới. Cần test đồng thời trên PostgreSQL thật với ít nhất hai connection/instance.
- Outbox vẫn cung cấp at-least-once delivery: crash sau broker accept nhưng trước DB commit có thể publish lại. Atomic inbox và business idempotency là lớp bảo vệ bắt buộc.
- Cần chạy thử tải cho: hai checkout cùng user/product, hai credit/refund cùng key, hold đối đầu cash-out và hai outbox worker.
- Theo dõi số row DEAD, thời gian chờ advisory lock, purchase-claim conflict và inbox retry; cấu hình cảnh báo trước khi rollout toàn bộ.
