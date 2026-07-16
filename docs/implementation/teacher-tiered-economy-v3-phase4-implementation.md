# Teacher Tiered Economy V3 Phase 4 Implementation

## Scope

Implemented Phase 4 from `docs/implementation/teacher-tiered-economy-v3-remediation-plan.md`:

- Teacher wallet wording aligned with V3 balance semantics.
- Teacher wallet now shows active hold/freeze visibility and blocks cash-out UI when wallet operations are currently restricted.
- Profile service now mirrors marketplace teacher tier/rating display fields from `teacher.tier.updated` events without recomputing tier locally.

## Teacher Wallet UI

Updated the teacher wallet primary cards to use the V3 wording:

- `Có thể rút`: withdrawable teacher earnings from `earnedWithdrawableBalance`.
- `Chỉ dùng trong app`: app-only coin buckets from bonus/reward/paid/earned promo balances.
- `Đang chờ escrow`: seller escrow amount that has not yet been released into wallet balances.

Added `walletService.getMyHolds()` for `GET /api/wallet/holds/me` and loaded it through `useWalletData`.

Added `WalletControlPanel` on the teacher wallet page:

- Shows wallet `frozen` state from balance breakdown.
- Lists active wallet holds with reason, source flag, and expiry.
- Explains when cash-out is blocked.

Updated `CashOutForm` to disable inputs and submit when wallet is frozen or has active holds, so the UI matches backend enforcement.

## Profile Service Tier Mirror

Profile service now stores marketplace tier display fields on `TeacherProfile`:

- `teacherTier`
- `teacherAverageRating`
- `teacherValidReviewCount`
- `teacherTierFeePercent`
- `teacherTierUpdatedAt`

These fields are nullable at the database level to keep `ddl-auto:update` safe for existing `teacher_profile` rows. The entity and response mapping provide display fallbacks for old rows.

Added RabbitMQ wiring:

- Queue: `profile.teacher-tier-updated`
- Exchange: `marketplace.events`
- Routing key: `teacher.tier.updated`

`TeacherStatsConsumer.handleTeacherTierUpdated` deserializes the marketplace event and updates only the display mirror fields. Marketplace remains the source of truth for all tier computation.

## Verification

Commands run successfully:

```txt
npm --prefix src/web-app run typecheck
mvn -pl src/services/profile-service "-Dtest=TeacherStatsConsumerTest" test
```

The focused profile-service test verifies that a `teacher.tier.updated` payload updates the teacher profile tier, average rating, valid review count, fee percent, and update timestamp.
