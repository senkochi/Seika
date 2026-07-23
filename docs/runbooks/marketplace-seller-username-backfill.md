# Public username reconciliation

Identity automatically publishes public username mappings for every user 30 seconds
after startup and repeats reconciliation every 24 hours. Use this runbook to trigger
an immediate reconciliation after deploying Identity, Marketplace, and Wallet, or to
investigate missing names. The operation is idempotent.

## Preconditions

- Identity Service, Marketplace Service, and Wallet Service are healthy and registered
  in Eureka.
- RabbitMQ has the durable `marketplace.identity-events` queue and both bindings:
  `user.registered` and `user.public-identity.snapshot`.
- RabbitMQ has the durable `wallet.user-events` queue with the same two bindings.
- The caller has a valid ADMIN access token. Do not paste or log the token in shared
  terminals or build logs.

## Publish snapshots

Call through the Gateway:

```text
POST /api/admin/users/public-identities/snapshot?page=0&size=100
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
```

The response contains `published`, `page`, `size`, `totalElements`, and `totalPages`.
Repeat the request for pages `0` through `totalPages - 1`. Page size must be between
1 and 500.

If publication fails, retry the same page. Consumers upsert by `userId`, so redelivery
does not create duplicate projections.

## Verify

1. Confirm the Marketplace and Wallet consumers processed their identity queues
   without errors.
2. Confirm `seller_identity_projection` contains the expected teacher mappings.
3. Confirm no product keeps the old UUID fallback:

```sql
select count(*)
from products
where teacher_display_name is null
   or teacher_display_name = seller_user_id;
```

A non-zero count after the queue is drained indicates a teacher identity was missing
or invalid and should be investigated before considering reconciliation complete.

4. Confirm Wallet received usernames for existing ledger owners:

```sql
select count(*) from wallets where username is null;
```

A non-zero count indicates a missing or invalid identity event for that wallet.
