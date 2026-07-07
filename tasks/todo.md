# Tasks: Refactor pilot — identity-service + DashboardHome

Source: `tasks/spec.md` + `tasks/plan.md`. Mỗi task có Acceptance + Verify + Files. Verify bằng command thật, không phải mô tả.

> **Quy ước**: `[ ]` = pending, `[x]` = done, `[~]` = blocked / skipped. Sau mỗi task, chạy lệnh verify trước khi tick xong.

---

## Phase A — Backend (identity-service)

### [ ] T1. Tạo 5 exception class trong package `exception/`
- **Acceptance**:
  - `AuthException.java` extends `RuntimeException`, có field `code` (int) + constructor `(int code, String message)`.
  - 4 subclass extends `AuthException` với constructor gọi `super(httpCode, message)`:
    - `ResourceNotFoundException(String resource, String id)` → 404
    - `InvalidRequestException(String message)` → 400
    - `TokenInvalidException(String message)` → 401
    - `ConflictException(String message)` → 409
- **Verify**:
  ```bash
  ls src/services/identity-service/src/main/java/com/seika/identity_service/exception/
  # Expect: 5 file mới + ApiExceptionHandler.java
  ./src/services/identity-service/mvnw -pl src/services/identity-service -am compile -q -DskipTests
  # Expect: BUILD SUCCESS
  ```
- **Files**:
  - `exception/AuthException.java` (CREATE)
  - `exception/ResourceNotFoundException.java` (CREATE)
  - `exception/InvalidRequestException.java` (CREATE)
  - `exception/TokenInvalidException.java` (CREATE)
  - `exception/ConflictException.java` (CREATE)

### [ ] T2. Refactor `AuthService` — thay 6 throw sites
- **Acceptance**:
  - L64 `throw new IllegalArgumentException("Username already exists")` → `ConflictException("Username đã tồn tại: " + request.getUsername())`
  - L79 `throw new IllegalStateException("Could not create user profile")` → `InvalidRequestException("Không thể tạo user profile")`
  - L101 `throw new IllegalArgumentException("User not found")` (login) → `ResourceNotFoundException("User", request.getUsername())`
  - L112, L115, L119 (refresh) → `TokenInvalidException(...)` với message phù hợp
  - L140 `throw new IllegalArgumentException("User not found")` (me) → `ResourceNotFoundException("User", username)`
  - L155 `throw new IllegalArgumentException("Only STUDENT...")` → `InvalidRequestException(...)`
  - L159 `throw new IllegalStateException("Role not found: X")` → `ResourceNotFoundException("Role", normalizedRole)`
- **Verify**:
  ```bash
  grep -n "throw new Illegal" src/services/identity-service/src/main/java/com/seika/identity_service/service/AuthService.java
  # Expect: 0 hit
  grep -n "throw new IllegalState" src/services/identity-service/src/main/java/com/seika/identity_service/service/AuthService.java
  # Expect: 0 hit
  ./src/services/identity-service/mvnw -pl src/services/identity-service -am compile -q -DskipTests
  # Expect: BUILD SUCCESS
  ./src/services/identity-service/mvnw -pl src/services/identity-service -am test
  # Expect: tests pass (nếu fail, xem Note dưới)
  ```
  **Note**: Nếu test fail vì `assertThrows(IllegalArgumentException.class, ...)`, update test cho khớp custom exception.
- **Files**:
  - `service/AuthService.java` (EDIT — 7 throw sites)
  - test files dưới `src/test/java/...` nếu có dùng `assertThrows` (conditional)

### [ ] T3. Refactor `AdminService` — thay 6 throw sites
- **Acceptance**:
  - L54 `throw new IllegalArgumentException("User không tồn tại: " + userId)` (getUser) → `ResourceNotFoundException("User", userId)`
  - L61 (lockUser not found) → `ResourceNotFoundException("User", userId)`
  - L63 `throw new IllegalArgumentException("Không thể khóa tài khoản ADMIN")` → `InvalidRequestException(...)`
  - L74 (unlockUser not found) → `ResourceNotFoundException("User", userId)`
  - L84 (changeRole not found) → `ResourceNotFoundException("User", userId)`
  - L86 `throw new IllegalArgumentException("Không thể đổi role của tài khoản ADMIN")` → `InvalidRequestException(...)`
  - L91 `throw new IllegalStateException("Role không tồn tại: " + newRoleName)` → `ResourceNotFoundException("Role", newRoleName)`
  - L112 (resetPassword not found) → `ResourceNotFoundException("User", userId)`
- **Verify**:
  ```bash
  grep -n "throw new Illegal" src/services/identity-service/src/main/java/com/seika/identity_service/service/AdminService.java
  # Expect: 0 hit
  grep -n "throw new IllegalState" src/services/identity-service/src/main/java/com/seika/identity_service/service/AdminService.java
  # Expect: 0 hit
  ./src/services/identity-service/mvnw -pl src/services/identity-service -am test
  # Expect: tests pass
  ```
- **Files**:
  - `service/AdminService.java` (EDIT — 8 throw sites trong 6 method, note L63/L86/L91 là IllegalArgumentException/State riêng)

### [ ] T4. Refactor `ApiExceptionHandler` — thêm handler cho `AuthException`, gỡ `printStackTrace`
- **Acceptance**:
  - Thêm `@ExceptionHandler(AuthException.class)`: trả HTTP status = `ex.getCode()`, body vẫn `Map<String, Object>` shape cũ (KHÔNG wrap ApiResponse).
  - Bỏ `exception.printStackTrace()` ở handler generic, thay bằng `log.error("Unexpected error", exception)`.
  - Mapping exception → status đã có sẵn trong `AuthException.code` field (đã set lúc tạo subclass).
- **Verify**:
  ```bash
  grep -n "printStackTrace\|System.out" src/services/identity-service/src/main/java/com/seika/identity_service/exception/ApiExceptionHandler.java
  # Expect: 0 hit
  grep -n "@ExceptionHandler(AuthException.class)" src/services/identity-service/src/main/java/com/seika/identity_service/exception/ApiExceptionHandler.java
  # Expect: 1 hit
  ./src/services/identity-service/mvnw -pl src/services/identity-service -am compile -q -DskipTests
  # Expect: BUILD SUCCESS
  ./src/services/identity-service/mvnw -pl src/services/identity-service -am test
  # Expect: tests pass (toàn bộ identity-service)
  ```
- **Files**:
  - `exception/ApiExceptionHandler.java` (EDIT)

### [ ] Gate 4 — Backend pilot hoàn thành
- **Acceptance**: Tất cả verify của T1–T4 pass. Không warning mới.
- **Review**: Pause để user review trước khi sang frontend.

---

## Phase B — Frontend (DashboardHome)

### [ ] T0. Tạo thư mục `src/components/student/dashboard/`
- **Acceptance**: Directory tồn tại, empty.
- **Verify**:
  ```bash
  ls -d src/web-app/src/components/student/dashboard/
  # Expect: directory exists
  ```
- **Files**: tạo thư mục.

### [ ] T5a. Tạo 4 leaf UI component
- **Acceptance**: 4 file mới, mỗi file `export default function ComponentName`, props rõ ràng, JSX thuần (không Redux, không useEffect).
  - `WelcomeHeader.tsx` — props `{ displayName: string; onRefresh: () => void }`
  - `StatCard.tsx` — props `{ label, value, trend?, trendUp?: boolean, icon: LucideIcon, color: string }`
  - `QuickStatItem.tsx` — props `{ label, value, icon: LucideIcon, color: string }`
  - `TransactionListItem.tsx` — props `{ tx: TransactionResponse }` (import type từ `@/api`)
- **Verify**:
  ```bash
  ls src/web-app/src/components/student/dashboard/
  # Expect: 4 file trên
  cd src/web-app && npm run typecheck
  # Expect: exit 0 (file mới compile được vì chưa ai import, có thể warning unused chưa import — không sao, sẽ hết sau T6)
  ```
- **Files**:
  - `src/components/student/dashboard/WelcomeHeader.tsx` (CREATE)
  - `src/components/student/dashboard/StatCard.tsx` (CREATE)
  - `src/components/student/dashboard/QuickStatItem.tsx` (CREATE)
  - `src/components/student/dashboard/TransactionListItem.tsx` (CREATE)

### [ ] T5b. Tạo 2 state component
- **Acceptance**:
  - `DashboardLoading.tsx` — không props, render UI loading với `Loader2` + text.
  - `DashboardError.tsx` — props `{ error: string | null; onRetry: () => void }`.
- **Verify**:
  ```bash
  ls src/web-app/src/components/student/dashboard/{DashboardLoading,DashboardError}.tsx
  # Expect: cả 2 file tồn tại
  ```
- **Files**:
  - `src/components/student/dashboard/DashboardLoading.tsx` (CREATE)
  - `src/components/student/dashboard/DashboardError.tsx` (CREATE)

### [ ] T5c. Tạo `LevelProgressCard`
- **Acceptance**: Component lớn nhất (~60–80 dòng), props `{ level: number; currentXP: number; nextXP: number }`. `XP_PER_LEVEL` const chuyển vào file này (đặt ngoài component).
- **Verify**:
  ```bash
  ls src/web-app/src/components/student/dashboard/LevelProgressCard.tsx
  # Expect: exists
  ```
- **Files**:
  - `src/components/student/dashboard/LevelProgressCard.tsx` (CREATE)

### [ ] T6. Refactor `DashboardHome.tsx` — orchestration only
- **Acceptance**:
  - Import 7 component từ `@/components/student/dashboard`.
  - Xóa toàn bộ JSX block đã tách (giữ thân function cho hooks + state + data arrays).
  - Loading state → `<DashboardLoading />`.
  - Error state → `<DashboardError error={error} onRetry={() => dispatch(fetchCurrentUserProfile())} />`.
  - Welcome header → `<WelcomeHeader displayName={displayName} onRefresh={handleRefresh} />`.
  - `topStats.map(...)` → `{topStats.map((s, i) => <StatCard key={i} {...s} />)}`.
  - Level progress block → `<LevelProgressCard level={level} currentXP={currentLevelXP} nextXP={nextLevelXP} />`.
  - `quickStats.map(...)` → `{quickStats.map((s, i) => <QuickStatItem key={i} {...s} />)}`.
  - Transaction list → map `TransactionListItem`. Header "Recent Transactions" giữ inline hoặc tách `DashboardSectionHeader` (không bắt buộc).
  - State, hooks, handlers giữ nguyên trong parent.
  - **KHÔNG** xóa import cũ trừ khi không dùng nữa (vd `Loader2` không dùng sau khi tách loading → xóa import).
- **Verify**:
  ```bash
  wc -l src/web-app/src/pages/student/DashboardHome.tsx
  # Expect: ≤ 130 dòng
  cd src/web-app && npm run typecheck
  # Expect: exit 0
  cd src/web-app && npm run lint
  # Expect: exit 0 (không có error mới)
  grep -n "console\." src/web-app/src/pages/student/DashboardHome.tsx
  # Expect: 0 hit (nếu còn 1 hit ở fetchRecentTransactions catch — quyết định ở Gate 5)
  grep -n "Loader2\|TrendingUp\|TrendingDown\|Zap\|Target\|Sword\|Swords\|Clock\|RefreshCcw\|ArrowRight" src/web-app/src/pages/student/DashboardHome.tsx
  # Expect: chỉ còn icon còn dùng trực tiếp trong parent (RefreshCcw có thể chuyển WelcomeHeader; Loader2 đã đi với DashboardLoading)
  ```
- **Files**:
  - `src/pages/student/DashboardHome.tsx` (EDIT, rút 348 → ≤130 dòng)

### [ ] Gate 5 — Pilot hoàn thành
- **Acceptance**:
  - Backend: `mvnw -pl src/services/identity-service -am test` pass.
  - Frontend: `npm run typecheck` + `npm run lint` pass.
  - `DashboardHome.tsx` ≤ 130 dòng.
  - 7 component con tồn tại và được import bởi parent.
  - Không có `System.out` / `printStackTrace` / `console.error` trong file đã sửa.
- **Review**: Pause để user review. Sau pilot sẽ viết `tasks/plan-next.md` mở rộng sang các service/page khác.

---

## Follow-up (sau pilot, không trong scope hiện tại)

- F1. Quyết định về `console.error` ở `fetchRecentTransactions` catch — đổi sang toast/UI feedback.
- F2. Thống nhất `ApiResponse<T>` wrapper ở gateway/service layer cho toàn stack (cần đọc `src/web-app/src/api/adapters.ts` trước).
- F3. Refactor `RefreshTokenService` — thêm `@Slf4j` (hiện không có) và log khi revoke/create (ngoài spec này).
- F4. Mở rộng sang các service còn lại (profile, wallet, marketplace, flashcard, quiz, notification, reward).
- F5. Mở rộng sang các page còn lại (>200 dòng: `Marketplace.tsx`, `LearningHub.tsx`, `TeacherDashboard.tsx`, etc.).
