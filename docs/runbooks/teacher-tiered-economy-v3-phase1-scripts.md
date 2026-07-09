# Scripts For Phase 1 Collaboration

## Reset Database

Use the main reset runbook first:

```txt
docs/runbooks/db-reset-v3.md
```

Recommended reset:

```bash
cd /home/cuongnh/Projects/Seika
docker compose down
docker volume ls | grep -E "postgres|mongo|seika"
docker volume rm \
  seika_identity-db-data \
  seika_profile-db-data \
  seika_wallet-db-data \
  seika_marketplace-db-data \
  seika_mongo-data
docker compose up -d --build
```

If Compose created volumes with another prefix, replace the volume names with the names from `docker volume ls`.

## Build And Unit Test

```bash
cd /home/cuongnh/Projects/Seika
rtk mvn -pl src/services/wallet-service -DskipTests compile
rtk mvn -pl src/services/marketplace-service -DskipTests compile
rtk mvn -pl src/services/wallet-service -Dtest=WalletSourceAllocatorTest test
rtk mvn -pl src/services/marketplace-service -Dtest=EscrowSafetyRulesTest test
```

## Full Context Test

Requires config server:

```bash
export CONFIG_SERVER_URL=http://localhost:8888
rtk mvn -pl src/services/wallet-service test
rtk mvn -pl src/services/marketplace-service test
```

## Useful SQL Checks

Wallet buckets:

```sql
SELECT user_id,
       balance,
       bonus_balance,
       reward_balance,
       paid_balance,
       earned_withdrawable_balance,
       earned_promo_balance,
       held_balance,
       frozen
FROM wallets
ORDER BY update_at DESC;
```

Wallet ledger:

```sql
SELECT type,
       source,
       amount,
       withdrawable_amount,
       non_withdrawable_amount,
       amount_vnd,
       rate_vnd_per_coin,
       order_id,
       idempotency_key,
       created_at
FROM wallet_ledger_entries
ORDER BY created_at DESC;
```

Marketplace escrow guards:

```sql
SELECT oi.order_id,
       oi.product_id,
       oi.escrow_state,
       oi.escrow_needs_review,
       oi.escrow_review_reason,
       oi.escrow_fully_refunded,
       o.needs_admin_decision
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
ORDER BY oi.order_id DESC;
```

Marketplace config:

```sql
SELECT config_key, value, description, updated_by, updated_at
FROM marketplace_configs
ORDER BY config_key;
```

## API Smoke Commands

Wallet breakdown:

```bash
curl http://localhost:8080/api/wallet/balance/breakdown \
  -H "Authorization: Bearer <token>"
```

Top-up:

```bash
curl -X POST http://localhost:8080/api/wallet/top-up \
  -H "Authorization: Bearer <student-token>" \
  -H "Content-Type: application/json" \
  -d '{"amountVnd":10000}'
```

Marketplace config list:

```bash
curl http://localhost:8080/api/marketplace/admin/configs \
  -H "Authorization: Bearer <admin-token>"
```

Archive product:

```bash
curl -X POST http://localhost:8080/api/marketplace/products/<product-id>/archive \
  -H "Authorization: Bearer <teacher-token>"
```
