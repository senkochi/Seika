# Plan: Refactor pilot — identity-service + DashboardHome

Plan này là implementation plan cho spec tại `tasks/spec.md`. Phạm vi: pilot 1 service backend + 1 page frontend. Plan chi tiết cho việc mở rộng sang các service/page khác sẽ được viết sau khi pilot xong.

---

## 1. Approach (high-level)

### Backend (`identity-service`)

Theo hướng **"build the exception layer first, refactor services, then wire handler"** — vì:
- Tạo custom exception trước → không gãy compile dù có nhiều call site.
- Refactor từng service độc lập sau (AuthService trước, AdminService sau) — chia nhỏ để dễ verify.
- Sửa handler cuối cùng (vì handler chỉ có ý nghĩa khi exception đã tồn tại).

Mapping 1-1 từ call site cũ → exception mới:
| Vị trí cũ | Vị trí mới | HTTP semantics |
|---|---|---|
| `IllegalArgumentException("Username already exists")` | `ConflictException` | 409 |
| `IllegalArgumentException("Only STUDENT or TEACHER...")` | `InvalidRequestException` | 400 |
| `IllegalStateException("Role not found: X")` | `ResourceNotFoundException("Role", X)` | 404 |
| `IllegalStateException("Could not create user profile")` (profile Feign fail) | `InvalidRequestException` (giữ status 400) | 400 |
| `IllegalArgumentException("User not found")` (login/me) | `ResourceNotFoundException("User", username)` | 404 |
| `IllegalArgumentException("Invalid refresh token")` | `TokenInvalidException` | 401 |
| `IllegalArgumentException("Refresh token has been revoked")` | `TokenInvalidException` | 401 |
| `IllegalArgumentException("Refresh token has expired")` | `TokenInvalidException` | 401 |
| `IllegalArgumentException("User không tồn tại: X")` ở AdminService | `ResourceNotFoundException("User", X)` | 404 |
| `IllegalArgumentException("Không thể khóa tài khoản ADMIN")` | `InvalidRequestException` | 400 |
| `IllegalStateException("Role không tồn tại: X")` ở AdminService.changeRole | `ResourceNotFoundException("Role", X)` | 404 |

### Frontend (`DashboardHome.tsx`)

Theo hướng **"leaf component first, parent last"** — vì:
- Component con (StatCard, LevelProgressCard…) thuần UI, không biết Redux → test/skim độc lập.
- `DashboardHome.tsx` chỉ làm orchestration: fetch data, derive computed, render danh sách component con.
- Sau khi tách xong mới sửa parent (import + thay JSX → component call).

State ownership:
- `authUsername`, `recentTransactions` state, effects, handlers, arrays (`topStats`, `quickStats`), `displayName` derive → **giữ ở `DashboardHome`** (orchestration).
- Loading state (`Loader2` UI) → `DashboardLoading` (no props).
- Error state (emoji + retry button) → `DashboardError` (props: `error`, `onRetry`).
- Welcome header (h1 + refresh button) → `WelcomeHeader` (props: `displayName`, `onRefresh`).
- 1 stat card có trend → `StatCard` (props: `label`, `value`, `trend?`, `trendUp?`, `icon: LucideIcon`, `color`).
- 1 stat card đơn giản → `QuickStatItem` (props: `label`, `value`, `icon: LucideIcon`, `color`).
- Level progress (circular SVG) → `LevelProgressCard` (props: `level`, `currentXP`, `nextXP`).
- 1 transaction row → `TransactionListItem` (props: `tx: TransactionResponse`).

---

## 2. Implementation Order & Dependencies

### Backend (4 task, strictly sequential)

```
T1. Tạo exception package
    └─ AuthException.java, ResourceNotFoundException.java,
       InvalidRequestException.java, TokenInvalidException.java,
       ConflictException.java
    ↓
T2. Refactor AuthService
    └─ Thay 6 throw sites theo mapping ở §1
    └─ Verify: mvn compile + test pass
    ↓
T3. Refactor AdminService
    └─ Thay 6 throw sites theo mapping ở §1
    └─ Verify: mvn compile + test pass
    ↓
T4. Refactor ApiExceptionHandler
    └─ Thêm @ExceptionHandler(AuthException.class)
    └─ Bỏ printStackTrace(), thay bằng log.error
    └─ Verify: mvn compile + test pass
```

T1 → T2 → T3 → T4 **BẮT BUỘC TUẦN TỰ** vì các task sau import class từ task trước. Không có parallel.

### Frontend (3 task, có thể song song sau T0)

```
T0. Tạo thư mục src/components/student/dashboard/
    ↓
    ├── T5a. Tạo 4 leaf component không phụ thuộc nhau:
    │        WelcomeHeader.tsx
    │        StatCard.tsx
    │        QuickStatItem.tsx
    │        TransactionListItem.tsx
    │
    ├── T5b. Tạo 2 state component (độc lập):
    │        DashboardLoading.tsx
    │        DashboardError.tsx
    │
    ├── T5c. Tạo 1 domain component (largest):
    │        LevelProgressCard.tsx (tách `XP_PER_LEVEL` const vào trong)
    │
    ↓
T6. Refactor DashboardHome.tsx
    └─ Import 7 component trên
    └─ Xóa JSX inline, gọi component
    └─ Giữ toàn bộ state + effects + data arrays ở parent
    └─ Verify: typecheck + lint pass, wc -l ≤ 130
```

T5a, T5b, T5c **CÓ THỂ SONG SONG** (không phụ thuộc nhau). T6 **BẮT BUỘC SAU** tất cả T5.

### Tổng thời gian ước tính
- Backend (T1–T4): 4 task × ~10 min ≈ 40 min.
- Frontend (T0, T5a–c, T6): 1 + 3 + 1 ≈ 5 task, ~50 min.
- Verify cuối (build jar + run web-app): ~10 min.

---

## 3. Risks & Mitigation

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| R1 | MapStruct mapper code (`AuthMapper`) cần update nếu `AuthResponse` đổi shape | Trung bình — pilot **không đổi** AuthResponse, nhưng refactor exception có thể chạm mapper | Pilot không refactor mapper; chỉ đổi exception. Nếu sau pilot muốn refactor mapper, đó là task riêng. |
| R2 | Test hiện có dùng `assertThrows(IllegalArgumentException.class, ...)` → sau khi đổi sang custom exception sẽ fail | Cao — vỡ test | **Verify trước khi đổi**: `grep -r "assertThrows.*IllegalArgumentException" src/services/identity-service/src/test`. Nếu có test dùng IllegalArgumentException → đổi sang `assertThrows(ConflictException.class, ...)` tương ứng; nếu throw ở test trỏ vào constant trong service → update đúng class. |
| R3 | `printStackTrace()` ở ApiExceptionHandler bị gỡ → log format khác, debugging khó hơn một chút | Thấp | Trước khi gỡ, kiểm tra `application.yaml` đã config log chưa. Nếu thiếu, thêm logback file appender sau pilot. |
| R4 | Frontend component con import `lucide-react` riêng lẻ → tree-shake vẫn OK vì `DashboardHome.tsx` đã import sẵn | Thấp | Component con chỉ import icon types nó dùng; dùng `type { LucideIcon }` cho prop type để tránh runtime import. |
| R5 | `DashboardHome.tsx` sau refactor có thể vẫn ~150 dòng nếu stat arrays + effects dài | Trung bình | Nếu >130, có thể tách tiếp: `useRecentTransactions` hook (custom hook trong cùng folder dashboard/) — không bắt buộc ở pilot, sẽ đánh giá sau khi đếm dòng thực. |
| R6 | Class `AuthException` trùng tên với class có sẵn trong codebase khác (gateway, profile-service) | Thấp | Grep `class AuthException` trước khi tạo. Pilot scope chỉ trong package `com.seika.identity_service.exception` — KHÔNG public ra ngoài service. |

---

## 4. Parallel vs Sequential

### Backend: 100% sequential (T1 → T2 → T3 → T4)
- Lý do: mỗi task sau đều import class từ task trước. Tuy nhiên T2 và T3 có thể chạy song song **trong 2 git worktree riêng biệt** nếu muốn tăng tốc (chi phí overhead lớn hơn tiết kiệm khi pilot nhỏ — không khuyến nghị).
- Quyết định: **sequential**, không worktree.

### Frontend: parallel sau T0 (T5a ∥ T5b ∥ T5c → T6)
- 7 component con hoàn toàn không phụ thuộc nhau — có thể viết song song (qua sub-agent) hoặc tuần tự.
- Quyết định: **sequential trong main agent** (vì 7 file nhỏ, không đáng spawn sub-agent).

### Backend ∥ Frontend: CÓ THỂ song song
- Backend và frontend làm trong 2 worktree riêng → pilot nhanh hơn. Tuy nhiên khi pilot nhỏ, overhead không đáng.
- Quyết định: **sequential backend trước → frontend sau**. Lý do: nếu backend test fail ở T2-T3, muốn biết ngay để không lãng phí frontend effort.

---

## 5. Verification Checkpoints (gates between phases)

### Gate 1 — sau T1 (exception package)
- [ ] `find src/services/identity-service/src/main/java/com/seika/identity_service/exception -name "*.java"` liệt kê đủ 5 file.
- [ ] `./mvnw -pl src/services/identity-service -am compile -q -DskipTests` pass.
- [ ] Các class đều `@Slf4j`, `extends RuntimeException` (cho base) hoặc `extends AuthException`.

### Gate 2 — sau T2 (AuthService refactor)
- [ ] `grep -n "throw new Illegal" src/services/identity-service/src/main/java/com/seika/identity_service/service/AuthService.java` → 0 hit.
- [ ] `grep -n "throw new IllegalState" ...AuthService.java` → 0 hit.
- [ ] `./mvnw -pl src/services/identity-service -am test -Dtest=AuthServiceTests` (hoặc tên test gần đúng) pass.

### Gate 3 — sau T3 (AdminService refactor)
- [ ] `grep -n "throw new Illegal" src/services/identity-service/src/main/java/com/seika/identity_service/service/AdminService.java` → 0 hit.
- [ ] `./mvnw -pl src/services/identity-service -am test` pass.

### Gate 4 — sau T4 (handler refactor) — pilot backend hoàn thành
- [ ] `grep -n "printStackTrace\|System.out" src/services/identity-service/src/main/java/com/seika/identity_service/exception/ApiExceptionHandler.java` → 0 hit.
- [ ] `./mvnw -pl src/services/identity-service -am compile -q -DskipTests` pass, không warning.
- [ ] `./mvnw -pl src/services/identity-service -am test` pass (toàn bộ).
- [ ] `grep -n "@ExceptionHandler(AuthException.class)" .../exception/ApiExceptionHandler.java` → 1 hit.
- [ ] **Review cùng user** trước khi sang frontend.

### Gate 5 — sau T6 (frontend pilot hoàn thành)
- [ ] `wc -l src/web-app/src/pages/student/DashboardHome.tsx` → ≤ 130 dòng.
- [ ] `ls src/web-app/src/components/student/dashboard/` → đủ 7 file.
- [ ] `cd src/web-app && npm run typecheck` → exit 0.
- [ ] `cd src/web-app && npm run lint` → exit 0.
- [ ] `grep -n "throw\|catch\|console.log\|console.error" src/web-app/src/pages/student/DashboardHome.tsx` → không có `console.error` (chỉ có `console.error` ở catch `fetchRecentTransactions` — đó là pilot follow-up, giữ hoặc bỏ tùy quyết định dưới).

---

## 6. Files Touched

### Backend (10 file)

| File | Action | Loại |
|---|---|---|
| `exception/AuthException.java` | CREATE | base class |
| `exception/ResourceNotFoundException.java` | CREATE | extends AuthException |
| `exception/InvalidRequestException.java` | CREATE | extends AuthException |
| `exception/TokenInvalidException.java` | CREATE | extends AuthException |
| `exception/ConflictException.java` | CREATE | extends AuthException |
| `exception/ApiExceptionHandler.java` | EDIT | thêm handler, bỏ printStackTrace |
| `service/AuthService.java` | EDIT | thay 6 throw sites |
| `service/AdminService.java` | EDIT | thay 6 throw sites |
| (test files nếu có `assertThrows(IllegalArgumentException...)`) | EDIT | đổi sang custom exception |
| `pom.xml` | KHÔNG ĐỔI | đã có Lombok |

### Frontend (8 file)

| File | Action | Loại |
|---|---|---|
| `components/student/dashboard/WelcomeHeader.tsx` | CREATE | mới |
| `components/student/dashboard/StatCard.tsx` | CREATE | mới |
| `components/student/dashboard/QuickStatItem.tsx` | CREATE | mới |
| `components/student/dashboard/LevelProgressCard.tsx` | CREATE | mới |
| `components/student/dashboard/TransactionListItem.tsx` | CREATE | mới |
| `components/student/dashboard/DashboardLoading.tsx` | CREATE | mới |
| `components/student/dashboard/DashboardError.tsx` | CREATE | mới |
| `pages/student/DashboardHome.tsx` | EDIT | rút từ 348 xuống ≤130 dòng |

---

## 7. Open Decisions (sẽ hỏi khi đến task)

1. **`console.error` ở `fetchRecentTransactions`**: giữ để follow-up error handling, hay bỏ vì chưa hiển thị UI? — Sẽ hỏi khi đến Gate 5.
2. **Test files**: nếu có `assertThrows(IllegalArgumentException.class, ...)`, đổi sang custom exception tương ứng. Cần đọc test file cụ thể trước khi quyết đổi sang class nào. — Sẽ inspect ở Gate 1 nếu có.