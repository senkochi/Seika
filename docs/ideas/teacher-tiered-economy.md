# Seika Token Economy — Tiered Teacher Model

> **Scope note:** Project cá nhân, nghiệp vụ là chính, không thương mại hóa → **bỏ qua** legal/tax compliance. Mục tiêu: nghiệp vụ hợp lý, code minh bạch, admin vận hành một mình.
>
> **GPT review note:** File `gpt-debate-teacher-tiered-idea.md` đã được đọc và cân nhắc. Một số critique được tích hợp (review verified-purchase, refund policy rõ ràng, threshold cải tiến 2 signals, ledger events rõ ràng). Một số khác bị từ chối có lý do (xem phần "GPT critique — đã giải quyết" cuối file).

## Problem Statement

**HMW** thiết kế token economy trên Seika để Admin tối đa hóa doanh thu nuôi hệ thống (mục tiêu chính), Teacher chủ động tạo content chất lượng cao, Student duy trì học tập bền bỉ — đồng thời chặn 3 rủi ro: (1) collusion teacher-student rút coin, (2) teacher spam content rẻ câu coin, (3) silent inflation từ initial coin grant?

## Recommended Direction

**Tiered Teacher + Escrow + Anti-collusion** — giữ nguyên triết lý token economy hiện tại nhưng thay spread cố định bằng **spread động theo teacher tier** kết hợp **escrow 7 ngày** và **anti-collusion 3-tier policy**. Ship trong **1 release duy nhất** (ước tính 3-4 tuần) — chấp nhận scope rộng để có 1 hệ thống coherent thay vì 3 release rời rạc.

### Tại sao hướng này

Thiết kế hiện tại (`TOPUP_VND_PER_COIN=100`, `WITHDRAWAL_VND_PER_COIN=90`) cho admin spread 10% — mức hợp lý nhưng **không phân biệt được teacher chất lượng cao vs thấp**, và **không có cơ chế chặn wash transaction**. Hướng này giải quyết bằng cách:

1. **Spread động theo teacher tier (5 mức):** teacher mới/untrusted → admin spread lớn (20%) → admin kiếm nhiều từ người mới; teacher top-rated → admin spread nhỏ (3%) → giữ chân teacher giỏi → tạo content chất lượng → giữ chân student → tăng tổng volume → admin vẫn lời tổng hợp ~12-15%.
2. **Escrow 7 ngày (fee 1% từ teacher):** khi student mua content, coin không chuyển thẳng cho teacher. Admin giữ 7 ngày → trong thời gian đó nếu có dispute/refund, admin can thiệp được. Sau 7 ngày, teacher nhận coin **đã trừ 1% admin fee riêng biệt** (không gộp vào tier spread). Student không chịu phí.
3. **Anti-collusion 3-tier policy (Suspicious / Confirmed / Malicious):** track transaction graph (A → B → A patterns). Threshold cải tiến với 2 signals (count > 5 VÀ reciprocal ratio > 0.7) → flag admin review manual → 3 mức xử lý tăng dần.
4. **Tier badge hiển thị public cho student** — giúp student chọn teacher uy tín (social proof), đồng thời tạo động lực cho teacher leo tier.
5. **Verified-purchase-only review** — chỉ student đã mua content mới review được, một review per (student, content), review từ transaction Suspicious/Confirmed wash bị loại khỏi tier calculation.

### Tại sao KHÔNG chọn các hướng khác

- **3-phase release (GPT đề xuất):** An toàn hơn về delivery, nhưng tạo ra 3 lần migration + refactor. Project cá nhân, 1 dev, ưu tiên coherence. 1 release lớn có thể quản lý được.
- **Two-token model:** Quá sớm cho pilot 100 user, redesign 1-2 tháng.
- **Subscription thay coin:** Giết gamification, mâu thuẫn tinh thần dự án.
- **Multi-tier UI filter cho student:** Vitamin, không phải painkiller — student có thể tự sort theo rating.

### Decisions đã chốt (từ user)

| Câu hỏi | Quyết định |
|---|---|
| Tax / legal VN compliance | **Bỏ qua** — project cá nhân, không thương mại hóa |
| Escrow fee 1% trả từ ai? | **Từ teacher** — student đã trả giá content, không charge thêm |
| Initial coin 500 có cần giảm? | **Giữ nguyên** — admin config-driven, có thể chỉnh khi cần |
| Tier badge hiển thị? | **Có** — hiển thị tier cho student xem |
| Wash transaction policy | **3-tier:** Suspicious / Confirmed wash / Malicious abuse |
| Release cadence | **1 release duy nhất** (3-4 tuần) thay vì 3 phase riêng |

## Key Assumptions to Validate

- [ ] **A1:** Admin có thể sustain infra cost với admin revenue > 10% (current) sau khi trừ escrow float cost
  - *Test:* Pilot 3 tháng, đo `Σ(admin_fee_transactions) / Σ(gross_transaction_value)` phải ≥ 12% (bao gồm tier spread trung bình ~10% + escrow fee 1% + 1% misc).
- [ ] **A2:** Teacher chấp nhận escrow 7 ngày (cash flow chậm hơn) để đổi lại tier-based spread cao hơn ở tier GOLD/ELITE
  - *Test:* Survey 20 teacher pilot trước khi ship; threshold đồng ý ≥ 60%.
- [ ] **A3:** Student không giảm mua khi biết có escrow (escrow không ảnh hưởng UX student, nhưng có thể ảnh hưởng trust)
  - *Test:* A/B test hiển thị "Bảo vệ bạn bởi Seika Escrow" badge trên checkout; đo conversion.
- [ ] **A4:** Wash transaction (teacher-student collusion) là vấn đề thực sự, không phải theoretical
  - *Test:* Manual review 50 transactions đầu tiên; nếu ≥ 10% là wash → ship anti-collusion là ưu tiên #1.
- [ ] **A5:** Teacher mới (chưa có rating) chấp nhận tier "NEWBIE" spread 20% (admin lời nhiều nhất) để đổi lại visibility
  - *Test:* Track teacher signup → first publish rate. Nếu < 50% publish content trong 30 ngày đầu → giảm NEWBIE spread xuống 15%.
- [ ] **A6:** Threshold cải tiến `count > 5 VÀ reciprocal ratio > 0.7` đủ tốt để chống collusion ở pilot 100 user
  - *Test:* Trong 3 tháng đầu, đếm false positive rate (số cặp bị flag nhưng admin dismiss). Nếu > 30% → cần thêm signals.

## MVP Scope

### In scope (Ship trong 1 release, ước tính 3-4 tuần)

**1. Teacher Rating System (mới):**
- Entity `TeacherRating { teacherId, averageRating, totalReviews, tier, validReviewCount, excludedReviewCount, updatedAt }`
- Tier tự động tính từ `averageRating` + `validReviewCount` (chỉ tính review verified):
  - `NEWBIE`: < 5 valid reviews → tierPlatformFeePercent = 20
  - `BRONZE`: 5-19 reviews, rating ≥ 3.0 → 15
  - `SILVER`: 20-99 reviews, rating ≥ 3.5 → 10
  - `GOLD`: 100+ reviews, rating ≥ 4.0 → 5
  - `ELITE`: 500+ reviews, rating ≥ 4.5 → 3
- Endpoint `POST /api/v1/reviews`:
  - Request: `{ contentId, rating (1-5), comment }`
  - Validate: student đã mua content (`UserInventory` check), 1 review per (student, content), transaction không thuộc `CollusionFlag.status = CONFIRMED/MALICIOUS`
  - Response: review info + teacher new average rating
- Review status enum: `VALID`, `EXCLUDED_SUSPICIOUS`, `EXCLUDED_WASH`, `DELETED_BY_ADMIN`
- Background job `TeacherTierRecomputeJob`: chạy mỗi khi review mới được tạo, hoặc daily backup

**2. Dynamic Spread Calculation (refactor `WalletService.cashOut`):**
- Bỏ `KEY_WITHDRAWAL_VND_PER_COIN` cố định. Thay bằng:
  - `TIER_PLATFORM_FEE_PERCENT` (JSON map: `{"NEWBIE": 20, "BRONZE": 15, ...}`)
  - Khi teacher rút, lookup tier → lookup `tierPlatformFeePercent` → tính `effectiveVndPerCoin = topupRate * (100 - tierPlatformFeePercent) / 100`
- Ví dụ với `topupRate = 100`:
  - NEWBIE: 100 × 80/100 = 80 VNĐ/coin
  - GOLD: 100 × 95/100 = 95 VNĐ/coin
  - ELITE: 100 × 97/100 = 97 VNĐ/coin
- `KEY_WITHDRAWAL_VND_PER_COIN` cũ giữ làm **fallback** nếu tier lookup fail (migration safety).

**3. Escrow 7 ngày (1% fee riêng biệt):**
- Entity `EscrowTransaction { id, buyerId, sellerId, contentId, grossAmount, status, createdAt, releaseAt, refundedAt, platformFee, teacherNet }`
- Status: `HELD` (đang giữ) / `RELEASED` (đã chuyển teacher) / `REFUNDED` (đã hoàn student)
- Khi student mua content (`OrderService.createOrder`):
  - Tạo `EscrowTransaction` với `status = HELD`, `releaseAt = now + 7 days`
  - Wallet student: balance giảm
  - Wallet teacher: **KHÔNG** tăng (coin đang bị hold ở escrow)
- Background job `EscrowReleaseJob` (hourly):
  - Query `EscrowTransaction` where `status = HELD` and `releaseAt <= now`
  - Tính `platformFee = grossAmount * ESCROW_ADMIN_FEE_PERCENT / 100`
  - Tính `teacherNet = grossAmount - platformFee`
  - Update `status = RELEASED`
  - Wallet teacher: balance tăng `teacherNet`
  - Publish ledger event `ESCROW_RELEASED` + `PLATFORM_FEE_COLLECTED`
- Endpoint `POST /api/v1/escrow/{id}/refund`:
  - Request: empty (student chỉ cần chọn escrow cần refund)
  - Validate: `status = HELD`, `currentUserId = buyerId`, content chưa consume (cần check `UserInventory.consumedAt == null` hoặc chưa có progress)
  - Action: status → `REFUNDED`, hoàn `grossAmount` về wallet student, publish ledger event `ESCROW_REFUNDED`
  - **Không** tính escrow fee cho refund (vì teacher chưa nhận gì)

**4. Anti-collusion 3-tier policy (threshold cải tiến 2 signals):**
- Entity `CollusionFlag { id, pairKey (buyerId-sellerId), transactionCount, totalAmount, reciprocalRatio, flaggedAt, status, reviewedAt, reviewerId, action, reason }`
- Entity `AdminActionLog { id, adminId, action, targetType, targetId, reason, timestamp }`
- Entity `WalletHold { walletId, holdType (WASH_HOLD/FROZEN), reason, createdAt, expiresAt }`
- Status enum: `SUSPICIOUS` (auto-flag) / `CONFIRMED` (admin confirmed wash) / `MALICIOUS` (admin confirmed abuse) / `DISMISSED` (false positive)
- Background job `CollusionDetectionJob` (daily):
  - Query transactions 30 ngày gần nhất, group by `(buyerId, sellerId)`
  - Tính `transactionCount`, `totalAmount`, `reciprocalRatio` (= transactions 2 chiều / tổng)
  - Flag nếu `transactionCount > 5` **AND** `reciprocalRatio > 0.7`
  - Insert `CollusionFlag` với `status = SUSPICIOUS`
  - Update review của các transaction này thành `EXCLUDED_SUSPICIOUS`
- Admin endpoints:
  - `GET /api/v1/admin/collusion-flags?status=SUSPICIOUS` — list flagged pairs
  - `POST /api/v1/admin/collusion-flags/{id}/action` — body: `{action: "MARK_CONFIRMED|MARK_MALICIOUS|DISMISS", reason: "..."}`
- Admin workflow:
  - Dashboard "Wash Review" liệt kê pairs theo `transactionCount` desc
  - Click pair → xem transaction timeline (mua lúc nào, rút lúc nào, content nào)
  - Chọn action → update `CollusionFlag.status` + create `WalletHold` (nếu applicable) + log `AdminActionLog`
- **3 mức xử lý chi tiết:**

| Mức | Trigger | Hành động hệ thống | UX |
|---|---|---|---|
| **SUSPICIOUS** | Auto-flag qua graph | • Ghi log<br>• Cho phép mua/bán/rút bình thường<br>• Review của các transaction này → `EXCLUDED_SUSPICIOUS` (không tính vào tier)<br>• Hiển thị ribbon warning trong admin dashboard | User không biết |
| **CONFIRMED** | Admin review → `MARK_CONFIRMED` | • Tạo `WalletHold(teacherWallet, WASH_HOLD, 30 days)` — teacher không rút được, vẫn mua được nếu đủ coin<br>• Review của các transaction này → `EXCLUDED_WASH`<br>• Warning email cho cả 2 bên<br>• Nếu teacher tái phạm → escalate lên MALICIOUS | Teacher thấy banner cảnh báo + student thấy notification |
| **MALICIOUS** | Admin review thấy cố ý / lặp lại / refund-to-self | • Tạo `WalletHold(cả 2 ví, FROZEN, indefinite)`<br>• Hoàn coin cho giao dịch legit còn lại (escrow = HELD, content chưa consume) → auto refund<br>• Blacklist cả 2 user ID + device fingerprint<br>• Lưu evidence log | Cả 2 login thấy màn hình "Tài khoản bị đình chỉ do vi phạm điều khoản" |

**5. Configuration changes (extend `SystemConfig`):**
- Thêm keys:
  - `ESCROW_HOLD_DAYS = 7`
  - `ESCROW_ADMIN_FEE_PERCENT = 1`
  - `COLLUSION_TX_THRESHOLD = 5`
  - `COLLUSION_RECIPROCAL_RATIO_THRESHOLD = 0.7`
  - `COLLUSION_LOOKBACK_DAYS = 30`
  - `WASH_HOLD_DAYS = 30`
  - `TIER_PLATFORM_FEE_PERCENT = {"NEWBIE":20,"BRONZE":15,"SILVER":10,"GOLD":5,"ELITE":3}` (JSON)
  - `TIER_RATING_THRESHOLDS = {"NEWBIE":{"minReviews":0,"minRating":0},...}` (JSON)
- `WITHDRAWAL_VND_PER_COIN` cũ giữ làm fallback

**6. UI changes (web-app):**
- **Student marketplace:** Hiển thị tier badge cạnh tên teacher (icon + text). Click → tooltip giải thích tier.
- **Teacher dashboard:** Hiển thị tier hiện tại, progress bar lên tier tiếp theo (cần bao nhiêu reviews, rating bao nhiêu), escrow pending list (số coin đang HELD, release date), warning banner nếu `WalletHold` đang active.
- **Admin dashboard:** Tab "Wash Review" — list `CollusionFlag` theo severity, click để xem timeline và action.

**7. Ledger events mới (extend `TransactionType`):**
- `ESCROW_HELD` (student wallet giảm, không ai tăng)
- `ESCROW_RELEASED` (teacher wallet tăng, grossAmount - platformFee)
- `ESCROW_REFUNDED` (student wallet tăng, grossAmount)
- `PLATFORM_FEE_COLLECTED` (admin revenue ledger, escrow fee 1%)
- `WALLET_HELD` (audit log, không coin movement)
- `WALLET_FROZEN` (audit log)
- `WALLET_UNFROZEN` (audit log)

### Out of scope cho MVP (sẽ làm sau)

- **Risk score đầy đủ cho anti-collusion** (device fingerprint, IP, account age, learning activity) — threshold 2 signals đủ cho 100 user
- **Multi-tier UI filter cho student** (filter by tier) — sort by rating tạm đủ
- **Appeal system cho teacher bị flag** — admin review thủ công là đủ
- **Auto-refund khi content chưa consume sau 7 ngày** — student phải request thủ công
- **Tax reporting cho teacher** — bỏ qua (project cá nhân)
- **Two-token model** — quá sớm
- **Subscription thay coin** — không phù hợp product
- **Tách service boundary** (escrow sang marketplace-service, rating sang profile-service) — MVP giữ trong wallet-service, refactor khi scale > 1000 user

## Not Doing (and Why)

- **Không dùng stablecoin / crypto** — coin nội bộ đơn giản hơn nhiều. *Why: complexity không cần thiết.*
- **Không xử lý tax compliance cho teacher** — project cá nhân, không thương mại hóa. *Why: scope.*
- **Không tích hợp legal VN compliance** (đăng ký trung gian thanh toán, KYC). *Why: scope.*
- **Không thay đổi logic reward hiện tại** (500 coin initial, cooldown 3 ngày flashcard, 80% quiz) — economics cốt lõi đang hoạt động. *Why: don't fix what isn't broken — admin config-driven nên có thể tinh chỉnh sau.*
- **Không thêm subscription model** — mâu thuẫn với tinh thần "mọi người đều chơi được". *Why: product philosophy.*
- **Không tự động slash teacher dựa trên report** — cần moderation system với human-in-loop. *Why: false positive risk; admin < 5 người nên manual review OK.*
- **Không làm dynamic spread cho topup phía student** — student trả tiền thật, sẽ không chấp nhận biến động. *Why: customer trust.*
- **Không public admin revenue** — teacher sẽ phản đối nếu biết admin lời bao nhiêu. *Why: transparency có thể gây hại.*
- **Không xây 2-token model (Coin + Gem)** — quá sớm cho pilot. *Why: complexity.*
- **Không ship 3 phase riêng biệt** (đề xuất của GPT) — ưu tiên 1 release coherent. *Why: tránh 3 lần refactor, project cá nhân 1 dev.*
- **Không auto-apply escrow cho transaction cũ** — chỉ apply cho transaction mới. *Why: tránh retroactive behavior phá data.*
- **Không cho phép teacher set custom spread** — spread hoàn toàn do admin config. *Why: tránh teacher tự set fee = 0 để câu student.*

## Implementation Notes (tham chiếu codebase)

### Files cần edit/create

| Layer | Files | Vai trò |
|---|---|---|
| **Config** | `services/wallet-service/.../entity/SystemConfig.java`, `service/SystemConfigService.java` | Thêm 8 keys mới (xem trên) |
| **Wallet service** | `service/WalletService.java` (`cashOut` method) | Lookup tier trước khi tính rate. `topUp`, `reward`, `spend` giữ nguyên. |
| **Marketplace service** | `service/OrderService.java` | Tạo `EscrowTransaction` thay vì credit teacher wallet trực tiếp. |
| **New entities** | `entity/TeacherRating.java`, `entity/EscrowTransaction.java`, `entity/CollusionFlag.java`, `entity/AdminActionLog.java`, `entity/WalletHold.java`, `entity/Review.java` | 6 entity mới |
| **New enums** | `enums/TeacherTier.java`, `enums/ReviewStatus.java`, `enums/CollusionStatus.java`, `enums/WalletHoldType.java`, `enums/TransactionType` (extend với 7 events mới) | 4 enum mới + 1 extend |
| **Background jobs** | `job/EscrowReleaseJob.java` (hourly), `job/CollusionDetectionJob.java` (daily), `job/TeacherTierRecomputeJob.java` (on-review-event) | 3 scheduled job mới |
| **New endpoints** | `POST /api/v1/reviews`, `POST /api/v1/escrow/{id}/refund`, `GET /api/v1/admin/collusion-flags`, `POST /api/v1/admin/collusion-flags/{id}/action`, `GET /api/v1/teacher/{id}/tier` (public) | 5 endpoint mới |
| **New RabbitMQ events** | `EscrowReleasedEvent`, `EscrowRefundedEvent`, `CollusionFlaggedEvent`, `WalletHeldEvent` | 4 event mới để cross-service notify |
| **Frontend** | `src/web-app/src/pages/teacher-dashboard/` (tier badge + escrow pending + warning)<br>`src/web-app/src/pages/admin/` (wash review dashboard)<br>`src/web-app/src/pages/marketplace/` (teacher tier badge) | 3 page update |

### Migration strategy (không break existing)

- Khi ship feature, **default tier cho existing teachers** dựa trên rating hiện tại (nếu chưa có → `NEWBIE`).
- `WITHDRAWAL_VND_PER_COIN` cũ giữ làm fallback nếu tier lookup fail.
- `EscrowTransaction` chỉ apply cho **giao dịch mới** sau ship date — không retroactive.
- Admin thêm 8 config keys với default an toàn → tự seed qua `SystemConfigService.seedDefaults()`.

### Testing strategy

- **Unit test:**
  - Tier mapping (5 tier × boundary values)
  - Escrow fee calculation (grossAmount × 1%)
  - Collusion graph detector (threshold 2 signals: count > 5 AND reciprocalRatio > 0.7)
  - Refund eligibility (escrow = HELD, content chưa consume)
- **Integration test:**
  - End-to-end: student mua → escrow HELD 7 ngày → release → teacher wallet tăng `grossAmount - 1%`
  - Teacher tier recompute: review mới → tier tự động update
  - Wash flag: 5 transactions qua lại → auto-flag SUSPICIOUS
- **Manual test (4 scenarios):**
  1. **Wash detected:** Teacher tạo 5 account, tự mua lẫn nhau → expect flag sau 5 transactions, admin review → `MARK_CONFIRMED` → teacher wallet bị hold 30 ngày.
  2. **False positive (legit):** Teacher LEGIT bán 100 lần cho 100 student khác nhau → expect KHÔNG flag (reciprocal ratio = 0).
  3. **Tier promotion:** Teacher có 99 reviews 4.5★ → SILVER. Review thứ 100 cũng 5★ → GOLD ngay lập tức (job chạy).
  4. **Wallet hold enforcement:** Teacher rút coin khi `WalletHold.WASH_HOLD` đang active → expect fail với message "Ví bị tạm khóa do có dấu hiệu bất thường".

### Effort breakdown (rough estimate, 1 dev)

| Component | Effort |
|---|---|
| Teacher Rating + Tier system | 1 tuần |
| Dynamic spread (refactor cashOut) | 2-3 ngày |
| Escrow 7 ngày (entity + job + refund endpoint) | 1 tuần |
| Anti-collusion 3-tier (graph + admin dashboard + wallet hold) | 1 tuần |
| UI (teacher dashboard + admin dashboard + tier badge) | 1 tuần |
| Testing + migration | 3-4 ngày |
| **Total** | **~3.5-4 tuần** |

## Open Questions

Tất cả đã chốt. Không còn blocker.

## GPT critique — đã giải quyết

Tôi đã đọc `gpt-debate-teacher-tiered-idea.md`. Dưới đây là cách xử lý từng critique:

| # | Critique của GPT | Phản hồi của tôi |
|---|---|---|
| 1 | MVP 2-3 tuần quá rộng, nên chia 3 phase | **Từ chối** — bạn chọn giữ 1 release. Effort estimate đã bump lên 3-4 tuần. Đánh đổi: coherence vs delivery risk. |
| 2 | Spread nên đặt ở escrow release, không phải withdrawal rate | **Tích hợp một phần** — Phase MVP này giữ spread ở withdrawal time vì escrow chưa có UI phụ thuộc. Khi escrow ship, spread logic vẫn ở withdrawal (không gộp vào release) vì 2 concept khác nhau: tier spread = platform commission, escrow fee = transaction fee. |
| 3 | Escrow fee 1% và tier spread bị chồng khái niệt | **Tích hợp** — đã tách rõ: `tierPlatformFeePercent` (NEWBIE 20% → ELITE 3%) là commission, `escrowAdminFeePercent = 1%` là transaction fee riêng biệt. Công thức cuối: `teacherNet = grossAmount × (100 - tierPlatformFeePercent) / 100 - grossAmount × escrowAdminFeePercent / 100` |
| 4 | Rating system dễ abuse nếu không có "verified purchase" gate | **Tích hợp** — review chỉ được tạo nếu student đã mua content (check `UserInventory`), 1 review per (student, content), review từ transaction `SUSPICIOUS`/`CONFIRMED` wash → `EXCLUDED_*` (không tính vào tier) |
| 5 | Threshold `count > 5` đơn giản quá, cần risk score | **Tích hợp một phần** — nâng cấp thành 2 signals: `count > 5` AND `reciprocalRatio > 0.7`. Risk score đầy đủ (device/IP/learning activity) để sau khi có > 1000 user |
| 6 | "Hoàn coin cho giao dịch hợp lệ còn lại" trong Malicious Abuse mơ hồ | **Tích hợp** — đã định nghĩa rõ: refund eligible nếu escrow = HELD, content chưa consume, purchase không thuộc confirmed wash pair. KHÔNG refund nếu content đã consume, escrow đã RELEASED, admin đánh dấu legit. |
| 7 | Wallet-service thành "god service", cần tách boundary | **Từ chối (cho MVP)** — giữ trong wallet-service để ship nhanh. Refactor boundary khi scale > 1000 user. Trade-off: clean architecture vs shipping speed. |
| 8 | "Bỏ escrow fee 1%" — gộp vào tier spread | **Từ chối** — escrow fee là transaction fee (như Stripe), tier spread là platform commission. Tách riêng để admin có thể điều chỉnh độc lập. |
| 9 | "Admin chưa có role, đây là blocker" | **Từ chối** — codebase hiện tại đã có `AdminConfigController` và `AdminProductController`, admin role đã tồn tại. Không phải blocker. |

### Điểm tôi đồng ý hoàn toàn với GPT (và đã tích hợp)

- Verified-purchase-only review + 1 review per content
- Review status enum rõ ràng (`VALID` / `EXCLUDED_SUSPICIOUS` / `EXCLUDED_WASH` / `DELETED_BY_ADMIN`)
- Threshold cải tiến 2 signals (count + reciprocal ratio)
- Refund policy rõ ràng cho Malicious Abuse
- Ledger events mới (`ESCROW_HELD`, `ESCROW_RELEASED`, `ESCROW_REFUNDED`, `PLATFORM_FEE_COLLECTED`, `WALLET_HELD`, `WALLET_FROZEN`, `WALLET_UNFROZEN`)
- Effort estimate bumped từ 2-3 tuần → 3-4 tuần

### Điểm tôi không đồng ý với GPT (và lý do)

- **3-phase release:** Bạn chọn giữ 1 release, tôi tôn trọng. Trade-off rõ: coherence > delivery safety.
- **Tách service boundary:** Over-engineer cho pilot 100 user.
- **Gộp escrow fee vào tier spread:** Mất flexibility, 2 concept khác nhau.
