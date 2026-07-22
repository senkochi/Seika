# Runbook: Reset Database for V3 Token Economy

> **Mục đích:** Reset toàn bộ database (Postgres + MongoDB) về trạng thái rỗng trước khi triển khai Phase 1 của [docs/ideas/teacher-tiered-economy-v3.md](../ideas/teacher-tiered-economy-v3.md).
>
> **Quyết định gốc (D10):** Project cá nhân, dev trên nhiều máy cần baseline giống nhau, không migrate balance cũ.
>
> **Khi nào dùng:**
>
> - Lần đầu triển khai Phase 1 V3.
> - Sau khi đổi schema V3 (thêm column, đổi enum) mà muốn tất cả dev máy giống nhau.
> - Trước khi chạy integration test end-to-end cần DB sạch.

## Tổng quan hệ thống DB

Project dùng:

- **4 Postgres database** (mỗi service một DB riêng, theo `.env`):
  - `identity-service-seika` (port 5432 — Postgres identity-db)
  - `profile-service-seika` (port 5432 — Postgres profile-db)
  - `wallet-service-seika` (port 5432 — Postgres wallet-db)
  - `marketplace-service-seika` (port 5432 — Postgres marketplace-db)
- **3 MongoDB database** (single replica set `rs0`, host `mongo:27017`):
  - `notification-service-seika`
  - `flashcard-service-seika`
  - `quiz-service-seika`
- **Tất cả chạy trong Docker Compose** với host nội bộ là tên service (vd `wallet-db`, `mongo`).

## Quyết định phải đưa ra trước khi reset

- [ ] Đã export data quan trọng (nếu có) ra ngoài? Lệnh export xem [§ Backup tùy chọn](#backup-tùy-chọn-nếu-cần-giữ-data).
- [ ] Đã chốt với stakeholder: reset = mất toàn bộ wallet balance, order history, review, content cũ. User test accounts cũng mất.
- [ ] Đã tắt tất cả service đang connect DB (Compose down) để tránh locked connection.

## Phương án A: Reset qua Docker Compose (khuyến nghị)

**Cách nhanh nhất, an toàn nhất, không cần nhớ DB credential.** Reset cả volume, service tự tạo lại schema khi boot nhờ `spring.jpa.hibernate.ddl-auto: update`.

### Bước 1 — Dừng toàn bộ stack

```bash
cd /home/cuongnh/Projects/Seika
docker compose down
```

### Bước 2 — Xóa volumes chứa DB

**Xác nhận trước khi xóa — không phục hồi được:**

```bash
docker volume ls | grep -E "postgres|mongo|seika"
```

Danh sách thường thấy:

```
seika_identity-db-data
seika_profile-db-data
seika_wallet-db-data
seika_marketplace-db-data
seika_mongo-data
```

Xóa:

```bash
docker volume rm \
  seika_identity-db-data \
  seika_profile-db-data \
  seika_wallet-db-data \
  seika_marketplace-db-data \
  seika_mongo-data
```

Nếu tên volume khác (vd `src_identity-db-data` vì compose root là `src/`), dùng đúng tên in ra ở bước list.

### Bước 3 — Khởi động lại stack

```bash
docker compose up -d --build
```

Postgres và Mongo tự tạo DB rỗng. Các service tự tạo schema qua `ddl-auto: update` (~30s cho mỗi service lần đầu).

### Bước 4 — Verify

```bash
# Chờ service healthy
docker compose ps

# Check Eureka đã register đủ service
curl -s http://localhost:8761/eureka/apps | grep -E "<name>"

# Smoke test: register user mới và kiểm tra wallet tạo với bonusBalance = 500
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"smoke","password":"Test1234!","email":"smoke@test.local","fullName":"Smoke"}'
```

## Phương án B: Reset chỉ data, giữ volume (chỉ dành cho debug schema)

Dùng khi muốn thử nghiệm thay đổi schema nhanh mà không cần Compose down. Nguy hiểm hơn — dễ xóa nhầm.

### Bước 1 — Connect tới DB container

Postgres:

```bash
docker exec -it seika-wallet-db-1 psql -U postgres -d wallet-service-seika
```

(Thay `seika-wallet-db-1` bằng đúng tên container in ra từ `docker ps`.)

Mongo:

```bash
docker exec -it seika-mongo-1 mongosh
```

### Bước 2 — Drop & recreate

Postgres (lặp cho 4 DB):

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
\q
```

Mongo (lặp cho 3 DB):

```javascript
use flashcard-service-seika
db.dropDatabase()
use quiz-service-seika
db.dropDatabase()
use notification-service-seika
db.dropDatabase()
exit
```

### Bước 3 — Restart các service để chúng re-create schema

```bash
docker compose restart wallet-service profile-service marketplace-service identity-service flashcard-service quiz-service notification-service
```

## Backup tùy chọn (nếu cần giữ data)

**Chỉ chạy nếu thực sự cần.** Project cá nhân thường không cần backup — nếu đã ở Phase 1 V3, data cũ không còn ý nghĩa.

### Postgres backup (1 service)

```bash
docker exec seika-wallet-db-1 pg_dump -U postgres wallet-service-seika > wallet_backup_$(date +%Y%m%d).sql
```

### Mongo backup (1 service)

```bash
docker exec seika-mongo-1 mongodump --db flashcard-service-seika --out /tmp/mongo_backup
docker cp seika-mongo-1:/tmp/mongo_backup ./mongo_backup_$(date +%Y%m%d)
```

### Restore

Postgres:

```bash
cat wallet_backup_20260709.sql | docker exec -i seika-wallet-db-1 psql -U postgres -d wallet-service-seika
```

Mongo:

```bash
docker cp ./mongo_backup_20260709 seika-mongo-1:/tmp/
docker exec seika-mongo-1 mongorestore --db flashcard-service-seika /tmp/mongo_backup_20260709/flashcard-service-seika
```

## Lỗi thường gặp

### "database is being accessed by other users"

Service vẫn đang connect. Chạy `docker compose down` trước rồi reset, hoặc:

```bash
docker compose stop wallet-service
docker exec seika-wallet-db-1 psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'wallet-service-seika';"
docker exec seika-wallet-db-1 psql -U postgres -c "DROP DATABASE wallet-service-seika;"
docker exec seika-wallet-db-1 psql -U postgres -c "CREATE DATABASE wallet-service-seika OWNER postgres;"
```

### Volume không xóa được

```bash
docker volume ls -q | grep seika | xargs -I {} docker volume rm {}
```

### Sau reset, service không boot / crash

Có thể schema mới có lỗi. Xem log:

```bash
docker compose logs wallet-service --tail 100
```

Thường là do:

- `ddl-auto: update` không drop column cũ — cần drop manual.
- Enum value mới trong code chưa có trong DB check constraint.

Nếu là schema mới, đơn giản nhất là chạy lại Phương án A từ đầu.

## Sau khi reset xong

Đọc tiếp [docs/ideas/teacher-tiered-economy-v3.md § MVP Scope](../ideas/teacher-tiered-economy-v3.md#mvp-scope) để biết Phase 1 cần setup gì.

Verify baseline V3:

Với schema Marketplace có bảo vệ race condition, xác nhận các artifact mới đã được Hibernate tạo:

```sql
SELECT to_regclass('public.purchase_claims');
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'request_key';
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'outbox' AND column_name IN ('claimed_at', 'next_attempt_at');
```

1. Register user mới qua `POST /api/auth/register`.
2. Check wallet DB: `paidBalance=0, bonusBalance=500, rewardBalance=0, earnedWithdrawableBalance=0, earnedPromoBalance=0, heldBalance=0, frozen=false`.
3. Top-up 1000 VND → `paidBalance=10`.
4. Complete 1 flashcard deck → learning reward publish → `rewardBalance=20`.
5. Mua 1 quiz 30 coin → `bonusBalance=470, rewardBalance=20, paidBalance=10` (theo spend order `BONUS → REWARD → PAID`).

Nếu 5 bước trên pass → baseline V3 đã sẵn sàng cho Phase 2 escrow.
