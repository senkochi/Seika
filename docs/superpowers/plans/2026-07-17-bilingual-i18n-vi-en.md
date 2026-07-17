# Bilingual i18n (Vietnamese + English) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Seika web app bilingual (Vietnamese + English) using i18next, with a language switcher in every dashboard header, persistent preference, and Vietnamese as the default language.

**Architecture:** Add `i18next` + `react-i18next`. New `uiSlice.language` in Redux mirrored to `localStorage`. Init in `main.tsx` before render, sync React to i18next via `useTranslation`. Translation files split by namespace (`common`, `auth`, `wallet`, `marketplace`, `learning`, `profile`, `teacher`, `admin`, `errors`, `toasts`). Migrate every hardcoded VN/EN string in components and pages to `t(...)` calls; update toast call-sites to pass translated strings. Replace hardcoded `"vi-VN"` formatters with the active locale. Add `<LanguageSwitcher>` to the three dashboard layouts (Student/Teacher/Admin).

**Tech Stack:**
- Frontend: Vite 6 + React 19 + TypeScript 5.9 + Redux Toolkit 2 + MUI 7 + Tailwind 4 + Radix UI + react-router 7 + sonner 2
- i18n: `i18next` + `react-i18next` (chosen; no existing i18n library in repo)
- Path alias: `@/*` → `src/*` (already configured in both `vite.config.ts` and `tsconfig.app.json`)
- Package manager: npm (CLAUDE.md mandates `npm install --legacy-peer-deps`); `pnpm.overrides` block in `package.json` does not affect npm install

## Global Constraints

These apply to every task in the plan. Treat them as non-negotiable:

- **Default language: Vietnamese (`vi`)**. English (`en`) is secondary. UI text must default to Vietnamese for users with no saved preference. Source of truth for VN strings is the existing hardcoded text in components.
- **Path alias `@/*` → `src/*`** is mandatory for all new imports (matches existing project convention).
- **No commit until user review.** Leave all changes un-staged on disk. Do NOT run `git add` or `git commit`. (User memory: "No auto-commit — User prefers staging-only, never auto-commit".)
- **Verify gate after every frontend change:** `cd src/web-app && npm run typecheck && npm run lint && npm run build` — all three must succeed.
- **API does not change.** No new backend endpoints, no DB migrations, no DTO changes. This is a pure frontend refactor.
- **Sonner toasts:** the existing `showSuccess/showError/showInfo/showWarning(message: string)` signature in `src/components/toast/toastUtils.ts` MUST stay string-based. Migrate by translating the string at the call site: `showSuccess(t("toasts.profile.saved"))`. No new toast API.
- **Number / date formatting:** Replace hardcoded `"vi-VN"` `Intl`/`toLocale*` calls (in `Pagination.tsx`, `UsersHeader.tsx`, `OverviewStatsGrid.tsx`, `RevenueChartCard.tsx`, `LevelProgressCard.tsx`, `RecentIncomesList.tsx`, `types.ts`, `WalletControlPanel.tsx`, `TransactionHistory.tsx`, `CashOutForm.tsx`) with the active locale returned by a new helper `getActiveLocale()` (defined in Task 2). Hardcoded `"vi-VN"` outside this list (e.g. brand voice copy) is fine.
- **English translation quality:** plain, neutral, business-correct English. Keep brand names ("Seika"), product type labels that the spec says stay English ("Flashcard", "Quiz", "Teacher", "NEWBIE", "Coins"), and enum / status values exactly as they appear in code.
- **Strings the user already decided should stay English in the previous audit (Task 10 of `2026-07-17-teacher-tiered-economy-v3-remediation`):** `"Flashcard"`, `"Quiz"`, `"Teacher"`, `"NEWBIE"`, `"Coins"`, `"Details"`, `"Buy"`, `"Failed to load marketplace products."` → these go into the `en.json` exactly as-is. The `vi.json` for those same keys keeps whatever is currently on the page (e.g. `"Mua"`, `"Chi tiết"`). If a key has no current VN string (e.g. `"Flashcard"`), use the VN-equivalent common word: `"Thẻ ghi nhớ"` for `Flashcard`, `"Câu đố"` for `Quiz`, `"Giáo viên"` for `Teacher`. Do NOT invent new copy unless the key is empty on both sides.
- **No `any`.** All new TypeScript code is fully typed. i18next's `t` returns `string` by default.
- **No MUI `<Typography>` for plain text in Tailwind-heavy files.** Match existing project convention (Tailwind utility classes) in pages/components already using Tailwind.
- **Hardcoded strings inside JSON / API responses / DB literals are out of scope.** Migrate only strings that are currently in `.tsx` / `.ts` source files.
- **No new dependencies besides `i18next` and `react-i18next`.** Use already-installed `sonner` for toasts, MUI for components.

## File Structure

New / modified file tree at the end of the plan:

```
src/web-app/
├── package.json                                    (MODIFIED: +2 deps)
├── src/
│   ├── main.tsx                                    (MODIFIED: import "./i18n" before render)
│   ├── i18n/                                       (NEW)
│   │   ├── index.ts                                (NEW: i18next init + sync with uiSlice)
│   │   ├── config.ts                               (NEW: namespaces, fallback, supportedLngs)
│   │   ├── locales/
│   │   │   ├── vi/
│   │   │   │   ├── common.json                     (NEW: nav, buttons, labels)
│   │   │   │   ├── auth.json                       (NEW)
│   │   │   │   ├── wallet.json                     (NEW)
│   │   │   │   ├── marketplace.json                (NEW)
│   │   │   │   ├── learning.json                   (NEW)
│   │   │   │   ├── profile.json                    (NEW)
│   │   │   │   ├── teacher.json                    (NEW)
│   │   │   │   ├── admin.json                      (NEW)
│   │   │   │   ├── errors.json                     (NEW: API error keys)
│   │   │   │   └── toasts.json                     (NEW: all toast messages)
│   │   │   └── en/
│   │   │       └── (mirror of all vi files)
│   ├── components/
│   │   ├── i18n/
│   │   │   └── LanguageSwitcher.tsx                (NEW)
│   │   ├── toast/
│   │   │   └── toastUtils.ts                       (UNCHANGED; signatures preserved)
│   │   ├── ui/                                     (Tailwind / shared)
│   │   └── teacher/...                             (migrated in Tasks 6-7)
│   ├── store/
│   │   ├── index.ts                                (MODIFIED: register uiReducer)
│   │   ├── uiSlice.ts                              (NEW: language state + persistence)
│   │   └── hooks.ts                                (UNCHANGED)
│   ├── hooks/
│   │   └── useActiveLocale.ts                      (NEW: reads uiSlice.language → "vi"|"en")
│   ├── layouts/
│   │   ├── StudentDashboardLayout.tsx              (MODIFIED: add <LanguageSwitcher/>)
│   │   ├── TeacherDashboardLayout.tsx              (MODIFIED: add <LanguageSwitcher/>)
│   │   └── AdminDashboardLayout.tsx                (MODIFIED: add <LanguageSwitcher/>)
│   └── pages/
│       ├── student/                                (migrated in Task 4)
│       ├── teacher/                                (migrated in Task 6)
│       └── admin/                                  (migrated in Task 7)
```

`useActiveLocale` and the slice belong in their own files (single responsibility). The locale JSON files are loaded eagerly in dev (`?url` import via Vite) and bundled by Vite — no runtime fetch.

---

### Task 1: Install i18next + react-i18next

**Files:**
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/package.json`
- (No test file — verify by `npm run typecheck` succeeding after install.)

**Interfaces:** None (install-only task).

- [ ] **Step 1: Install dependencies**

Run:
```bash
cd /home/cuongnh/Projects/Seika/src/web-app && npm install --legacy-peer-deps i18next@^24.2.3 react-i18next@^15.4.1
```

Use `--legacy-peer-deps` (mandatory per `CLAUDE.md` for the web-app). The exact versions below are confirmed compatible with React 19:
- `i18next@^24.2.3`
- `react-i18next@^15.4.1`

Expected: command exits 0. `node_modules/i18next/package.json` and `node_modules/react-i18next/package.json` exist after install.

- [ ] **Step 2: Verify `package.json` recorded the deps**

Run:
```bash
grep -E '"i18next"|"react-i18next"' /home/cuongnh/Projects/Seika/src/web-app/package.json
```

Expected output (versions may differ slightly, but both keys must appear):
```
    "i18next": "^24.2.3",
    "react-i18next": "^15.4.1",
```

- [ ] **Step 3: Verify build still passes**

Run:
```bash
cd /home/cuongnh/Projects/Seika/src/web-app && npm run typecheck && npm run lint && npm run build
```

Expected: each command exits 0. Build output ends with `✓ built in <N>s`.

- [ ] **Step 4: DO NOT COMMIT**

Leave `package.json` and `package-lock.json` un-staged.

---

### Task 2: i18n core — config, locales scaffolding, uiSlice, hook, init

**Files:**
- Create: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/config.ts`
- Create: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/index.ts`
- Create: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/vi/common.json`
- Create: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/vi/auth.json`
- Create: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/vi/wallet.json`
- Create: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/vi/marketplace.json`
- Create: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/vi/learning.json`
- Create: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/vi/profile.json`
- Create: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/vi/teacher.json`
- Create: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/vi/admin.json`
- Create: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/vi/errors.json`
- Create: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/vi/toasts.json`
- Create: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/en/common.json` (and one per namespace — same keys, English values)
- Create: `/home/cuongnh/Projects/Seika/src/web-app/src/store/uiSlice.ts`
- Create: `/home/cuongnh/Projects/Seika/src/web-app/src/hooks/useActiveLocale.ts`
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/store/index.ts` (register `uiReducer`)
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/main.tsx` (import `./i18n` for side-effect before render)

**Interfaces:**
- `uiSlice.state.language: SupportedLanguage` (`"vi" | "en"`).
- `uiSlice.actions.setLanguage(lang: SupportedLanguage)`.
- `useActiveLocale(): SupportedLanguage` — selector hook reading `state.ui.language`.
- `i18n/index.ts` exports the configured `i18next` instance. Importing it as a side-effect initializes everything.

- [ ] **Step 1: Create the namespace registry (`i18n/config.ts`)**

Create `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/config.ts`:

```ts
export const SUPPORTED_LANGUAGES = ["vi", "en"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = "vi";
export const FALLBACK_LANGUAGE: SupportedLanguage = "en";

export const NAMESPACES = [
  "common",
  "auth",
  "wallet",
  "marketplace",
  "learning",
  "profile",
  "teacher",
  "admin",
  "errors",
  "toasts",
] as const;
export type Namespace = (typeof NAMESPACES)[number];

export const UI_LANGUAGE_STORAGE_KEY = "seika.ui.language";

export const isSupportedLanguage = (value: unknown): value is SupportedLanguage =>
  typeof value === "string" &&
  (SUPPORTED_LANGUAGES as readonly string[]).includes(value);

export const readStoredLanguage = (): SupportedLanguage => {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }
  const raw = window.localStorage.getItem(UI_LANGUAGE_STORAGE_KEY);
  return isSupportedLanguage(raw) ? raw : DEFAULT_LANGUAGE;
};
```

- [ ] **Step 2: Create empty-but-valid JSON files for every namespace**

Each file must contain at least `{}` so i18next doesn't error on missing-resource lookup. Run from the repo root:

```bash
mkdir -p src/web-app/src/i18n/locales/vi src/web-app/src/i18n/locales/en
for ns in common auth wallet marketplace learning profile teacher admin errors toasts; do
  printf '{}\n' > "src/web-app/src/i18n/locales/vi/${ns}.json"
  printf '{}\n' > "src/web-app/src/i18n/locales/en/${ns}.json"
done
ls src/web-app/src/i18n/locales/vi/ src/web-app/src/i18n/locales/en/
```

Expected: both directories list the 10 namespace files.

- [ ] **Step 3: Create `i18n/index.ts` (init) + the `useActiveLocale` hook**

Create `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/index.ts`:

```ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import {
  DEFAULT_LANGUAGE,
  FALLBACK_LANGUAGE,
  NAMESPACES,
  readStoredLanguage,
  type SupportedLanguage,
} from "./config";

import viCommon from "./locales/vi/common.json";
import viAuth from "./locales/vi/auth.json";
import viWallet from "./locales/vi/wallet.json";
import viMarketplace from "./locales/vi/marketplace.json";
import viLearning from "./locales/vi/learning.json";
import viProfile from "./locales/vi/profile.json";
import viTeacher from "./locales/vi/teacher.json";
import viAdmin from "./locales/vi/admin.json";
import viErrors from "./locales/vi/errors.json";
import viToasts from "./locales/vi/toasts.json";

import enCommon from "./locales/en/common.json";
import enAuth from "./locales/en/auth.json";
import enWallet from "./locales/en/wallet.json";
import enMarketplace from "./locales/en/marketplace.json";
import enLearning from "./locales/en/learning.json";
import enProfile from "./locales/en/profile.json";
import enTeacher from "./locales/en/teacher.json";
import enAdmin from "./locales/en/admin.json";
import enErrors from "./locales/en/errors.json";
import enToasts from "./locales/en/toasts.json";

const resources = {
  vi: {
    common: viCommon,
    auth: viAuth,
    wallet: viWallet,
    marketplace: viMarketplace,
    learning: viLearning,
    profile: viProfile,
    teacher: viTeacher,
    admin: viAdmin,
    errors: viErrors,
    toasts: viToasts,
  },
  en: {
    common: enCommon,
    auth: enAuth,
    wallet: enWallet,
    marketplace: enMarketplace,
    learning: enLearning,
    profile: enProfile,
    teacher: enTeacher,
    admin: enAdmin,
    errors: enErrors,
    toasts: enToasts,
  },
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: readStoredLanguage(),
  fallbackLng: FALLBACK_LANGUAGE,
  defaultNS: "common",
  ns: [...NAMESPACES],
  interpolation: { escapeValue: false }, // React already escapes
  returnNull: false,
  react: { useSuspense: false },
});

/**
 * Change the active language and persist it. Call this from anywhere —
 * typically from a Redux action's middleware or directly from the LanguageSwitcher.
 */
export const changeLanguage = async (lang: SupportedLanguage): Promise<void> => {
  await i18n.changeLanguage(lang);
  if (typeof window !== "undefined") {
    window.localStorage.setItem("seika.ui.language", lang);
  }
};

export default i18n;
```

Create `/home/cuongnh/Projects/Seika/src/web-app/src/hooks/useActiveLocale.ts`:

```ts
import { useAppSelector } from "../store/hooks";
import type { SupportedLanguage } from "../i18n/config";

/** Returns the active UI language. UI re-renders when the language changes. */
export const useActiveLocale = (): SupportedLanguage =>
  useAppSelector((state) => state.ui.language);
```

- [ ] **Step 4: Create `uiSlice.ts` and register it in the store**

Create `/home/cuongnh/Projects/Seika/src/web-app/src/store/uiSlice.ts`:

```ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  DEFAULT_LANGUAGE,
  isSupportedLanguage,
  UI_LANGUAGE_STORAGE_KEY,
  type SupportedLanguage,
} from "../i18n/config";

export type UiState = {
  language: SupportedLanguage;
};

const initialLanguage: SupportedLanguage = (() => {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }
  const raw = window.localStorage.getItem(UI_LANGUAGE_STORAGE_KEY);
  return isSupportedLanguage(raw) ? raw : DEFAULT_LANGUAGE;
})();

const initialState: UiState = {
  language: initialLanguage,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setLanguage(state, action: PayloadAction<SupportedLanguage>) {
      state.language = action.payload;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, action.payload);
      }
    },
  },
});

export const { setLanguage } = uiSlice.actions;
export default uiSlice.reducer;
```

Modify `/home/cuongnh/Projects/Seika/src/web-app/src/store/index.ts`. Add the import (alphabetically after the existing slice imports) and register the reducer:

```ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import userProfileReducer from "./userProfileSlice";
import notificationReducer from "./notificationSlice";
import statisticsReducer from "./statisticsSlice";
import adminReducer from "./adminSlice";
import uiReducer from "./uiSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    userProfile: userProfileReducer,
    notifications: notificationReducer,
    statistics: statisticsReducer,
    admin: adminReducer,
    ui: uiReducer,
  },
});

export type AppStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

- [ ] **Step 5: Wire init into `main.tsx`**

Modify `/home/cuongnh/Projects/Seika/src/web-app/src/main.tsx`. Add the i18n side-effect import immediately above the `setupAuthInterceptor(...)` call (must run before render):

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import "./index.css";
import "./i18n"; // side-effect: init i18next before render
import App from "./App";
import { store } from "./store";
import { setupAuthInterceptor } from "./api/client";
import { logout, setCredentials } from "./store/authSlice";

// Kết nối interceptor auto-refresh token với Redux store.
// Phải gọi trước khi render để interceptor có thể dispatch actions.
setupAuthInterceptor({
  dispatch: store.dispatch,
  logout,
  setCredentials,
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
```

- [ ] **Step 6: Verify**

Run:
```bash
cd /home/cuongnh/Projects/Seika/src/web-app && npm run typecheck && npm run lint && npm run build
```

Expected: each command exits 0. Build output ends with `✓ built in <N>s`. The dev server (`npm run dev`) should still load — visit `http://localhost:5173/` and confirm no console errors. The UI should look identical to before (no string has been migrated yet), but `localStorage.getItem("seika.ui.language")` should return `"vi"` after first load.

- [ ] **Step 7: DO NOT COMMIT**

Leave every new/modified file un-staged.

---

### Task 3: LanguageSwitcher component + wire into three dashboard layouts

**Files:**
- Create: `/home/cuongnh/Projects/Seika/src/web-app/src/components/i18n/LanguageSwitcher.tsx`
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/layouts/StudentDashboardLayout.tsx`
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/layouts/TeacherDashboardLayout.tsx`
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/layouts/AdminDashboardLayout.tsx`

**Interfaces:**
- `<LanguageSwitcher />` (no props) — renders a small dropdown that switches `uiSlice.language` and calls `changeLanguage()`.
- Imported by the three dashboard layouts and placed in the right-side header action group, just before the `<Bell>` (notifications) icon (which is at line ~227 in `StudentDashboardLayout.tsx`).

- [ ] **Step 1: Create the `<LanguageSwitcher>` component**

Create `/home/cuongnh/Projects/Seika/src/web-app/src/components/i18n/LanguageSwitcher.tsx`:

```tsx
import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setLanguage } from "../../store/uiSlice";
import { changeLanguage } from "../../i18n";
import type { SupportedLanguage } from "../../i18n/config";

const LABELS: Record<SupportedLanguage, string> = {
  vi: "Tiếng Việt",
  en: "English",
};

function LanguageSwitcher() {
  const { t } = useTranslation("common");
  const dispatch = useAppDispatch();
  const language = useAppSelector((state) => state.ui.language);

  const handleChange = async (next: SupportedLanguage) => {
    if (next === language) return;
    dispatch(setLanguage(next));
    await changeLanguage(next);
  };

  return (
    <div className="relative" data-testid="language-switcher">
      <label className="sr-only" htmlFor="language-select">
        {t("languageSwitcher.label")}
      </label>
      <div className="flex items-center gap-2 p-2 bg-white/[0.04] border border-white/[0.08] rounded-lg">
        <Globe className="w-4 h-4 text-white/60" aria-hidden="true" />
        <select
          id="language-select"
          value={language}
          onChange={(event) => {
            void handleChange(event.target.value as SupportedLanguage);
          }}
          className="bg-transparent text-sm font-sans-ui text-cream focus:outline-none cursor-pointer pr-1"
        >
          {(Object.keys(LABELS) as SupportedLanguage[]).map((lang) => (
            <option
              key={lang}
              value={lang}
              className="bg-[var(--color-sidebar)] text-cream"
            >
              {LABELS[lang]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default LanguageSwitcher;
```

Add the corresponding translation keys to **both** locale files. Edit `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/vi/common.json`:

```json
{
  "languageSwitcher.label": "Ngôn ngữ"
}
```

Edit `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/en/common.json`:

```json
{
  "languageSwitcher.label": "Language"
}
```

- [ ] **Step 2: Add `<LanguageSwitcher/>` to `StudentDashboardLayout.tsx`**

In `/home/cuongnh/Projects/Seika/src/web-app/src/layouts/StudentDashboardLayout.tsx`:

1. Add the import below the existing `import { formatDistanceToNow } from "date-fns";` line at the top of the file:
   ```tsx
   import LanguageSwitcher from "../components/i18n/LanguageSwitcher";
   ```
2. In the JSX `<div className="flex items-center gap-4">` block (around line 226 in the file before edits, the "Right Actions" container), insert `<LanguageSwitcher />` immediately **before** the notifications `<div ref={notificationsRef} className="relative">`:

```tsx
            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <div ref={notificationsRef} className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((prev) => !prev)}
                  ...
```

- [ ] **Step 3: Repeat for `TeacherDashboardLayout.tsx`**

Same two edits. Locate the equivalent "Right Actions" container (the `<div className="flex items-center gap-4">` that wraps the notifications button) and insert `<LanguageSwitcher />` before it.

Add the import line at the top of the file (near the existing `import { formatDistanceToNow } from "date-fns";`):
```tsx
import LanguageSwitcher from "../components/i18n/LanguageSwitcher";
```

- [ ] **Step 4: Repeat for `AdminDashboardLayout.tsx`**

Same two edits as Step 3.

- [ ] **Step 5: Verify**

Run:
```bash
cd /home/cuongnh/Projects/Seika/src/web-app && npm run typecheck && npm run lint && npm run build
```

Expected: each command exits 0. Build output ends with `✓ built in <N>s`.

Manual check: `npm run dev`, open `/student/dashboard`, look at the top-right of the header — you should see a globe icon + a `<select>` showing "Tiếng Việt". Change to "English" — `localStorage.getItem("seika.ui.language")` should now return `"en"`. Refresh the page — the select should retain "English". Repeat for `/teacher/dashboard/*` and `/admin/dashboard/*`.

- [ ] **Step 6: DO NOT COMMIT**

Leave all changes un-staged.

---

### Task 4: Migrate student pages (`Marketplace`, `Wallet`, `FlashcardDetail`, `LearningHub`, `StudentProfile`, `QuizDetail`) to `t(...)`

**Files:**
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/pages/student/Marketplace.tsx` (290 lines, 16+ VN strings)
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/pages/student/Wallet.tsx` (474 lines, 38+ VN strings)
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/pages/student/FlashcardDetail.tsx` (29+ VN strings)
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/pages/student/LearningHub.tsx` (13+ VN strings, see full source above)
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/pages/student/StudentProfile.tsx` (21+ VN strings)
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/pages/student/QuizDetail.tsx` (21+ VN strings)
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/vi/marketplace.json`
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/en/marketplace.json`
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/vi/wallet.json`
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/en/wallet.json`
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/vi/learning.json`
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/en/learning.json`
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/vi/profile.json`
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/en/profile.json`
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/vi/common.json` (add keys shared across student pages)
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/en/common.json` (mirror)

**Interfaces:** all changes are additive — each new key in JSON, each component switches `"foo"` → `t("namespace.key")`. No prop / signature changes.

This task is large because each file has many strings. The pattern is the same for every string. Below is the **complete** procedure, illustrated in full for `LearningHub.tsx` (the smallest file). The same procedure scales to the larger files.

- [ ] **Step 1: Read the source for `LearningHub.tsx` to enumerate keys**

Re-read `/home/cuongnh/Projects/Seika/src/web-app/src/pages/student/LearningHub.tsx`. The user-facing strings to migrate are:

| File line | Hardcoded VN | New key |
|---|---|---|
| 27 | `"Đã sở hữu"` | `learning.productCard.ownedBadge` |
| 41 | `"Chưa có mô tả"` | `learning.productCard.noDescription` |
| 78 | `"Trung tâm học tập"` | `learning.hub.title` |
| 79 | `"Chọn bộ thẻ hoặc bài quiz đã mua và bắt đầu ôn luyện."` | `learning.hub.subtitle` |
| 91 | `"Làm mới"` | `common.actions.refresh` |
| 98 | `"Đang tải kho nội dung…"` | `learning.hub.loading` |
| 110 | `"Bộ flashcard"` | `learning.hub.flashcardSection` |
| 117 | `"Chưa có bộ flashcard nào"` | `learning.emptyState.flashcard.title` |
| 118 | `"Mua bộ thẻ từ Marketplace để bắt đầu học."` | `learning.emptyState.flashcard.description` |
| 128 | `"Học ngay"` | `learning.productCard.studyFlashcard` |
| 144 | `"Quiz"` | `learning.hub.quizSection` |
| 151 | `"Chưa có bộ quiz nào"` | `learning.emptyState.quiz.title` |
| 153 | `"Mua bài quiz từ Marketplace để bắt đầu luyện tập."` | `learning.emptyState.quiz.description` |
| 163 | `"Làm quiz"` | `learning.productCard.takeQuiz` |

- [ ] **Step 2: Write the `vi/learning.json` and `en/learning.json` content for these keys**

Replace `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/vi/learning.json` with:

```json
{
  "hub": {
    "title": "Trung tâm học tập",
    "subtitle": "Chọn bộ thẻ hoặc bài quiz đã mua và bắt đầu ôn luyện.",
    "loading": "Đang tải kho nội dung…",
    "flashcardSection": "Bộ flashcard",
    "quizSection": "Quiz"
  },
  "productCard": {
    "ownedBadge": "Đã sở hữu",
    "noDescription": "Chưa có mô tả",
    "studyFlashcard": "Học ngay",
    "takeQuiz": "Làm quiz"
  },
  "emptyState": {
    "flashcard": {
      "title": "Chưa có bộ flashcard nào",
      "description": "Mua bộ thẻ từ Marketplace để bắt đầu học."
    },
    "quiz": {
      "title": "Chưa có bộ quiz nào",
      "description": "Mua bài quiz từ Marketplace để bắt đầu luyện tập."
    }
  }
}
```

Replace `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/en/learning.json` with:

```json
{
  "hub": {
    "title": "Learning Hub",
    "subtitle": "Pick a flashcard deck or quiz you've bought and start revising.",
    "loading": "Loading your library…",
    "flashcardSection": "Flashcard decks",
    "quizSection": "Quizzes"
  },
  "productCard": {
    "ownedBadge": "Owned",
    "noDescription": "No description yet.",
    "studyFlashcard": "Study now",
    "takeQuiz": "Take quiz"
  },
  "emptyState": {
    "flashcard": {
      "title": "No flashcard decks yet",
      "description": "Buy a deck from the Marketplace to start learning."
    },
    "quiz": {
      "title": "No quizzes yet",
      "description": "Buy a quiz from the Marketplace to start practising."
    }
  }
}
```

Also extend `vi/common.json` (key `actions.refresh`) — open the file (currently `{ "languageSwitcher.label": "..." }`) and add the action key:

`/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/vi/common.json`:
```json
{
  "languageSwitcher.label": "Ngôn ngữ",
  "actions": {
    "refresh": "Làm mới"
  }
}
```

`/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/en/common.json`:
```json
{
  "languageSwitcher.label": "Language",
  "actions": {
    "refresh": "Refresh"
  }
}
```

- [ ] **Step 3: Replace hardcoded strings in `LearningHub.tsx`**

Edit `/home/cuongnh/Projects/Seika/src/web-app/src/pages/student/LearningHub.tsx`. Apply each replacement below using the Edit tool (each `old_string` must be unique in the file):

| Find | Replace with |
|---|---|
| `import { BookOpen, Target, RefreshCcw } from "lucide-react";` (top of file) | `import { BookOpen, Target, RefreshCcw } from "lucide-react";\nimport { useTranslation } from "react-i18next";` |
| `function ProductCard({` | `const { t } = useTranslation("learning");\n\nfunction ProductCard({` |
| `>Đã sở hữu</StatusPill>` | `>{t("productCard.ownedBadge")}</StatusPill>` |
| `{description || "Chưa có mô tả"}` | `{description || t("productCard.noDescription")}` |
| `title="Trung tâm học tập"\n        subtitle="Chọn bộ thẻ hoặc bài quiz đã mua và bắt đầu ôn luyện."` | `title={t("hub.title")}\n        subtitle={t("hub.subtitle")}` |
| `Làm mới` | `{t("common:actions.refresh")}` |
| `Đang tải kho nội dung…` | `{t("hub.loading")}` |
| `Bộ flashcard` | `{t("hub.flashcardSection")}` |
| `title="Chưa có bộ flashcard nào"\n                description="Mua bộ thẻ từ Marketplace để bắt đầu học."` | `title={t("emptyState.flashcard.title")}\n                description={t("emptyState.flashcard.description")}` |
| `ctaLabel="Học ngay"` | `ctaLabel={t("productCard.studyFlashcard")}` |
| `Quiz` (line 144 inside `<h2>`) | `{t("hub.quizSection")}` |
| `title="Chưa có bộ quiz nào"\n                description="Mua bài quiz từ Marketplace để bắt đầu luyện tập."` | `title={t("emptyState.quiz.title")}\n                description={t("emptyState.quiz.description")}` |
| `ctaLabel="Làm quiz"` | `ctaLabel={t("productCard.takeQuiz")}` |

After all edits, the file should import `useTranslation` and call `const { t } = useTranslation("learning");` once at the top of the component. No remaining hardcoded Vietnamese strings from the table above.

- [ ] **Step 4: Migrate `Marketplace.tsx` (16 strings) using the same procedure**

Read `/home/cuongnh/Projects/Seika/src/web-app/src/pages/student/Marketplace.tsx` to enumerate every user-facing string. Group them under `marketplace.*` keys. Populate both `vi/marketplace.json` and `en/marketplace.json`. Then edit the `.tsx` file to replace each literal with `t("marketplace.<key>")`.

Key naming convention: use section prefixes matching the page structure — `marketplace.toast.*`, `marketplace.checkout.*`, `marketplace.product.*`, `marketplace.list.*`, etc. Mirror the keys in `en/marketplace.json` with English equivalents. For the 8 strings the user previously decided should stay English in the VN→EN rollback (`"Flashcard"`, `"Quiz"`, `"Teacher"`, `"NEWBIE"`, `"Coins"`, `"Details"`, `"Buy"`, `"Failed to load marketplace products."`), the `en.json` keeps them identical; the `vi.json` uses `null` (or omits) so i18next falls back to `en` for that key. Implement `vi.json` by writing the string with Vietnamese wording if one exists, otherwise omitting the key (i18next falls back automatically). Example for `marketplace.type.flashcard`: `vi` → omit key, `en` → `"Flashcard"`.

- [ ] **Step 5: Migrate `Wallet.tsx` (38 strings) using the same procedure**

Same pattern, namespace `wallet`. Pay attention to wallet-specific terms: "Số dư khả dụng" (available balance), "Rút tiền" (withdraw), "Lịch sử giao dịch" (transaction history), etc.

- [ ] **Step 6: Migrate `FlashcardDetail.tsx`, `StudentProfile.tsx`, `QuizDetail.tsx` (29, 21, 21 strings respectively)**

Namespace `learning`, `profile`, `learning` (QuizDetail shares with LearningHub since both render quizzes). Profile-specific strings live under `profile.*`.

- [ ] **Step 7: Verify**

Run:
```bash
cd /home/cuongnh/Projects/Seika/src/web-app && npm run typecheck && npm run lint && npm run build
```

Expected: each command exits 0. Build output ends with `✓ built in <N>s`.

Manual check: `npm run dev`. Default language (Vietnamese) → visit `/student/dashboard/marketplace`, `/student/dashboard/wallet`, `/student/dashboard/learning`, `/student/dashboard/profile`, `/student/dashboard/flashcard/:id`, `/student/dashboard/quiz/:id`. Switch language to English via the header switcher — every page should render entirely in English. Refresh — English should persist.

- [ ] **Step 8: DO NOT COMMIT**

Leave all changes un-staged.

---

### Task 5: Toast migration + locale-aware formatter helper

**Files:**
- Create: `/home/cuongnh/Projects/Seika/src/web-app/src/utils/format.ts` (helper `formatNumber`, `formatDate`, `formatRelativeTime` that take the active locale)
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/vi/toasts.json` (add keys for every `showX("...")` call enumerated in Step 3)
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/en/toasts.json` (English mirror)
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/en/toasts.json`
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/vi/errors.json` (canonical error messages)
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/en/errors.json`
- Modify every component file that emits a toast — listed under Step 3

**Interfaces:**
- `formatNumber(value: number, options?: Intl.NumberFormatOptions): string` — uses `useActiveLocale()` from inside the hook caller; consumers must call it from a React component (it's a hook wrapper).
- `formatDate(value: Date | string, options?: Intl.DateTimeFormatOptions): string` — same constraint.
- `formatRelativeTime(value: Date | string): string` — uses `date-fns/formatDistanceToNow` with a locale param tied to active language.

- [ ] **Step 1: Create the locale-aware formatter helpers**

Create `/home/cuongnh/Projects/Seika/src/web-app/src/utils/format.ts`:

```ts
import { formatDistanceToNow } from "date-fns";
import { enUS, vi } from "date-fns/locale";
import { useActiveLocale } from "../hooks/useActiveLocale";
import type { SupportedLanguage } from "../i18n/config";

const INTL_MAP: Record<SupportedLanguage, string> = {
  vi: "vi-VN",
  en: "en-US",
};

const DATE_FNS_LOCALE_MAP = {
  vi,
  en: enUS,
} as const;

export const useFormatLocale = (): SupportedLanguage => useActiveLocale();

export const useIntlLocale = (): string => INTL_MAP[useActiveLocale()];

export const useFormatNumber = () => {
  const locale = useIntlLocale();
  return (value: number, options?: Intl.NumberFormatOptions): string =>
    new Intl.NumberFormat(locale, options).format(value);
};

export const useFormatDate = () => {
  const locale = useIntlLocale();
  return (value: Date | string, options?: Intl.DateTimeFormatOptions): string =>
    new Intl.DateTimeFormat(locale, options).format(
      typeof value === "string" ? new Date(value) : value,
    );
};

export const useFormatRelativeTime = () => {
  const language = useFormatLocale();
  return (value: Date | string): string =>
    formatDistanceToNow(typeof value === "string" ? new Date(value) : value, {
      addSuffix: true,
      locale: DATE_FNS_LOCALE_MAP[language],
    });
};
```

- [ ] **Step 2: Migrate the existing `vi-VN` formatter call sites to the new helpers**

The list of files (from the survey) that hardcode `"vi-VN"`:

- `/home/cuongnh/Projects/Seika/src/web-app/src/components/ui/Pagination.tsx`
- `/home/cuongnh/Projects/Seika/src/web-app/src/components/admin/users/UsersHeader.tsx`
- `/home/cuongnh/Projects/Seika/src/web-app/src/components/teacher/statistics/OverviewStatsGrid.tsx`
- `/home/cuongnh/Projects/Seika/src/web-app/src/components/teacher/dashboard/RevenueChartCard.tsx`
- `/home/cuongnh/Projects/Seika/src/web-app/src/components/teacher/dashboard/LevelProgressCard.tsx`
- `/home/cuongnh/Projects/Seika/src/web-app/src/components/teacher/dashboard/RecentIncomesList.tsx`
- `/home/cuongnh/Projects/Seika/src/web-app/src/components/teacher/wallet/types.ts`
- `/home/cuongnh/Projects/Seika/src/web-app/src/components/teacher/wallet/WalletControlPanel.tsx`
- `/home/cuongnh/Projects/Seika/src/web-app/src/components/teacher/wallet/TransactionHistory.tsx`
- `/home/cuongnh/Projects/Seika/src/web-app/src/components/teacher/wallet/CashOutForm.tsx`

For each file: read the file, find every occurrence of `.toLocaleString("vi-VN")` and `.toLocaleDateString("vi-VN")`. Replace each occurrence by switching to one of the hooks from `utils/format.ts`. **Pattern:**

- If the call site is inside a React component (`function Foo() { ... }`), use the hook: `const formatNumber = useFormatNumber(); ... formatNumber(value)` instead of `value.toLocaleString("vi-VN")`.
- If the call site is inside a non-React utility file (e.g. `types.ts` exporting a type guard), pass `locale` as a parameter from the caller. Convert such files to functions taking `locale: SupportedLanguage` and call them from the React layer.
- Replace any standalone `new Intl.NumberFormat("vi-VN")` (no `toLocale*` shorthand) with `new Intl.NumberFormat(useIntlLocale())` inside React, or accept locale as parameter outside React.

For `date-fns/formatDistanceToNow` calls (already in `StudentDashboardLayout.tsx` at line ~289, `TeacherDashboardLayout.tsx`, `AdminDashboardLayout.tsx`), replace with `useFormatRelativeTime()` so the suffix language also follows the active locale.

- [ ] **Step 3: Migrate toast call sites to translate first, then show**

Every component listed below imports `showSuccess` / `showError` / `showInfo` / `showWarning` from `components/toast/toastUtils.ts` and passes a literal Vietnamese or English string. Migrate each call to translate via `t("toasts.<key>")` and then pass the result.

List of files to migrate (from the survey, ~10 files — listed below with the relevant toast strings). For each: read the file, identify all `showX("…")` calls, add the matching key to **both** `vi/toasts.json` and `en/toasts.json`, and replace the call.

- `/home/cuongnh/Projects/Seika/src/web-app/src/components/teacher/profile/TeacherProfileForm.tsx` — keys: `toasts.teacher.profile.saveSuccess`, `toasts.teacher.profile.saveError`, etc.
- `/home/cuongnh/Projects/Seika/src/web-app/src/components/teacher/content/FlashcardSetForm.tsx` — keys: `toasts.teacher.flashcardSet.*`
- `/home/cuongnh/Projects/Seika/src/web-app/src/components/teacher/content/QuizSetForm.tsx` — keys: `toasts.teacher.quizSet.*`
- `/home/cuongnh/Projects/Seika/src/web-app/src/components/teacher/content/QuizQuestionForm.tsx` — keys: `toasts.teacher.quizQuestion.*`
- `/home/cuongnh/Projects/Seika/src/web-app/src/components/teacher/wallet/CashOutForm.tsx` — keys: `toasts.teacher.wallet.*` (including `amountInvalid`, `amountMustBeMultipleOf10`, `balanceNotEnough`).
- `/home/cuongnh/Projects/Seika/src/web-app/src/components/auth/RegistrationBox.tsx` — keys: `toasts.auth.registration.*`.
- `/home/cuongnh/Projects/Seika/src/web-app/src/pages/admin/AdminContentModeration.tsx` — keys: `toasts.admin.moderation.*`.
- `/home/cuongnh/Projects/Seika/src/web-app/src/pages/admin/AdminUsers.tsx` — keys: `toasts.admin.users.*`.
- `/home/cuongnh/Projects/Seika/src/web-app/src/pages/admin/AdminMarketplaceRiskPanel.tsx` — keys: `toasts.admin.risk.*`.
- `/home/cuongnh/Projects/Seika/src/web-app/src/pages/student/Marketplace.tsx` — keys: `toasts.marketplace.*` (e.g. `paymentFailed`, `purchaseSuccess`, `pleaseSignIn`, etc.).

For every key, the **Vietnamese** wording is the exact current literal in the component. The **English** wording is a neutral business translation. Pattern:

```tsx
// Before
showError("Amount is invalid.");

// After
import { useTranslation } from "react-i18next";
const { t } = useTranslation("toasts");
showError(t("teacher.wallet.amountInvalid"));
```

Add to `vi/toasts.json` (extend the existing `{}` file):
```json
{
  "teacher": {
    "wallet": {
      "amountInvalid": "Amount is invalid.",
      "amountMustBeMultipleOf10": "Cash-out amount must be a multiple of 10 coins.",
      "balanceNotEnough": "Withdrawable balance is not enough."
    }
  }
}
```

Add to `en/toasts.json`:
```json
{
  "teacher": {
    "wallet": {
      "amountInvalid": "Amount is invalid.",
      "amountMustBeMultipleOf10": "Cash-out amount must be a multiple of 10 coins.",
      "balanceNotEnough": "Withdrawable balance is not enough."
    }
  }
}
```

(For this set the existing strings happen to already be English — that's fine; we keep them. The point is they're now centralized and can be re-translated later.)

- [ ] **Step 4: Migrate canonical API error messages**

Read `/home/cuongnh/Projects/Seika/src/web-app/src/api/errors.ts` and the existing `getApiErrorMessage` helper. If it returns hardcoded Vietnamese strings, add a thin wrapper that takes a translation key:

Create (or modify) `/home/cuongnh/Projects/Seika/src/web-app/src/utils/apiErrorMessage.ts`:

```ts
import i18n from "../i18n";
import type { TFunction } from "i18next";

/** Returns the translated message for a known error key, or falls back to the raw message. */
export const getApiErrorMessage = (
  errorKey: string,
  fallback: string,
): string => {
  const t: TFunction = i18n.t.bind(i18n);
  const translated = t(`errors.api.${errorKey}`, { defaultValue: "" });
  return translated || fallback;
};
```

If the existing `getApiErrorMessage` lives in `src/api/errors.ts` already, change its body to use the wrapper above and keep its existing call signature.

Populate `vi/errors.json` and `en/errors.json` with canonical keys:

`/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/vi/errors.json`:
```json
{
  "api": {
    "networkError": "Không thể kết nối tới máy chủ. Vui lòng thử lại.",
    "unauthorized": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    "forbidden": "Bạn không có quyền thực hiện thao tác này.",
    "notFound": "Không tìm thấy tài nguyên.",
    "serverError": "Lỗi máy chủ. Vui lòng thử lại sau.",
    "validationError": "Dữ liệu không hợp lệ."
  }
}
```

`/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/en/errors.json`:
```json
{
  "api": {
    "networkError": "Cannot reach the server. Please try again.",
    "unauthorized": "Your session has expired. Please sign in again.",
    "forbidden": "You don't have permission to perform this action.",
    "notFound": "Resource not found.",
    "serverError": "Server error. Please try again later.",
    "validationError": "Invalid input."
  }
}
```

- [ ] **Step 5: Verify**

Run:
```bash
cd /home/cuongnh/Projects/Seika/src/web-app && npm run typecheck && npm run lint && npm run build
```

Expected: each command exits 0. Build output ends with `✓ built in <N>s`.

Manual check: `npm run dev`. Visit `/teacher/dashboard/wallet` (or wherever CashOutForm is rendered). Trigger the toast "Amount is invalid" by entering `abc`. Switch language to English — trigger the same toast — message should still be in English (because the source string was already English; that is correct). Visit `/student/dashboard/wallet` — numbers should render with thousand-separators matching the active locale (e.g. `1.234` in `vi`, `1,234` in `en`).

- [ ] **Step 6: DO NOT COMMIT**

Leave all changes un-staged.

---

### Task 6: Migrate teacher pages and components

**Files:**
- Modify: every page in `/home/cuongnh/Projects/Seika/src/web-app/src/pages/teacher/`
- Modify: every component in `/home/cuongnh/Projects/Seika/src/web-app/src/components/teacher/` (forms, statistics, dashboard, wallet, content, profile)
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/vi/teacher.json`
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/en/teacher.json`
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/vi/wallet.json` (if teacher wallet strings differ from student wallet)
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/en/wallet.json`

**Interfaces:** Same as Task 4 — pure string replacement via `t("teacher.<key>")` and `t("wallet.<key>")`. No prop changes.

- [ ] **Step 1: Enumerate teacher strings**

For every file under `src/pages/teacher/` and `src/components/teacher/`, read it and tabulate each user-facing string into a shared `teacher.<section>.<key>` namespace. Use sub-sections:
- `teacher.dashboard.*` — `TeacherDashboardHome`, `RevenueChartCard`, `LevelProgressCard`, `RecentIncomesList`, `OverviewStatsGrid`.
- `teacher.statistics.*` — `Statistics`, `OverviewStatsGrid`, anything else in `pages/teacher/Statistics.tsx`.
- `teacher.content.flashcardSet.*`, `teacher.content.quizSet.*`, `teacher.content.quizQuestion.*` — form labels.
- `teacher.profile.*` — `TeacherProfileForm`.
- `teacher.wallet.*` — `CashOutForm`, `WalletControlPanel`, `TransactionHistory`.

- [ ] **Step 2: Populate the JSON files**

After enumeration, fill `vi/teacher.json` and `en/teacher.json` (and extend `wallet.json` if needed). Keep VN copy as-is from the current components. Use neutral English for `en/teacher.json`. Pay attention to terminology consistency: e.g. "Doanh thu" = "Revenue", "Số dư khả dụng" = "Available balance", "Yêu cầu rút tiền" = "Cash-out request".

- [ ] **Step 3: Edit each teacher file**

For every file, apply the same pattern as Task 4:
1. Add `import { useTranslation } from "react-i18next";` at the top.
2. Inside the component body (and any nested helpers that produce JSX), call `const { t } = useTranslation("teacher");` (and `useTranslation("wallet")` if it consumes wallet strings too — call both hooks at top level).
3. Replace each literal string with `t("<namespace>.<key>")`. Use `t("wallet:...")` syntax only when the namespace is explicit; default `useTranslation("teacher")` means most calls are `t("<key>")`.
4. For toast call sites already migrated in Task 5, do **not** re-translate — they already use `t("toasts.teacher.*")`. Just confirm the keys line up.

- [ ] **Step 4: Verify**

Run:
```bash
cd /home/cuongnh/Projects/Seika/src/web-app && npm run typecheck && npm run lint && npm run build
```

Expected: each command exits 0.

Manual check: `npm run dev`. Visit `/teacher/dashboard/*`. Toggle language — every visible string should swap. Test forms (create a flashcard set, attempt cash-out with invalid amount, edit profile) — toasts should appear in the active language.

- [ ] **Step 5: DO NOT COMMIT**

Leave all changes un-staged.

---

### Task 7: Migrate admin pages and components

**Files:**
- Modify: every page in `/home/cuongnh/Projects/Seika/src/web-app/src/pages/admin/`
- Modify: every component in `/home/cuongnh/Projects/Seika/src/web-app/src/components/admin/`
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/vi/admin.json`
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/en/admin.json`

**Interfaces:** Same pattern as Tasks 4 and 6.

- [ ] **Step 1: Enumerate admin strings**

For every file under `src/pages/admin/` and `src/components/admin/`, read it and tabulate each user-facing string into the `admin.<section>.<key>` namespace. Sections:
- `admin.dashboard.*` — `AdminDashboardHome`.
- `admin.users.*` — `AdminUsers`, `UsersHeader`.
- `admin.moderation.*` — `AdminContentModeration`.
- `admin.risk.*` — `AdminMarketplaceRiskPanel`.
- `admin.revenue.*` — `AdminRevenue`.
- `admin.system.*` — `AdminSystemConfig`.
- `admin.common.*` — labels shared across multiple admin pages (e.g. "Tìm kiếm" = "Search", "Lưu" = "Save").

- [ ] **Step 2: Populate the JSON files**

After enumeration, fill `vi/admin.json` and `en/admin.json`. Keep VN copy as-is. Use neutral English for `en/admin.json`.

- [ ] **Step 3: Edit each admin file**

Same pattern: add `useTranslation` import + `const { t } = useTranslation("admin");` at top of each component, replace literals with `t("<key>")`. For admin pages that also show wallet or statistics data, call both hooks (`useTranslation("admin")` and `useTranslation("wallet")` or `useTranslation("teacher")`).

- [ ] **Step 4: Verify**

Run:
```bash
cd /home/cuongnh/Projects/Seika/src/web-app && npm run typecheck && npm run lint && npm run build
```

Expected: each command exits 0.

Manual check: `npm run dev`. Visit `/admin/dashboard/*`. Toggle language. All admin pages should render in the active language. Test moderation actions, user actions, risk panel actions — toasts should appear in the active language.

- [ ] **Step 5: DO NOT COMMIT**

Leave all changes un-staged.

---

### Task 8: Migrate shared UI components and any remaining strings

**Files:**
- Modify: every file in `/home/cuongnh/Projects/Seika/src/web-app/src/components/ui/` that contains user-facing strings (likely: `ConfirmModal.tsx`, `EmptyState.tsx` callers use props — verify, `Pagination.tsx`, `sonner.tsx` if it has aria labels)
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/components/auth/*` (Login, Register, RegistrationBox, etc.)
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/pages/Home.tsx` (landing page)
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/vi/common.json`
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/en/common.json`
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/vi/auth.json`
- Modify: `/home/cuongnh/Projects/Seika/src/web-app/src/i18n/locales/en/auth.json`

**Interfaces:** Same pattern.

- [ ] **Step 1: Inventory remaining hardcoded strings**

Run from the repo root:
```bash
cd /home/cuongnh/Projects/Seika/src/web-app && \
  grep -rE '"[A-ZÀ-ỹ][^"]{2,}"' src/components/ui src/components/auth src/pages/Home.tsx --include="*.tsx" --include="*.ts" -n | \
  grep -v 'className\|className:\|aria-\|import\|export\|interface\|type \|const ' | head -80
```

Any line returned with a string longer than 2 chars that is not a CSS class or import path is a candidate. Add the string to the appropriate namespace (`common.*` for shared UI buttons/labels, `auth.*` for login/register).

- [ ] **Step 2: Populate `vi/common.json` and `en/common.json`**

Add keys for shared UI copy. Suggested initial keys (extend as needed):
```json
{
  "languageSwitcher.label": "Ngôn ngữ",
  "actions": {
    "refresh": "Làm mới",
    "save": "Lưu",
    "cancel": "Hủy",
    "delete": "Xóa",
    "edit": "Chỉnh sửa",
    "confirm": "Xác nhận",
    "back": "Quay lại",
    "next": "Tiếp theo",
    "submit": "Gửi",
    "search": "Tìm kiếm",
    "loading": "Đang tải…",
    "retry": "Thử lại",
    "close": "Đóng"
  },
  "status": {
    "success": "Thành công",
    "error": "Lỗi",
    "warning": "Cảnh báo",
    "info": "Thông tin"
  },
  "pagination": {
    "previous": "Trước",
    "next": "Sau",
    "page": "Trang"
  }
}
```

Mirror in `en/common.json` with English equivalents.

- [ ] **Step 3: Populate `vi/auth.json` and `en/auth.json`**

Add keys for login/register form labels, placeholders, validation messages. Examples:
```json
{
  "login": {
    "title": "Đăng nhập",
    "username": "Tên đăng nhập",
    "password": "Mật khẩu",
    "rememberMe": "Ghi nhớ đăng nhập",
    "submit": "Đăng nhập",
    "submitting": "Đang đăng nhập…",
    "noAccount": "Chưa có tài khoản?",
    "registerLink": "Đăng ký ngay"
  },
  "register": {
    "title": "Đăng ký tài khoản"
  },
  "errors": {
    "invalidCredentials": "Tên đăng nhập hoặc mật khẩu không đúng.",
    "usernameTaken": "Tên đăng nhập đã được sử dụng."
  }
}
```

Mirror in `en/auth.json`.

- [ ] **Step 4: Migrate the components**

Same pattern as before — add `useTranslation`, call `const { t } = useTranslation("common");` (and `useTranslation("auth");` in auth pages), replace literals. Use the common actions/status keys everywhere a button label or status text appears.

- [ ] **Step 5: Verify**

Run:
```bash
cd /home/cuongnh/Projects/Seika/src/web-app && npm run typecheck && npm run lint && npm run build
```

Expected: each command exits 0.

Manual check: `npm run dev`. Visit `/`, `/auth/login`, `/auth/register`. Toggle language. Confirm every visible string switches.

- [ ] **Step 6: DO NOT COMMIT**

Leave all changes un-staged.

---

### Task 9: Final sweep — find missed strings + smoke test

**Files:**
- (Read-only) audit scripts via `grep`
- Modify any remaining file that still has hardcoded user-facing strings

**Interfaces:** No new interfaces. This task is purely a final polish pass.

- [ ] **Step 1: Run a final grep audit**

Run from the repo root:
```bash
cd /home/cuongnh/Projects/Seika/src/web-app && \
  grep -rnE '"[A-ZÀ-ỹ][^"]{2,}"' src --include="*.tsx" --include="*.ts" | \
  grep -vE 'className|aria-|^[^:]+:\s*import|^[^:]+:\s*export|^[^:]+:\s*(interface|type|const \w+ =|enum) ' | \
  grep -v 'i18n/config\|i18n/index\|utils/format\|toastUtils\|"top-center"\|"richColors"\|"duration"' | head -100
```

Inspect the output. For each remaining hardcoded string that is user-facing (not a CSS class, import path, or literal constant), decide:
- Migrate if user-facing (add to JSON, replace with `t(...)`).
- Leave if it's a literal used by external systems (e.g. a routing path, a Redux action type, an API key).

- [ ] **Step 2: Apply any remaining migrations**

For each item flagged in Step 1, apply the same pattern as Tasks 4-8. Add to the appropriate namespace, edit the component, run the verify gate.

- [ ] **Step 3: Verify the verify gate passes**

Run:
```bash
cd /home/cuongnh/Projects/Seika/src/web-app && npm run typecheck && npm run lint && npm run build
```

Expected: each command exits 0. Build output ends with `✓ built in <N>s`. No ESLint warnings about missing translations or unused imports.

- [ ] **Step 4: Manual smoke test — full app bilingual tour**

Run:
```bash
cd /home/cuongnh/Projects/Seika/src/web-app && npm run dev
```

Click through every page:
- `/` (landing)
- `/auth/login`, `/auth/register`
- `/student/dashboard/*` — home, learning hub, marketplace, wallet, profile, flashcard detail, quiz detail
- `/teacher/dashboard/*` — home, statistics, content (flashcard set form, quiz set form, quiz question form), profile, wallet
- `/admin/dashboard/*` — home, users, content moderation, marketplace risk, revenue, system config

Toggle language to English at every page. Confirm:
- All UI strings swap to English.
- All toast messages swap to English.
- All number / date formatting respects the active locale.
- The select retains the chosen language after a hard refresh.
- `localStorage.getItem("seika.ui.language")` reads `"vi"` or `"en"` correctly.

If any page has untranslated strings, fix them now (add to JSON, replace in component, re-run verify gate).

- [ ] **Step 5: Confirm zero un-staged commits**

Run:
```bash
cd /home/cuongnh/Projects/Seika && git status --short | wc -l
```

Expected: a non-zero number (every modified and untracked file appears). No `git add` or `git commit` was run.

- [ ] **Step 6: DO NOT COMMIT**

Leave all changes un-staged. Final delivery for user review.

---