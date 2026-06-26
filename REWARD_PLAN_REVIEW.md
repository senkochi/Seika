Edited REWARD_PLAN.md
Viewed REWARD_PLAN.md:556-592

## Review of **REWARD_PLAN.md**

### Overall Fit with the Current Architecture

| Aspect                          | How it aligns with the existing Seika micro‑service setup                                                                                                                                                                                | Comments / Suggested tweaks                                                                                                                                                                                                                        |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Event‑driven flow**           | The plan moves reward logic out of the front‑end and into a _Reward Processor_ that consumes `DeckCompletedEvent` and `QuizCompletedEvent`. This fits nicely with the **RabbitMQ / Outbox‑Inbox** pattern already present in the system. | ✅ Good match. Keep the outbox publishing in Flashcard and Quiz services (they already emit domain events).                                                                                                                                        |
| **Service boundaries**          | • _Wallet Service_ only handles coin balance & transaction creation.<br>• _Profile Service_ only handles EXP, level, streak.<br>• _Reward Processor_ is a new consumer that decides **when** to grant the reward.                        | ✅ Clean separation of concerns. The only addition is the `LearningRewardLog` table, which can live in its own _Reward Service_ or be colocated with either Wallet or Profile (prefer a dedicated **Reward Service** to keep the domain isolated). |
| **Cooldown / “once‑only” rule** | Implemented via `LearningRewardLog.last_reward_at` + unique `(user_id, reward_type, item_id)` constraint. This is a standard, DB‑level guard against duplicate rewards and works regardless of how many concurrent events arrive.        | ✅ Correct. Ensure the processor runs inside a DB transaction that both reads/updates the log and publishes `RewardGrantedEvent` to guarantee atomicity.                                                                                           |
| **Configuration**               | All reward values and cooldown periods are externalised in `application.yml`. This matches the typical Spring‑Boot / Micronaut config style used by the other services.                                                                  | ✅ No changes needed.                                                                                                                                                                                                                              |
| **Notification**                | The plan adds a `RewardGrantedEvent` consumer in the Notification Service to push an in‑app message. The UI already has a websocket / SSE channel for notifications, so this will integrate cleanly.                                     | ✅ Ensure the notification payload includes a unique ID for idempotent handling on the client side.                                                                                                                                                |
| **Front‑end changes**           | The UI no longer calls a `/reward` endpoint; it just displays the balance and listens for `RewardGrantedEvent`. This removes a potential attack surface (no direct reward API for the client).                                           | ✅ Good practice. The only addition needed is a small listener (e.g., via existing WebSocket connection) to display the toast.                                                                                                                     |
| **Testing & verification**      | The plan lists unit, integration, e2e, and load tests. This matches the existing CI/CD pipeline for other services.                                                                                                                      | ✅ Ensure the load test uses the same _duplicate‑event_ scenario (multiple identical `DeckCompletedEvent`s) to prove idempotency.                                                                                                                  |
| **Scalability**                 | Event‑driven processing naturally decouples reward calculation from the user‑facing services, allowing horizontal scaling of the Reward Processor.                                                                                       | ✅ No issues.                                                                                                                                                                                                                                      |

---

## Minor Issues & Recommendations

1. **Location of `LearningRewardLog`**
   - _Option A_: **Reward Service** (new microservice) that owns the log and exposes a tiny gRPC/REST API for the processor.
   - _Option B_: **Wallet Service** (since rewards affect coin balance).
   - _Recommendation_: Create a **dedicated Reward Service** (even if it’s just a small Spring Boot app) to keep the wallet focused on financial transactions and the profile focused on EXP. This will also make future reward types (e.g., badges) easier to add.

2. **Event Payload Size**
   - `DeckCompletedEvent` and `QuizCompletedEvent` currently contain only IDs and timestamps.
   - The Reward Processor will need to look up the **reward config** (coins/exp) and also the **cool‑down** value. Consider adding `rewardConfigVersion` or a **correlationId** to the events to aid debugging.

3. **Idempotent Consumer Implementation**
   - Although the DB unique constraint prevents duplicate rows, the processor must also be **idempotent** at the message‑consumer level (RabbitMQ may redeliver). Implement an _outbox pattern_ inside the Reward Processor: after granting a reward, write a `RewardGrantedEvent` to its own outbox and only ack the incoming message after the outbox write succeeds.

4. **Handling Partial Failures**
   - If the Wallet Service succeeds but the Profile Service fails (or vice‑versa), you could end up with an inconsistent state. Consider a **saga** style compensation: the `RewardGrantedEvent` could be processed by a **Reward Orchestrator** that invokes both Wallet and Profile in a single DB transaction (using a shared DB or a two‑phase commit). If a shared DB isn’t possible, keep the **eventual consistency** model but add a **reconciliation job** that periodically verifies that `coins + exp` matches all `RewardGrantedEvent`s.

5. **Passing Score Threshold**
   - The plan mentions `passing_score: 70`. Make sure the Quiz Service publishes `QuizCompletedEvent` **only when the passing condition is met** (or include a boolean `passed` flag). This avoids the Reward Processor having to duplicate quiz‑scoring logic.

6. **Frontend “Next reward available in X days”**
   - The UI needs the `last_reward_at` timestamp. Add this field to the **Reward Log** response API (or expose a `/user/reward/status` endpoint) so the front‑end can calculate the remaining cooldown.

7. **Internationalisation**
   - Notification messages (`You earned 100 Coins and 50 EXP`) are hard‑coded English in the plan. The system already has a `i18n` layer; make the notification payload contain a _template key_ (e.g., `reward.granted`) and the interpolation data (`coins`, `exp`).

8. **Security / Abuse Detection**
   - Consider adding a **rate‑limit** on the number of `DeckCompletedEvent`s a user can emit per day (even with cooldown) to detect abnormal automation.

9. **Documentation Consistency**
   - The markdown ends with two triple‑backticks blocks (` ``` `) without a closing code fence. Clean them up to avoid rendering issues.

---

## Suggested Edits (high‑level, not applied automatically)

Below are the concrete modifications you may want to apply to the **REWARD_PLAN.md** file.

````diff
@@
-## Reward Processor
+## Reward Service & Processor
+<!-- New dedicated microservice that owns LearningRewardLog -->

-### LearningRewardLog
+### LearningRewardLog (owned by Reward Service)
@@
-UNIQUE(
-  user_id,
-  reward_type,
-  item_id
-)
+UNIQUE(user_id, reward_type, item_id)   -- enforced at DB level
+-- Index on (user_id, reward_type) for quick cooldown look‑ups
@@
-## Notification Service
-
-Consume:
-RewardGrantedEvent
-
-Action:
-
-Tạo notification:
-
-```text
-You earned 100 Coins and 50 EXP
-```
+## Notification Service
+
+Consume:
+`RewardGrantedEvent`
+
+Action:
+* Create a localized notification (i18n key `reward.granted` with params `{coins, exp, source}`).
+* Publish through existing websocket / push channel.
@@
-## Frontend Changes
-
-...
-
-## Flashcard Screen
-
-Hiển thị:
-
-```text
-Next reward available in X days
-```
+## Front‑end Adjustments
+
+* **Dashboard** – Show current coin/EXP/level (already fetched from Profile/Wallet APIs).
+* **Flashcard Screen** – After deck completion, call a **GET** `/user/reward/status?type=flashcard&itemId={deckId}` to obtain `nextEligibleAt`. Render “Next reward available in X days” based on that timestamp.
+* **Quiz Screen** – Listen for the `RewardGrantedEvent` via the existing WebSocket channel and display a toast: `+{coins} Coins, +{exp} EXP`.

````

Also, clean up the stray back‑ticks at the very end of the file:

````diff
-```
-```
-
-```
+<!-- removed duplicated closing fences -->
````

---

## Next Steps

1. **Confirm** the reward amounts, cooldown duration, and whether the quiz passing threshold is already enforced in the Quiz Service.
2. **Decide** on the placement of `LearningRewardLog` (new Reward Service vs. Wallet).
3. Update the **architecture diagram** to include the new Reward Service and the outbox/inbox flows for `RewardGrantedEvent`.
4. Add the suggested markdown changes to keep the documentation clean and up‑to‑date.
5. Proceed with the implementation plan (DB migration, new microservice, processors, front‑end listeners) once the above points are approved.

Feel free to let me know which of the suggested edits you’d like to apply, or if any of the open questions need further clarification!
