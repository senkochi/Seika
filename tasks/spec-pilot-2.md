# Spec: Refactor pilot 2 — teacher + admin pages (component hóa frontend)

> Pilot tiếp theo sau pilot 1 (`identity-service` + `DashboardHome`). Pilot 1 đã chống minh pattern "tách leaf trước, parent sau" hoạt động; pilot 2 mở rộng sang 6 page lớn trong nhóm teacher + admin.

---

## 1. Objective

**Xây dựng / sửa đổi gì?** Component hóa 6 page React trong `src/web-app/src/pages/teacher/` và `src/web-app/src/pages/admin/` có kích thước ≥ 415 dòng. Mục tiêu: mỗi page giảm xuống dưới target line count (xem §7), với parent làm orchestration thuần (Redux subscription + state/effects + composition).

**Vì sao?**
- Pilot 1 (`DashboardHome.tsx` 348 → 116 dòng) đã verify pattern "leaf trước, parent sau" chạy tốt. Áp dụng trên diện rộng để chuẩn hóa.
- 6 page này vi phạm rõ tiêu chí spec 1 ("block > 60 dòng hoặc có semantic boundary"): chứa form lớn (QuizSetForm 380 dòng), card list lặp lại (FlashcardSetCard/QuizSetCard), state machine phức tạp (AdminUsers có 3 modal + table state).
- Tạo component mới ở `src/components/teacher/<feature>/` và `src/components/admin/<feature>/` để sau này reuse chéo giữa các page (vd `StatusBadge` dùng cho cả admin và teacher).

**Success looks like**:
- Mỗi page nằm trong target line count (bảng §7).
- Mỗi page parent chỉ giữ: imports + hooks/state/effects + Redux subscriptions + composition glue.
- Tất cả component mới có props interface rõ ràng (typed, không `any`).
- `npm run typecheck` + `npm run lint` pass toàn bộ.
- Không có `console.error` mới (giữ nguyên các `console.error` đã có — follow-up F1).

---

## 2. Commands

```bash
cd src/web-app
npm install --legacy-peer-deps          # bắt buộc theo INSTALLATION_GUIDE.md (chỉ khi thiếu node_modules)
npm run typecheck                        # tsc -b
npm run lint                             # ESLint

# Per-page line count verify
wc -l src/web-app/src/pages/teacher/ContentManager.tsx
wc -l src/web-app/src/pages/teacher/TeacherStatistics.tsx
wc -l src/web-app/src/pages/teacher/TeacherWallet.tsx
wc -l src/web-app/src/pages/teacher/TeacherProfile.tsx
wc -l src/web-app/src/pages/teacher/TeacherDashboardHome.tsx
wc -l src/web-app/src/pages/admin/AdminUsers.tsx
```

---

## 3. Project Structure

### File mới sẽ tạo

```
src/web-app/src/components/teacher/dashboard/
├── DashboardLoadingState.tsx
├── DashboardFailedState.tsx
├── DashboardWelcomeHeader.tsx
├── TopStatsGrid.tsx
├── RevenueChartCard.tsx
├── LevelProgressCard.tsx          # có thể promote từ pilot 1 nếu cùng pattern (KHÔNG bắt buộc)
└── RecentIncomesList.tsx

src/web-app/src/components/teacher/profile/
├── ProfileLoadingScreen.tsx
├── ProfilePageHeader.tsx
├── TeacherAvatarCard.tsx
├── TeacherProfileForm.tsx         # ~120 dòng
├── TeacherAccomplishmentsCard.tsx
├── StatTile.tsx
└── useTeacherStatCards.ts         # custom hook

src/web-app/src/components/teacher/wallet/
├── WalletHeader.tsx
├── WalletQuickStats.tsx
├── TransactionHistory.tsx
├── TransactionItem.tsx
├── CashOutForm.tsx                # ~90 dòng
└── CashOutConfirmDetails.tsx

src/web-app/src/components/teacher/statistics/
├── StatisticsHeader.tsx
├── KpiGrid.tsx
├── PassRateStrip.tsx
├── RevenueLineChartCard.tsx
├── TopProductsPanel.tsx
└── StudentsPurchasedPanel.tsx

src/web-app/src/components/teacher/content/
├── ConfirmDialog.tsx
├── ContentHeader.tsx
├── ContentTabs.tsx
├── FlashcardSetCard.tsx
├── QuizSetCard.tsx
├── FlashcardSetForm.tsx           # ~146 dòng
├── QuizSetForm.tsx                # ~380 dòng (largest)
├── StatusBadge.tsx
└── (4 row components inside QuizSetForm nếu cần:
   McqOptionRow, MatchingPairRow, ReorderItemRow, BlankAnswerRow)

src/web-app/src/components/admin/users/
├── UsersHeader.tsx
├── UsersTable.tsx
├── UsersTableRow.tsx
├── UserStatusPill.tsx
├── RoleBadge.tsx
├── ChangeRoleModal.tsx            # đã có local trong AdminUsers.tsx
└── ResetPasswordModal.tsx         # đã có local trong AdminUsers.tsx

src/web-app/src/utils/
└── format.ts                       # formatCurrency, formatNumber, numberFormatter
```

### File sửa

```
src/web-app/src/pages/teacher/TeacherDashboardHome.tsx    # 415 → ≤170
src/web-app/src/pages/teacher/TeacherProfile.tsx         # 436 → ≤80
src/web-app/src/pages/teacher/TeacherWallet.tsx          # 445 → ≤150
src/web-app/src/pages/teacher/TeacherStatistics.tsx      # 584 → ≤100
src/web-app/src/pages/teacher/ContentManager.tsx         # 1316 → ≤250
src/web-app/src/pages/admin/AdminUsers.tsx               # 462 → ≤130
```

---

## 4. Code Style

### Convention (giống pilot 1)

- Component file PascalCase, `export default function ComponentName`.
- Props interface đặt ngay đầu file component, dùng `interface` (không `type`) cho object props.
- Icon import: `import { Icon1, Icon2 } from "lucide-react"` — chỉ import icon thực sự dùng.
- Custom hook: prefix `use`, đặt trong file riêng cùng folder feature.
- Constants (vd `XP_PER_LEVEL`, `MIN_PRICE`): khai báo ngoài component ở đầu file.
- Helper util: gom vào `src/utils/format.ts` nếu dùng ≥2 nơi.

### Ví dụ component cha (TeacherDashboardHome.tsx sau refactor)

```tsx
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchCurrentUserProfile } from "../../store/userProfileSlice";
import { fetchRevenue } from "../../store/statisticsSlice";
import { walletService, userProfilesService } from "../../api";
import type { TransactionResponse, TeacherProfileResponse, RevenuePoint } from "../../api";

import DashboardWelcomeHeader from "../../components/teacher/dashboard/DashboardWelcomeHeader";
import TopStatsGrid from "../../components/teacher/dashboard/TopStatsGrid";
import RevenueChartCard from "../../components/teacher/dashboard/RevenueChartCard";
import LevelProgressCard from "../../components/teacher/dashboard/LevelProgressCard";
import RecentIncomesList from "../../components/teacher/dashboard/RecentIncomesList";
import DashboardLoadingState from "../../components/teacher/dashboard/DashboardLoadingState";
import DashboardFailedState from "../../components/teacher/dashboard/DashboardFailedState";

const XP_PER_LEVEL = 1000;

function TeacherDashboardHome() {
  const dispatch = useAppDispatch();
  // ... hooks, state, effects ...

  if (status === "loading") return <DashboardLoadingState />;
  if (status === "failed") return <DashboardFailedState error={error} onRetry={...} />;

  return (
    <div className="p-8">
      <DashboardWelcomeHeader displayName={...} onRefresh={...} onCreateMaterial={...} />
      <TopStatsGrid stats={stats} />
      <RevenueChartCard chartData={chartData} period={period} onPeriodChange={setPeriod} />
      <LevelProgressCard currentLevelXP={...} nextLevelXP={...} level={level} />
      <RecentIncomesList events={recentEvents} onGoToWallet={...} />
    </div>
  );
}
```

---

## 5. Testing Strategy

- **Không viết test mới** — chỉ chạy typecheck + lint.
- Verify visual qua screenshot thủ công nếu cần (out of scope — không có Playwright setup).
- Coverage: không áp dụng.

---

## 6. Boundaries

### Always do (không cần hỏi)
- Tách component mới khi đạt tiêu chí spec 1 (> 60 dòng, semantic boundary, ≥2 nơi).
- Parent giữ: imports, hooks/state/effects, Redux, composition. KHÔNG giữ JSX block > 30 dòng inline.
- Component con: thuần UI hoặc form state-owned. Không gọi Redux nếu chỉ nhận data qua props.
- Đặt component mới trong `src/components/teacher/<feature>/` hoặc `src/components/admin/<feature>/`.
- Helper dùng chung (`formatCurrency`, `formatNumber`, `numberFormatter`) gom vào `src/utils/format.ts`.
- Đặt tên file theo PascalCase, custom hook theo `use*` prefix.

### Ask first (hỏi trước khi làm)
- Thay đổi business logic, API call, Redux slice (KHÔNG làm trong pilot 2).
- Refactor 5 page còn lại (`TeacherDashboard.tsx`, `AdminDashboardHome.tsx`, `AdminRevenue.tsx`, `AdminContentModeration.tsx`, `AdminSystemConfig.tsx`) — nằm ngoài scope, sẽ làm ở pilot sau.
- Tách `LevelProgressCard` của pilot 1 sang `components/teacher/` để share với teacher dashboard — có thể duplicate trước, không promote cross-tree trong pilot này.
- Sửa `console.error` thành toast — đó là follow-up F1, không trong pilot 2.

### Never do
- Không commit secret, không sửa `.env`.
- Không sửa `node_modules/`, `dist/`.
- Không sửa Redux slice, API service, backend.
- Không thêm dependency mới.
- Không sửa các page ≤ 413 dòng (5 file này nằm ngoài pilot 2).
- Không xóa import cũ trừ khi không dùng nữa.

---

## 7. Success Criteria (specific, testable)

| # | Criterion | Target line count (sau) | Verify |
|---|---|---|---|
| 1 | `TeacherDashboardHome.tsx` ≤ 170 dòng | 170 | `wc -l` |
| 2 | `TeacherProfile.tsx` ≤ 80 dòng | 80 | `wc -l` |
| 3 | `TeacherWallet.tsx` ≤ 150 dòng | 150 | `wc -l` |
| 4 | `TeacherStatistics.tsx` ≤ 100 dòng | 100 | `wc -l` |
| 5 | `ContentManager.tsx` ≤ 250 dòng | 250 | `wc -l` |
| 6 | `AdminUsers.tsx` ≤ 130 dòng | 130 | `wc -l` |
| 7 | `npm run typecheck` pass | — | exit 0 |
| 8 | `npm run lint` pass | — | exit 0 |
| 9 | Tất cả component con có typed props (không `any`) | — | grep `props:` hoặc destructure |
| 10 | Helper `formatCurrency/formatNumber` nằm trong `src/utils/format.ts` (nếu dùng ≥2 nơi) | — | `find` |
| 11 | Không có `console.log/console.error` MỚI trong các file đã sửa | — | grep `console\.(log\|error)` so với baseline |

---

## 8. Order of Implementation (sequential)

1. **TeacherDashboardHome.tsx** (415 → 170, 7-8 leaf) — dễ nhất, warm-up.
2. **TeacherProfile.tsx** (436 → 80, 7 leaf) — form lớn nhưng domain rõ.
3. **AdminUsers.tsx** (462 → 130, 6-7 leaf) — có 2 modal sẵn, chỉ cần move ra file riêng.
4. **TeacherWallet.tsx** (445 → 150, 6 leaf) — form cash-out lớn.
5. **TeacherStatistics.tsx** (584 → 100, 6 leaf) — đã có 4 component sẵn, chỉ move + bổ sung.
6. **ContentManager.tsx** (1316 → 250, 6-10 leaf) — khó nhất, làm cuối.

Mỗi page = 1 task. Sau mỗi page, chạy typecheck + lint + wc -l trước khi sang page tiếp.

---

## 9. Verification

- [x] Spec covers 6 core areas.
- [ ] Human reviews & approves spec.
- [ ] Success criteria are specific & testable.
- [ ] Boundaries defined.
- [ ] Spec saved to `tasks/spec-pilot-2.md`.