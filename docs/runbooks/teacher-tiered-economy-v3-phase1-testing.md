# Testing Phase 1 Token Economy V3

## Verified Commands

Run from repo root:

```bash
rtk mvn -pl src/services/wallet-service -DskipTests compile
rtk mvn -pl src/services/marketplace-service -DskipTests compile
rtk mvn -pl src/services/wallet-service -Dtest=WalletSourceAllocatorTest test
rtk mvn -pl src/services/marketplace-service -Dtest=EscrowSafetyRulesTest test
```

Expected result:

```txt
BUILD SUCCESS
```

## Known Full Test Requirement

These full module commands currently run the new unit tests, then fail at the existing `contextLoads` test if `CONFIG_SERVER_URL` is not set:

```bash
rtk mvn -pl src/services/wallet-service test
rtk mvn -pl src/services/marketplace-service test
```

Observed failure:

```txt
Invalid URL: ${CONFIG_SERVER_URL}
ConfigClientFailFastException
```

To run full context tests, start config-service or export a valid config server URL first:

```bash
export CONFIG_SERVER_URL=http://localhost:8888
rtk mvn -pl src/services/wallet-service test
rtk mvn -pl src/services/marketplace-service test
```

## Manual Smoke Test

Start stack after DB reset:

```bash
docker compose up -d --build
```

Register a new student and check wallet breakdown:

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"phase1_student","password":"Test1234!","email":"phase1_student@test.local","fullName":"Phase 1 Student"}'
```

Expected wallet DB state for a student:

```txt
bonus_balance = 500
reward_balance = 0
paid_balance = 0
earned_withdrawable_balance = 0
earned_promo_balance = 0
held_balance = 0
frozen = false
balance = 500
```

Top up and verify:

```bash
curl -X POST http://localhost:8080/api/wallet/top-up \
  -H "Authorization: Bearer <student-token>" \
  -H "Content-Type: application/json" \
  -d '{"amountVnd":10000}'
```

Expected:

```txt
paid_balance increases by 100 when TOPUP_VND_PER_COIN = 100
wallet_ledger_entries has type TOP_UP, source PAID, amount_vnd 10000
```

Legacy spend alias used by flashcard-service:

```bash
curl -X POST http://localhost:8080/api/wallet/withdraw \
  -H "Authorization: Bearer <student-token>" \
  -H "Content-Type: application/json" \
  -d '{"amount":10,"description":"Legacy spend smoke test"}'
```

Expected:

```txt
BONUS is debited before REWARD, PAID, and EARNED_PROMO
```

Check balance breakdown:

```bash
curl http://localhost:8080/api/wallet/balance/breakdown \
  -H "Authorization: Bearer <token>"
```

## Marketplace Safety Manual Checks

After a successful purchase and `wallet.debit.succeeded`, check:

```sql
SELECT escrow_state, escrow_needs_review, escrow_review_reason
FROM order_items
WHERE order_id = '<order-id>';
```

Expected:

```txt
escrow_state = HELD
```

When teacher edits content during `HELD`, expected:

```txt
product.status = PENDING_REVIEW
product.active = false
order_items.escrow_state = PENDING_ADMIN_DECISION
orders.needs_admin_decision = true
```

When admin rejects/hides during `HELD`, expected:

```txt
order_items.escrow_state = CANCELLED_BY_ADMIN
order_items.escrow_fully_refunded = false
```

Hard delete unresolved product:

```bash
curl -X DELETE http://localhost:8080/api/marketplace/products/<product-id> \
  -H "Authorization: Bearer <teacher-token>"
```

Expected:

```txt
HTTP 409 Conflict
```

Archive unresolved product:

```bash
curl -X POST http://localhost:8080/api/marketplace/products/<product-id>/archive \
  -H "Authorization: Bearer <teacher-token>"
```

Expected:

```txt
product.status = HIDDEN
product.active = false
purchased inventory remains active
```
