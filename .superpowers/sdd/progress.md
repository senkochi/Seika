# SDD progress ledger — plan 2026-07-17-teacher-tiered-economy-v3-remediation

Plan file: docs/superpowers/plans/2026-07-17-teacher-tiered-economy-v3-remediation.md
Branch: cuong/dev (no commits until user review)

## Tasks

- [x] Task 1 (C-1 Pair canonicalization): complete; review approved after 1 fix round. Files: `CollusionFlagService.java` (modified, 59+/4-), `CollusionFlagServiceReciprocalRatioTest.java` (new). Tests: 1/1 new + 5/5 existing pass. Open minor (carry to whole-branch): reciprocalRatio now collapses to 1.0 for any multi-escrow pair under canonicalization; semantics shifted from "fraction with reverse-direction counterpart" — final review should assess whether the +15 reciprocity points fire too aggressively.

- [x] Task 2 (R-1 lookback filter): complete; review approved on first dispatch. Files: `ReviewRepository.java` (added derived finder), `CollusionFlagService.java` (transitionValidReviewsToPending signature + body + single caller), `CollusionFlagServiceTest.java` (new test appended; one stub line added to existing test for the new finder — documented minimum-impact concession). Tests: 6/6 pass.

- [x] Task 3 (R-2 partial refund invalidation): complete. Files: `EscrowService.java` (added `escrow.setCreditRequestedAt(null);` in requestPartialRefund), `EscrowPartialRefundInvalidatesCreditTest.java` (new). Tests: 4/4 pass (1 new + 3 existing). Open concern: `requestRefund` (full refund, lines 247-268) has the same R-2 bug — flagged for follow-up but out of scope per brief.

- [x] Task 4 (R-3 admin freeze/unfreeze): complete. Files: `AdminWalletControlController.java` (new, matches plan snippet verbatim), `AdminWalletControlControllerTest.java` (new). Tests: 3/3 pass. Deviation from plan: plan's test snippet used `@WebMvcTest` + `@MockBean`, but Spring Boot 4.0 / Spring Framework 7.0 relocated these annotations and the new path produced "Failed to find merged annotation for BootstrapWith". Implementer switched to `@SpringJUnitWebConfig` + nested `@TestSecurityConfig` to drive MockMvc + Spring Security + the controller explicitly. Tests still verify all three cases (admin freeze/unfreeze + student 403). Files remain un-staged.

- [x] Task 5 (R-4 + R-5 outbox hardening): complete. Files modified: `WalletOutboxEvent.java` (added claimedAt, nextAttemptAt, attemptCount), `WalletOutboxStatus.java` (added CLAIMED, DEAD), `WalletOutboxEventRepository.java` (added claimNextPendingBatch with `FOR UPDATE SKIP LOCKED`), `WalletOutboxProcessor.java` (claim → publish → SENT/DEAD-PENDING paths; outer try/catch on scheduledTick so a tick-level failure doesn't kill the scheduler), `RabbitMQConfig.java` (DLX/DLQ bean declarations + COLLUSION_FLAGS_QUEUE updated with `x-dead-letter-exchange = wallet.events.dlx`), `wallet-service.yaml` (publisher-confirm-type / publisher-returns if not already present), `WalletOutboxProcessorTest.java` (extended). Tests: 12/12 pass across new + existing suites. Concerns: (a) project uses Hibernate `ddl-auto: update` so no Flyway migration — schema additions rely on ddl-auto; (b) `findTop50ByStatusInOrderByCreatedAtAsc` is now dead in the repository (carry to whole-branch review as cleanup); (c) DLX is wired but CollusionEventConsumer still swallows (Task 6 closes that).

- [x] Task 6 (R-6 + R-7 consumer hardening): complete. Files: `CollusionEventConsumer.java` (rewrote handleCollusionFlaggedEvent: extracted handleConfirmed/handleMalicious helpers, validate teacherId/buyerId non-blank, rethrow as AmqpRejectAndDontRequeueException on JSON parse errors and missing/invalid identifiers; @Transactional added so both applyFreeze calls atomic). Tests: 4/4 pass (2 existing + 2 new). Concerns: (a) pre-existing WalletServiceApplicationTests.contextLoads environmental failure unrelated; (b) tests bypass Spring listener container so they verify the method contract not the broker -> DLX routing (integration covered by queue arg from Task 5); (c) unknown status values still logged-and-dropped, same behavior as before — out of scope.

- [x] Task 7 (R-8 stale-event idempotency): complete. Files: `TeacherProfile.java` (added `lastProcessedEventId` field), `TeacherStatsConsumer.java` (added stale-event guard using lexicographic compare + persists eventId on success), `TeacherStatsConsumerTest.java` (new test). Tests: 2/2 pass. Project uses Hibernate `ddl-auto: update`, no Flyway migration.

- [x] Task 8 (R-9 + R-10 frontend gates): complete. Files: `ProductDetail.tsx` (added `isEscrowBuyer` + `isOwnProduct` derived booleans; refund button gated on `escrow.buyerId === userId`; review form gated on `product.sellerUserId !== userId`). Verify: typecheck ✓ lint ✓ build ✓. Deviation from brief: implementer used existing `useAppSelector((state) => state.userProfile.userId)` selector (already at line 128) instead of `state.auth.user?.id` (auth slice has no `user` object — verified by reading authSlice.ts). Used plain `<p className="text-sm text-white/55">` instead of MUI `<Typography>` because the file uses Tailwind throughout (no MUI imports).

- [x] Task 9 (R-12 outbox dedup): complete. Files: `WalletCommandOutboxService.java` (renamed `saveOutbox` → `enqueueOutboxResult`; three private typed-event enqueue methods now end with shared helper calls). Tests: 2/2 pass without modification. Deviation from brief: brief assumed public methods with `(String id, XxxPayload, String reason)` signatures; reality is private helpers taking request events. Only the save portion was truly duplicated, and that's what was collapsed. Behavior preserved.

- [x] Task 10 (rollback vn→en regression): complete. Files: `Marketplace.tsx` (16 English strings reverted to their pre-regression Vietnamese wording). Verify: typecheck ✓ lint ✓ build ✓. Important correction: brief blamed commit `e44fec1`, but the regression actually came from `1d8618d` (phase 3 commit). Pre-`1d8618d` Vietnamese wording was restored, verified against `git show 1d8618d^:...Marketplace.tsx`. 8 English strings left as-is because they're NEW copy from `1d8618d` itself (no prior Vietnamese exists): "Flashcard", "Quiz", "Teacher", "NEWBIE", "Coins", "Details", "Buy", "Failed to load marketplace products.". `"Buy"` had a pre-existing `"Mua"` counterpart — flagged for user if they want it translated too, otherwise leave alone.

- [x] Task 11 (merge-blocker fix: requestRefund must invalidate prior creditRequestedAt): complete. Files: `EscrowService.java` (mirrored Task 3's one-line `escrow.setCreditRequestedAt(null);` into `requestRefund`), `EscrowFullRefundInvalidatesCreditTest.java` (new, mirrors `EscrowPartialRefundInvalidatesCreditTest`'s ArgumentCaptor pattern but exercises `adminFullRefund`). Tests: 5/5 pass (1 new + 1 partial-refund + 3 pre-existing EscrowServiceTest). Both files un-staged per session-wide no-commit rule.

## Final whole-branch review

**Verdict: Approve** — all merge-blockers resolved.

| Item | Status |
|---|---|
| C-1, R-1, R-2, R-3, R-4, R-5, R-6, R-7, R-8, R-9, R-10, R-12, vn→en rollback | ✅ 13/13 pass |
| Cross-cutting concerns | 11 low-severity follow-ups noted |
| Open-concern #1 — reciprocalRatio semantics shifted under canonicalization | follow-up |
| Open-concern #2 — `requestRefund` (full refund) had same R-2 bug as partial | ✅ RESOLVED in Task 11 |
| Open-concern #3 — `findTop50ByStatusInOrderByCreatedAtAsc` dead code in repo | follow-up |
| Open-concern #4 — 8 English strings left on Marketplace.tsx (NEW copy from phase 3) | not-a-concern (verified) |

**All follow-ups (not blocking merge):**
- `WalletOutboxProcessor` does not register a `ConfirmCallback` / `ReturnsCallback` despite publisher-confirm-type being enabled — broker accept-without-route still marks SENT silently. Add a `CorrelationData` per event + confirm/return callbacks OR set `spring.rabbitmq.template.mandatory: true` + a returns callback.
- `computeRiskScore` (static, lines 100-109) is now dead — only `computeConfiguredRiskScore` is reachable. Remove or deprecate.
- `WalletOutboxProcessorTest.java:169-171` has unused `eq` helper. Remove.
- `computeConfiguredRiskScore` uses hard-coded `0.7` threshold for reciprocal (line 341) and a hard-coded `0.6` / `0.7` for promo / no-consume — should consult `MarketplaceConfigService.KEY_COLLUSION_RECIPROCAL_RATIO_THRESHOLD` (and friends) to match the configured-risk-score spirit.
- `findTop50ByStatusInOrderByCreatedAtAsc` is dead code in `WalletOutboxEventRepository.java:16`. Remove.