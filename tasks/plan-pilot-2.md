# Plan: Refactor pilot 2 — teacher + admin pages

Plan triển khai cho spec `tasks/spec-pilot-2.md`. Phạm vi: 6 page lớn trong `src/web-app/src/pages/teacher/` và `src/web-app/src/pages/admin/`.

---

## 1. Approach

Theo pattern đã verify ở pilot 1: **leaf first, parent last, one-page-at-a-time**.

Vì:
- Mỗi page có mix riêng (form, table, list, modal) — pattern chung không cover hết.
- Làm tuần tự từng page giúp debug dễ: nếu page N fail, biết ngay đâu lỗi.
- Sub-agent có thể đọc + viết song song cho 6 page trong worktree riêng, nhưng pilot 2 vẫn trong main agent để giữ context về convention đã chốn ở pilot 1.

Order: dễ → khó (xem spec §8).

---

## 2. Implementation Order & Dependencies

```
P1: TeacherDashboardHome.tsx     (415 → 170, 7-8 leaf)
   ↓
P2: TeacherProfile.tsx           (436 → 80, 7 leaf)
   ↓
P3: AdminUsers.tsx               (462 → 130, 6-7 leaf, 2 modal đã có sẵn)
   ↓
P4: TeacherWallet.tsx            (445 → 150, 6 leaf)
   ↓
P5: TeacherStatistics.tsx        (584 → 100, 6 leaf, 4 component đã có sẵn)
   ↓
P6: ContentManager.tsx           (1316 → 250, 6-10 leaf, QuizSetForm ~380 dòng)
```

**Tất cả sequential**. Lý do:
- Mỗi page độc lập — không phụ thuộc file khác (trừ utility `format.ts` ở P4–P5).
- Sequential cho phép verify liên tục, fail nhanh nếu có bug.

### Shared utility — `src/utils/format.ts`
- Cần thiết cho P4 (TeacherWallet), P5 (TeacherStatistics).
- Tạo ở đầu P4 (trước khi tách component wallet) — để dùng luôn.

---

## 3. Per-page Plan

### P1: TeacherDashboardHome (415 → 170)

**Component mới** (trong `components/teacher/dashboard/`):
1. `DashboardLoadingState` (10 dòng, no props)
2. `DashboardFailedState` (19 dòng, props: `error`, `onRetry`)
3. `DashboardWelcomeHeader` (27 dòng, props: `displayName`, `onRefresh`, `onCreateMaterial`)
4. `TopStatsGrid` (30 dòng, props: `stats`)
5. `RevenueChartCard` (74 dòng, props: `chartData`, `period`, `onPeriodChange`) — chứa recharts
6. `LevelProgressCard` (51 dòng, props: `currentLevelXP`, `nextLevelXP`, `level`) — chứa SVG circular
7. `RecentIncomesList` (44 dòng, props: `events`, `onGoToWallet`)

**Parent giữ**: imports, hooks (useEffect x3, useState x4), Redux subscriptions, `displayName/chartData` derivation, composition.

**Verify**:
- `wc -l` ≤ 170
- `npm run typecheck` + `npm run lint` pass

---

### P2: TeacherProfile (436 → 80)

**Component mới** (trong `components/teacher/profile/`):
1. `ProfileLoadingScreen` (10 dòng, no props)
2. `ProfilePageHeader` (17 dòng, props: `onRefresh`)
3. `TeacherAvatarCard` (53 dòng, props: `profilePictureUrl`, `displayName`, `username`, `gender`, `level`, `exp`)
4. `TeacherProfileForm` (120 dòng, **state-owned** form — props: `profileState`, `isEditing`, `loadingSubmit`, `onSubmit`, `onCancel`, `onEdit`) — form tự quản lý 4 useState input
5. `TeacherAccomplishmentsCard` (42 dòng, props: `statCards`, `loadingStats`, `statsError`)
6. `StatTile` (24 dòng, props: `icon`, `value`, `color`, `bg`, `border`, `label`, `isLoading`)
7. `useTeacherStatCards` (custom hook, ~50 dòng) — derive `statCards` array từ `teacherProfile` + `loadingStats` + `statsError` + `exp`

**Parent giữ**: imports, dispatch, profileState selector, `isEditing/loadingSubmit/teacherProfile/loadingStats/statsError/fullName/dateOfBirth/gender/profilePictureUrl` state, 3 useEffect (initial fetch, sync form, fetch stats), `handleUpdateProfile`, composition.

**Note**: Form sẽ lift 4 useState input xuống `TeacherProfileForm` để cô lập form state. Parent chỉ giữ `loadingSubmit` + `isEditing`.

**Verify**: `wc -l` ≤ 80.

---

### P3: AdminUsers (462 → 130)

**Component mới** (trong `components/admin/users/`):
1. `ChangeRoleModal` (move từ AdminUsers.tsx dòng 50-129, ~80 dòng) — đã có local, chỉ move ra file riêng.
2. `ResetPasswordModal` (move từ AdminUsers.tsx dòng 131-197, ~67 dòng) — tương tự.
3. `UsersHeader` (39 dòng, props: `totalElements`, `filterRole`, `onFilterChange`, `onReload`)
4. `UsersTable` (26 dòng JSX + tableBody inline hoặc tách riêng, props: `users`, `isMutating`, `mutationError`, `tableBody`, `onPageChange`, `onPageSizeChange`)
5. `UsersTableRow` (76 dòng, props: `user`, `isMutating`, `onLockToggle`, `onChangeRole`, `onResetPassword`)
6. `UserStatusPill` (11 dòng, props: `enabled`)
7. `RoleBadge` (move từ helper function dòng 29-48, ~20 dòng)

**Quyết định**: Có thể chọn 1 trong 2 shape cho table:
- (A) Move `tableBody` (useMemo) ra custom hook `useUsersTableBody` → parent gọi hook, truyền `tableBody` xuống `UsersTable`.
- (B) Pass action handlers xuống `UsersTable`, để nó render rows internally (cần move `useMemo` content vào component).

→ Chọn (B) cho đơn giản hơn — `UsersTable` tự quản lý row rendering qua prop `users` + 3 action callbacks.

**Parent giữ**: imports, dispatch, 2 useState (modalRole, modalReset), 1 useEffect (refetch on filter/page/size change), 3 async handlers (handleLockToggle, handleChangeRole, handleResetPassword), `useMemo` cho tableBody (nếu chọn A) hoặc KHÔNG (nếu chọn B), composition.

**Verify**: `wc -l` ≤ 130.

---

### P4: TeacherWallet (445 → 150)

**Tạo trước**: `src/utils/format.ts` với:
```ts
const numberFormatter = new Intl.NumberFormat("vi-VN");
export const formatCurrency = (v: number) => `${numberFormatter.format(v)} ₫`;
export const formatNumber = (v: number) => numberFormatter.format(v);
```

**Component mới** (trong `components/teacher/wallet/`):
1. `WalletHeader` (47 dòng, props: `balance`, `loading`, `onRefresh`)
2. `WalletQuickStats` (44 dòng, props: `totalEarned`, `totalSpent`, `currentStreak`)
3. `TransactionHistory` (52 dòng, props: `history`, `loading`) — chứa TransactionItem
4. `TransactionItem` (31 dòng, props: `tx`)
5. `CashOutForm` (90 dòng, **state-owned** form — props: `onSubmit`, `loadingWithdraw`) — tự quản lý `withdrawAmount`, `bankName`, `bankAccount`
6. `CashOutConfirmDetails` (51 dòng, props: `withdrawAmount`, `bankName`, `bankAccount`, `withdrawalRate`)

**Parent giữ**: imports, `currentStreak` selector, 4 useState (`balance`, `history`, `loading`, `withdrawalRate`), 2 useState modal (`showConfirmModal`, `loadingWithdraw`), 1 useEffect (initial fetch), `fetchWalletData`, `handleWithdraw`, `executeWithdraw`, composition.

**Verify**: `wc -l` ≤ 150.

---

### P5: TeacherStatistics (584 → 100)

**Component hiện có** trong file (move ra file riêng):
1. `StatCard` (33 dòng, dòng 50-82 hiện tại) — move ra `components/teacher/statistics/StatCard.tsx`
2. `LoadingState` (10 dòng, dòng 84-93) — move ra
3. `ErrorState` (27 dòng, dòng 95-121) — move ra
4. `AttemptsModal` (84 dòng, dòng 131-214) — move ra

**Component mới**:
5. `StatisticsHeader` (37 dòng, props: `period`, `setPeriod`, `onRetry`)
6. `KpiGrid` (27 dòng, props: `totalRevenue`, `totalOrders + totalFlashcardSales`, `totalStudents`, `totalContent`)
7. `PassRateStrip` (20 dòng, props: `quizOverview`)
8. `RevenueLineChartCard` (53 dòng, props: `chartData`, `period`)
9. `TopProductsPanel` (61 dòng, props: `topProducts`, `topProductsStatus`, `onProductClick`)
10. `StudentsPurchasedPanel` (49 dòng, props: `students`, `studentsStatus`)

**Parent giữ**: imports (slim), dispatch, 11-field selector, 2 useState (`period`, `modalQuizSetId`), 2 useEffect (initial fetch, period→revenue), useMemo totals, `onRetry`, `openAttempts`, composition.

**Verify**: `wc -l` ≤ 100.

---

### P6: ContentManager (1316 → 250)

**Component mới** (trong `components/teacher/content/`):
1. `ConfirmDialog` (52 dòng, dòng 30-81) — move ra, đã isolated
2. `StatusBadge` (41 dòng, dòng 105-145) — move ra
3. `ContentHeader` (37 dòng, dòng 567-603) — props: `activeTab`, `isCreatingSet`, `isCreatingQuizSet`, `onRefresh`, `onCreate`
4. `ContentTabs` (29 dòng, dòng 605-633) — props: `activeTab`, `hidden`, `onChange`
5. `FlashcardSetCard` (50 dòng, dòng 660-709) — props: `set`, `onEdit`, `onDelete`
6. `QuizSetCard` (50 dòng, dòng 728-777) — props: `set`, `onEdit`, `onDelete`
7. `FlashcardSetForm` (146 dòng, dòng 784-929) — **state-owned** form
8. `QuizSetForm` (380 dòng, dòng 932-1311) — **state-owned** form, lớn nhất
   - Nếu > 200 dòng sau extract row components, tách tiếp:
     - `McqOptionRow` (25 dòng, dòng 1103-1127)
     - `MatchingPairRow` (40 dòng, dòng 1150-1189)
     - `ReorderItemRow` (28 dòng, dòng 1207-1234)
     - `BlankAnswerRow` (25 dòng, dòng 1252-1276)
     - `QuestionComposer` (242 dòng, dòng 1048-1289) — nếu tách 4 row trên

**Parent giữ**: imports, dispatch, userId/status selector, 5 useState (`activeTab`, `flashcardSets`, `quizSets`, `products`, `loadingList`), 2 useState (`editingTarget`, `deleteTarget`), 1 useState `loadingDelete`, 3 useEffect (initial fetch, refetch on tab/userId), `loadData`, `handleEditFlashcardSet`, `handleEditQuizSet`, `handleConfirmDelete`, `openDeleteDialog`, composition.

**Verify**: `wc -l` ≤ 250. Nếu > 250, tách thêm các row components trong QuizSetForm.

---

## 4. Risks & Mitigation

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| R1 | `QuizSetForm` (380 dòng) sau extract row components vẫn > 200 dòng — đẩy parent > 250 | Cao | Plan dự phòng: tách `QuestionComposer` riêng (~242 dòng). Nếu vẫn không đủ, lift thêm `QuestionListItem` ra component. |
| R2 | `TeacherProfileForm` lift state xuống child → parent mất 4 useState input nhưng phải sync với Redux profile | Trung bình | Form nhận initial values qua props (`initialFullName`, etc.), tự quản lý state nội bộ. Parent không cần re-sync sau save (Redux sẽ tự update qua fetchCurrentUserProfile). |
| R3 | `AdminUsers` `useMemo` tableBody closure nhiều state → move ra component có thể vỡ perf | Thấp | Giữ `useMemo` ở parent, pass `tableBody` xuống `UsersTable` như chunked prop. Hoặc nếu move vào component, giữ `useMemo` ở đó. |
| R4 | `formatCurrency`/`formatNumber` đã được inline ở một số file → khi move vào `format.ts` phải update nhiều nơi | Thấp | Tạo `format.ts` ở đầu P4, không backport cho pilot 2 — chỉ dùng cho TeacherWallet + TeacherStatistics. |
| R5 | `console.error` trong `fetchRecentTransactions` (đã note ở pilot 1 follow-up F1) — pilot 2 có thể thêm nếu follow cùng pattern | Thấp | Spec rõ: không thêm `console.error` mới. Nếu catch cần thiết, dùng `showError` toast (đã có sẵn ở một số page). |
| R6 | `StatusBadge` ở ContentManager dùng `products` state ở parent → lift xuống child sẽ cần fetch products hoặc pass down | Trung bình | Pass `products` array xuống `FlashcardSetCard` và `QuizSetCard`, mỗi card lookup status của mình. Hoặc tạo custom hook `useProductStatus(referenceId)` ở parent rồi truyền `getStatus` xuống. → Chọn option 1 (pass products) cho đơn giản. |

---

## 5. Verification Checkpoints (gates between pages)

### Gate P1 — sau TeacherDashboardHome
- [ ] `wc -l src/web-app/src/pages/teacher/TeacherDashboardHome.tsx` ≤ 170
- [ ] `npm run typecheck` exit 0
- [ ] `npm run lint` exit 0

### Gate P2 — sau TeacherProfile
- [ ] `wc -l src/web-app/src/pages/teacher/TeacherProfile.tsx` ≤ 80
- [ ] `npm run typecheck` exit 0
- [ ] `npm run lint` exit 0

### Gate P3 — sau AdminUsers
- [ ] `wc -l src/web-app/src/pages/admin/AdminUsers.tsx` ≤ 130
- [ ] `npm run typecheck` exit 0
- [ ] `npm run lint` exit 0

### Gate P4 — sau TeacherWallet
- [ ] `src/utils/format.ts` tồn tại với `formatCurrency`, `formatNumber`
- [ ] `wc -l src/web-app/src/pages/teacher/TeacherWallet.tsx` ≤ 150
- [ ] `npm run typecheck` exit 0
- [ ] `npm run lint` exit 0

### Gate P5 — sau TeacherStatistics
- [ ] 4 component cũ (StatCard, LoadingState, ErrorState, AttemptsModal) đã move ra file riêng
- [ ] `wc -l src/web-app/src/pages/teacher/TeacherStatistics.tsx` ≤ 100
- [ ] `npm run typecheck` exit 0
- [ ] `npm run lint` exit 0

### Gate P6 — sau ContentManager (cuối pilot)
- [ ] `wc -l src/web-app/src/pages/teacher/ContentManager.tsx` ≤ 250
- [ ] `npm run typecheck` exit 0
- [ ] `npm run lint` exit 0
- [ ] Tổng số component mới ≥ 35 (xem spec §3 đếm)
- [ ] Không có `console.error` MỚI (so với baseline)

### Pilot 2 Final Gate — sau tất cả 6 page
- [ ] Tất cả 6 file page đạt target line count
- [ ] `npm run typecheck` exit 0 toàn project
- [ ] `npm run lint` exit 0 toàn project
- [ ] Pause để user review.

---

## 6. Files Touched (estimate)

### File mới
| Folder | Số file |
|---|---|
| `components/teacher/dashboard/` | 7 |
| `components/teacher/profile/` | 6 + 1 hook |
| `components/teacher/wallet/` | 6 |
| `components/teacher/statistics/` | 6 + 4 (move từ local) = 10 |
| `components/teacher/content/` | 8 (+ có thể 5 row components) |
| `components/admin/users/` | 7 (gồm 2 modal move ra) |
| `utils/format.ts` | 1 |
| **Tổng** | **~50 file mới** |

### File sửa
- 6 page (xem spec §3)
- 1 file `format.ts` mới (P4)

---

## 7. Out-of-Scope (sẽ làm ở pilot 3 nếu user muốn)

- 5 page còn lại: `TeacherDashboard.tsx`, `AdminDashboardHome.tsx`, `AdminRevenue.tsx`, `AdminContentModeration.tsx`, `AdminSystemConfig.tsx`.
- Backend refactor mở rộng (5 service còn lại).
- F1: `console.error` → toast.
- F2: `ApiResponse<T>` wrapper ở gateway.
- Cross-tree promote `LevelProgressCard` của pilot 1 sang `components/teacher/` để share.