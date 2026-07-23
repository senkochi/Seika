# Tasks: Refactor pilot 2 — teacher + admin pages

Source: `tasks/spec-pilot-2.md` + `tasks/plan-pilot-2.md`. Mỗi task = 1 page. Verify bằng command thật.

> Quy ước: `[ ]` = pending, `[x]` = done. Sequential P1 → P6.

---

### [ ] P1. Refactor `TeacherDashboardHome.tsx` (415 → ≤170)
- **Acceptance**:
  - 7 component mới trong `src/components/teacher/dashboard/`: `DashboardLoadingState`, `DashboardFailedState`, `DashboardWelcomeHeader`, `TopStatsGrid`, `RevenueChartCard`, `LevelProgressCard`, `RecentIncomesList`.
  - Parent chỉ giữ: imports, hooks/state/effects, Redux subscriptions, composition JSX.
  - `XP_PER_LEVEL = 1000` const giữ ở parent hoặc move vào `LevelProgressCard` (chọn 1).
  - `useNavigate` vẫn ở parent (pass `onCreateMaterial` callback xuống `DashboardWelcomeHeader`).
- **Verify**:
  ```bash
  wc -l src/web-app/src/pages/teacher/TeacherDashboardHome.tsx
  # Expect: ≤ 170
  cd src/web-app && npm run typecheck
  # Expect: exit 0
  cd src/web-app && npm run lint
  # Expect: exit 0
  ```
- **Files**:
  - CREATE: `DashboardLoadingState.tsx`, `DashboardFailedState.tsx`, `DashboardWelcomeHeader.tsx`, `TopStatsGrid.tsx`, `RevenueChartCard.tsx`, `LevelProgressCard.tsx`, `RecentIncomesList.tsx`
  - EDIT: `src/pages/teacher/TeacherDashboardHome.tsx`

---

### [ ] P2. Refactor `TeacherProfile.tsx` (436 → ≤80)
- **Acceptance**:
  - 7 file mới trong `src/components/teacher/profile/`: `ProfileLoadingScreen`, `ProfilePageHeader`, `TeacherAvatarCard`, `TeacherProfileForm`, `TeacherAccomplishmentsCard`, `StatTile`, `useTeacherStatCards.ts` (custom hook).
  - `TeacherProfileForm` state-owned: 4 input `useState` chuyển vào trong form component. Parent chỉ giữ `isEditing` + `loadingSubmit` + `onSubmit` callback.
  - Parent giữ: imports, dispatch, profileState selector, 3 useEffect (initial fetch, sync form, fetch stats), `teacherProfile/loadingStats/statsError` state, composition.
- **Verify**:
  ```bash
  wc -l src/web-app/src/pages/teacher/TeacherProfile.tsx
  # Expect: ≤ 80
  cd src/web-app && npm run typecheck  # exit 0
  cd src/web-app && npm run lint       # exit 0
  ```
- **Files**:
  - CREATE: 6 component + 1 hook trong `components/teacher/profile/`
  - EDIT: `src/pages/teacher/TeacherProfile.tsx`

---

### [ ] P3. Refactor `AdminUsers.tsx` (462 → ≤130)
- **Acceptance**:
  - 7 file trong `src/components/admin/users/`: `ChangeRoleModal` (move từ local), `ResetPasswordModal` (move từ local), `UsersHeader`, `UsersTable`, `UsersTableRow`, `UserStatusPill`, `RoleBadge` (move từ helper function).
  - `useMemo` tableBody: GIỮ ở parent, pass xuống `UsersTable` qua prop `tableBody` (chunked prop pattern).
  - Parent giữ: imports, dispatch, users selector, 2 useState (modalRole, modalReset), 1 useEffect (refetch on filter/page/size), 3 async handlers, useMemo tableBody, composition.
- **Verify**:
  ```bash
  wc -l src/web-app/src/pages/admin/AdminUsers.tsx
  # Expect: ≤ 130
  cd src/web-app && npm run typecheck  # exit 0
  cd src/web-app && npm run lint       # exit 0
  ```
- **Files**:
  - CREATE: 7 file trong `components/admin/users/`
  - EDIT: `src/pages/admin/AdminUsers.tsx`

---

### [ ] P4. Refactor `TeacherWallet.tsx` (445 → ≤150)
- **Acceptance**:
  - **Tạo trước** `src/utils/format.ts` với `formatCurrency`, `formatNumber`, `numberFormatter`.
  - 6 component mới trong `src/components/teacher/wallet/`: `WalletHeader`, `WalletQuickStats`, `TransactionHistory`, `TransactionItem`, `CashOutForm` (state-owned), `CashOutConfirmDetails`.
  - Parent giữ: imports, currentStreak selector, `balance/history/loading/withdrawalRate/showConfirmModal/loadingWithdraw` state, `fetchWalletData/handleWithdraw/executeWithdraw` functions, 1 useEffect, composition.
  - Local interface `Transaction` → chuyển vào `TransactionHistory.tsx` (hoặc share qua `api/types.ts` — KHÔNG bắt buộc).
- **Verify**:
  ```bash
  ls src/web-app/src/utils/format.ts
  # Expect: file exists
  wc -l src/web-app/src/pages/teacher/TeacherWallet.tsx
  # Expect: ≤ 150
  cd src/web-app && npm run typecheck  # exit 0
  cd src/web-app && npm run lint       # exit 0
  ```
- **Files**:
  - CREATE: `src/utils/format.ts`, 6 component trong `components/teacher/wallet/`
  - EDIT: `src/pages/teacher/TeacherWallet.tsx`

---

### [ ] P5. Refactor `TeacherStatistics.tsx` (584 → ≤100)
- **Acceptance**:
  - 4 component hiện có (`StatCard`, `LoadingState`, `ErrorState`, `AttemptsModal`) move ra file riêng trong `components/teacher/statistics/`.
  - 6 component mới: `StatisticsHeader`, `KpiGrid`, `PassRateStrip`, `RevenueLineChartCard`, `TopProductsPanel`, `StudentsPurchasedPanel`.
  - Local helpers `numberFormatter/formatCurrency/formatNumber` → **move vào `src/utils/format.ts` đã tạo ở P4** (update import).
  - Parent giữ: imports, dispatch, 11-field selector, 2 useState (`period`, `modalQuizSetId`), 2 useEffect, useMemo totals, `onRetry/openAttempts` callbacks, composition.
- **Verify**:
  ```bash
  wc -l src/web-app/src/pages/teacher/TeacherStatistics.tsx
  # Expect: ≤ 100
  cd src/web-app && npm run typecheck  # exit 0
  cd src/web-app && npm run lint       # exit 0
  ```
- **Files**:
  - CREATE: 10 file trong `components/teacher/statistics/` (4 moved + 6 mới)
  - EDIT: `src/pages/teacher/TeacherStatistics.tsx`, `src/utils/format.ts` (nếu chưa có helpers)

---

### [ ] P6. Refactor `ContentManager.tsx` (1316 → ≤250)
- **Acceptance**:
  - 8+ component trong `src/components/teacher/content/`: `ConfirmDialog` (move), `StatusBadge` (move), `ContentHeader`, `ContentTabs`, `FlashcardSetCard`, `QuizSetCard`, `FlashcardSetForm` (state-owned), `QuizSetForm` (state-owned).
  - Nếu `QuizSetForm` > 200 dòng sau extract: tách tiếp `QuestionComposer` + 4 row components (`McqOptionRow`, `MatchingPairRow`, `ReorderItemRow`, `BlankAnswerRow`).
  - `StatusBadge` lookup status từ `products` array — pass `products` xuống `FlashcardSetCard` và `QuizSetCard` (option 1 trong R6).
  - Parent giữ: imports, dispatch, userId/status selector, 7 useState (`activeTab/flashcardSets/quizSets/products/loadingList/editingTarget/deleteTarget`), 1 useState `loadingDelete`, 2 useEffect, `loadData`, 3 async handlers (`handleEditFlashcardSet/handleEditQuizSet/handleConfirmDelete`), `openDeleteDialog`, 2 cancel handlers, composition.
- **Verify**:
  ```bash
  wc -l src/web-app/src/pages/teacher/ContentManager.tsx
  # Expect: ≤ 250
  cd src/web-app && npm run typecheck  # exit 0
  cd src/web-app && npm run lint       # exit 0
  grep -rn "console\." src/web-app/src/pages/teacher/ContentManager.tsx
  # Expect: chỉ các console cũ (nếu có), không có console MỚI
  ```
- **Files**:
  - CREATE: 8+ file trong `components/teacher/content/` (tùy số row component extract)
  - EDIT: `src/pages/teacher/ContentManager.tsx`

---

### [ ] Pilot 2 Final Gate
- **Acceptance**: Tất cả 6 page đạt target line count, typecheck + lint pass toàn project.
- **Review**: Pause để user review pilot 2 trước khi quyết pilot 3 (5 page còn lại + backend expansion).