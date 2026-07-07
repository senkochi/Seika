# Spec: Refactor pilot — identity-service + DashboardHome

> Spec này mô tả **một pilot** để thống nhất approach trước khi áp lên toàn bộ codebase. Sau khi pilot xong, plan mới (`tasks/plan.md`) sẽ được viết để mở rộng sang các service/page còn lại.

---

## 1. Objective

**Xây dựng / sửa đổi gì?** Chuẩn hóa 1 service backend (`identity-service`) và 1 page React (`DashboardHome.tsx`) theo `documentation/rules/CODING_STANDARDS.md`, với mức áp dụng **tương đối** (giữ pattern hiện tại, không ép theo mọi chi tiết template).

**Vì sao?** Toàn bộ 8 services Java + ~23 page React lệch nhau về response wrapper, exception handling, package layout, kích thước page. Cần một pilot để:
- Đo effort thực tế khi áp rules.
- Xác nhận pattern wrapper `ApiResponse<T>` + custom exception có tương thích với frontend adapter (`src/api/adapters.ts`) không — frontend hiện unwrap response ở `client.ts`, nên đổi backend sang `ApiResponse<T>` có thể phá flow.
- Xác nhận tiêu chí component hóa React cụ thể và dùng được.

**User / persona**: Dev maintain Seika (chính user hỏi) — đang maintain backend Java + frontend React, mong giữ code chạy ổn trong khi refactor.

**Success looks like**:
- `identity-service` có custom exception base class (`AuthException`) + 4 subclass, `ApiExceptionHandler` map chúng sang HTTP status (giữ response shape `Map<String,Object>` cũ).
- `DashboardHome.tsx` rút từ ~348 dòng xuống ~80–130 dòng bằng cách tách 7 component con.
- `./src/services/identity-service/mvnw -pl src/services/identity-service -am compile -q -DskipTests` pass.
- `npm run typecheck` + `npm run lint` trong `src/web-app` pass.
- **Không thay đổi API contract** — request/response shape flat như cũ, frontend không cần update adapter.

---

## 2. Commands

### Backend (identity-service)

```bash
# Compile-only sanity check
./src/services/identity-service/mvnw -pl src/services/identity-service -am compile -q -DskipTests

# Build jar (không chạy test để giữ inner-loop nhanh)
./src/services/identity-service/mvnw -pl src/services/identity-service -am package -DskipTests

# Run test (verify refactor không vỡ test hiện có)
./src/services/identity-service/mvnw -pl src/services/identity-service -am test
```

### Frontend (web-app)

```bash
cd src/web-app
npm install --legacy-peer-deps      # bắt buộc theo INSTALLATION_GUIDE.md
npm run typecheck                    # tsc -b
npm run lint                         # ESLint
npm run build                        # production build (kiểm tra warning)
```

---

## 3. Project Structure

### Backend — thêm/sửa

> **Quyết định sau khi hỏi user**: KHÔNG wrap `ApiResponse<T>` ở controller (giữ response shape cũ để không phá frontend adapter). Chỉ chuẩn hóa exception layer + handler.

```
src/services/identity-service/src/main/java/com/seika/identity_service/
├── exception/
│   ├── AuthException.java                # MỚI — base, extends RuntimeException
│   ├── ResourceNotFoundException.java    # MỚI — extends AuthException
│   ├── InvalidRequestException.java      # MỚI — extends AuthException
│   ├── TokenInvalidException.java        # MỚI — extends AuthException
│   ├── ConflictException.java            # MỚI — extends AuthException
│   └── ApiExceptionHandler.java          # SỬA — dùng custom exception base, GIỮ TÊN FILE, response shape Map<String,Object> cũ
├── service/
│   ├── AuthService.java                  # SỬA — thay IllegalArgumentException → custom exception
│   └── AdminService.java                 # SỬA — tương tự
└── controller/
    ├── AuthController.java               # KHÔNG ĐỔI (giữ ResponseEntity<T>)
    └── AdminController.java              # KHÔNG ĐỔI
```

Package root `com.seika.identity_service` **giữ nguyên** (không migrate). KHÔNG tạo `shared/ApiResponse.java` ở pilot này.

### Frontend — thêm

```
src/web-app/src/components/student/dashboard/
├── WelcomeHeader.tsx                    # header + refresh button
├── StatCard.tsx                         # card thống kê có trend (topStats)
├── QuickStatItem.tsx                    # card thống kê đơn giản (currentStreak, longestStreak)
├── LevelProgressCard.tsx                # circular progress cho level/XP
├── TransactionListItem.tsx              # 1 dòng transaction
├── DashboardLoading.tsx                 # state loading
└── DashboardError.tsx                   # state error + retry
```

File `src/web-app/src/pages/student/DashboardHome.tsx` — **sửa** thành orchestrator gọi các component con ở trên.

Không tạo file trong `src/components/ui/` cho pilot này — các component trên domain-specific, không generic. Nếu phát hiện reuse thật, có thể promote lên `ui/` ở pilot sau.

---

## 4. Code Style

### Backend — ví dụ một service method sau refactor

```java
// service/AuthService.java — sau refactor
@Transactional
public AuthResponse register(RegisterRequest request) {
    if (userRepository.existsByUsername(request.getUsername())) {
        log.warn("Registration failed: username={} already exists", request.getUsername());
        throw new ConflictException("Username đã tồn tại: " + request.getUsername());
    }
    // ... phần còn lại giữ nguyên
}

// controller/AuthController.java — wrap response
@PostMapping("/register")
public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
    log.info("Registering user: {}", request.getUsername());
    AuthResponse response = authService.register(request);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(ApiResponse.created(response, "Đăng ký thành công"));
}
```

### Frontend — ví dụ một component con

```tsx
// components/student/dashboard/StatCard.tsx
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon: LucideIcon;
  color: string; // tailwind gradient class, vd "from-amber-400 to-yellow-500"
}

export function StatCard({ label, value, trend, trendUp, icon: Icon, color }: StatCardProps) {
  return (
    <div className="relative group bg-[var(--card)] ...">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl ...`}>
          <Icon className="w-6 h-6 text-[var(--foreground)]" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
            trendUp ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
          }`}>
            {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span className="text-sm font-semibold">{trend}</span>
          </div>
        )}
      </div>
      <p className="text-[var(--muted-foreground)] text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold text-[var(--foreground)]">{value}</p>
    </div>
  );
}
```

### Quy ước đặt tên

- **Java**: camelCase cho biến, PascalCase cho class, UPPER_SNAKE_CASE cho hằng. Service method dùng `getById/create/update/delete` (theo standards mục 1.3).
- **React**: Component file PascalCase, function component dùng `export function` hoặc `export const` — chọn một và giữ nhất quán với codebase hiện tại (codebase đang dùng `export default`, ta theo). Props interface đặt ngay trên cùng file component, dùng `interface` (không `type`) cho object props.

---

## 5. Testing Strategy

- **Pilot này không viết test mới** — chỉ chạy test hiện có để verify refactor không vỡ.
- Sau pilot, nếu patterns ổn, có thể thêm unit test cho custom exception class ở service tiếp theo.
- Coverage expectations: **không áp dụng cho pilot** — task này không thêm test, chỉ verify không vỡ.

### Verify checklist sau pilot

- [ ] `./src/services/identity-service/mvnw -pl src/services/identity-service -am compile -q -DskipTests` pass, không warning mới.
- [ ] `./src/services/identity-service/mvnw -pl src/services/identity-service -am test` pass (test hiện có).
- [ ] `cd src/web-app && npm run typecheck` pass.
- [ ] `cd src/web-app && npm run lint` pass.
- [ ] `DashboardHome.tsx` ≤ 130 dòng.
- [ ] Không có `System.out.println` trong các file đã sửa.

---

## 6. Boundaries

### Always do (làm không cần hỏi)
- Compile + chạy test sau mỗi task.
- Giữ package root Java hiện tại của từng service — không migrate wholesale.
- Dùng `@Slf4j` thay cho `System.out` / `printStackTrace`.
- Dùng custom exception thay cho `IllegalArgumentException` / `IllegalStateException` ở tầng service (chỉ áp dụng cho file đang sửa, không đổi call site không liên quan).
- Tách React component khi block trong page đạt tiêu chí (>~60 dòng, hoặc có semantic boundary rõ, hoặc được dùng ≥2 nơi).
- Đặt component mới trong `src/components/<domain>/...` theo convention hiện tại.
- **KHÔNG** wrap `ApiResponse<T>` ở controller pilot này (giữ response shape cũ để không phá frontend adapter).

### Ask first (hỏi trước khi làm)
- Thêm dependency mới vào `pom.xml` (pilot không cần — MapStruct đã có).
- Đổi tên file Java đã được import ở service khác (vd `ApiExceptionHandler` → `GlobalExceptionHandler` — cần check import trước).
- Đổi response shape (field, type) — pilot giữ nguyên `AuthResponse` etc., chỉ wrap thêm `ApiResponse` ngoài cùng.
- Component hóa block chỉ dùng 1 lần, < 40 dòng, không có semantic boundary rõ — bỏ qua.

### Never do
- Không commit secret, không sửa `.env`.
- Không sửa vendor directories (`node_modules/`, `target/`).
- Không xóa test đang pass.
- Không sửa file trong `src/eureka/`, `src/api-gateway/`, `src/config-service/` (pilot này chỉ đụng `src/services/identity-service/` + `src/web-app/`).
- Không sửa Docker / compose / CI.

---

## 7. Success Criteria (specific, testable)

| # | Criterion | Verify |
|---|-----------|--------|
| 1 | `identity-service` có class `shared/ApiResponse.java` giống pattern `quiz-service` | `find` thấy file, có fields `code/message/data/timestamp` |
| 2 | `identity-service` có custom exception base class `AuthException` extends `RuntimeException` với field `code` | `find` thấy file |
| 3 | Tất cả `throw` ở `AuthService` / `AdminService` dùng custom exception, không `IllegalArgumentException`/`IllegalStateException` | grep không còn hit |
| 4 | ~~Controller wrap `ApiResponse<T>`~~ — **BỎ** theo quyết định user. Giữ `ResponseEntity<T>` cũ. | (không áp dụng) |
| 5 | ~~`GlobalExceptionHandler` wrap `ApiResponse<?>`~~ — **BỎ** theo quyết định user. `ApiExceptionHandler` giữ tên file + response shape Map<String,Object> cũ. | (không áp dụng) |
| 6 | `identity-service` compile pass | `mvnw ... compile -q -DskipTests` exit 0 |
| 7 | `identity-service` test pass | `mvnw ... test` exit 0 |
| 8 | `DashboardHome.tsx` ≤ 130 dòng (từ 348) | `wc -l` |
| 9 | `DashboardHome.tsx` không có JSX block > 40 dòng | grep thủ công |
| 10 | 7 component con trong `src/components/student/dashboard/` tồn tại và được import bởi `DashboardHome` | `find` + `grep import` |
| 11 | `npm run typecheck` pass | exit 0 |
| 12 | `npm run lint` pass | exit 0 |
| 13 | Không `System.out.println` trong các file đã sửa | grep |

---

## 8. Open Questions

1. **`ApiExceptionHandler` → `GlobalExceptionHandler`**: ❌ **BỎ** theo quyết định user — giữ tên `ApiExceptionHandler`.

2. **`ApiResponse<T>` wrapper ở controller**: ❌ **BỎ** theo quyết định user — giữ `ResponseEntity<T>` flat, không wrap `ApiResponse<T>` ở pilot. Có thể xét ở service khác sau pilot.

3. **Phạm vi pilot lớn đến đâu?** Spec này mới định nghĩa pilot = identity-service + DashboardHome. Sau pilot sẽ viết `plan.md` mở rộng. **Chưa cam kết** áp cho các service/page còn lại.

---

## 9. Verification (gated phases)

- [x] Spec covers 6 core areas (Objective, Commands, Project Structure, Code Style, Testing Strategy, Boundaries).
- [ ] Human reviews & approves spec.
- [ ] Success criteria are specific & testable (table §7).
- [ ] Boundaries defined (§6).
- [ ] Spec saved to `tasks/spec.md`.