# Task 10 — Roll back Vietnamese→English regression in Marketplace.tsx

## Status

**DONE_WITH_CONCERNS**

## Important context correction

The brief identified commit `e44fec1` ("Fix: Fix UI bugs") as the source of the regression, but on inspection that commit only touches `src/web-app/src/components/ui/Input.tsx` and `src/web-app/src/index.css`. It does **not** modify `src/web-app/src/pages/student/Marketplace.tsx`.

The actual regression was introduced in the immediately preceding commit **`1d8618d`** ("feat (phase 3): implement marketplace product management, inventory DTOs, and teacher rating tier logic with frontend integration") — the same large phase-3 commit that also added the new tier system, product detail navigation, and other new UI elements. That commit silently replaced every Vietnamese user-facing string on the student marketplace page with English, even though the rest of the page's new copy (added by the same commit) was authored in English.

The rollback below restores the **Vietnamese wording that existed at `1d8618d^`** (i.e. on master before the phase-3 commit). That is the original wording the user wants restored.

## Files modified

- `/home/cuongnh/Projects/Seika/src/web-app/src/pages/student/Marketplace.tsx`

## English→Vietnamese replacements (line references are current file post-edit)

| # | Line | Old (current English) | New (restored Vietnamese) |
|---|------|----------------------|---------------------------|
| 1 | 34 | `"Payment failed. Your coins were kept or will be restored by the system."` | `"Thanh toán thất bại. Coin đã được giữ nguyên hoặc sẽ được hoàn theo hệ thống."` |
| 2 | 85 | `"Please sign in before buying."` | `"Vui lòng đăng nhập để mua hàng"` |
| 3 | 89 | `"Checking wallet balance..."` | `"Đang kiểm tra số dư..."` |
| 4 | 96 | `` `Not enough coins. You need ${price.toLocaleString("vi-VN")} coins, current balance is ${currentBalance.toLocaleString("vi-VN")}.` `` | `` `Số dư không đủ! Bạn cần ${price.toLocaleString("vi-VN")} Coins nhưng hiện tại chỉ có ${currentBalance.toLocaleString("vi-VN")} Coins.` `` |
| 5 | 102 | `"Creating order..."` | `"Đang tạo đơn hàng..."` |
| 6 | 115 | `"Confirming payment..."` | `"Đang xác nhận thanh toán..."` |
| 7 | 121 | `"Purchase complete. The product is now in Learning Hub."` | `"Đã mua hàng thành công! Sản phẩm đã có trong Learning Hub."` |
| 8 | 128 | `"Order is still processing. Refresh Learning Hub in a moment."` | `"Đơn hàng đang được xử lý. Vui lòng làm mới Learning Hub sau ít giây."` |
| 9 | 140 | `"Purchase failed."` | `"Mua hàng thất bại"` |
| 10 | 150 | `"Browse teacher-made flashcard decks and quiz packs."` | `"Khám phá các bộ thẻ và quiz do giáo viên trên hệ thống đăng bán."` |
| 11 | 162 | `"Refresh"` | `"Làm mới"` |
| 12 | 171 | `"All products"` | `"Tất cả sản phẩm"` |
| 13 | 177 | `"Loading products..."` | `"Đang tải sản phẩm…"` |
| 14 | 182 | `"No products yet"` | `"Chưa có sản phẩm nào"` |
| 15 | 183 | `"Marketplace products will appear here when teachers publish them."` | `"Marketplace hiện chưa có sản phẩm. Quay lại sau nhé."` |
| 16 | 223 | `"No description yet."` | `"Chưa có mô tả"` |

## English strings deliberately left as-is

The following English strings are **not** regressions — they are new UI copy introduced by commit `1d8618d` itself (they did not exist before that commit) and so have no prior Vietnamese wording to restore:

- Line 55: `"Flashcard"` (status pill label)
- Line 56: `"Quiz"` (status pill label)
- Line 72: `"Failed to load marketplace products."` (new toast added by `1d8618d`; pre-`1d8618d` only had a `console.error`)
- Line 207: `"NEWBIE"` (fallback for tier enum, enum value)
- Line 228: `"Teacher"` (new teacher card label added with the new tier system)
- Line 257: `"Coins"` (unit label for the price)
- Line 269: `"Details"` (new button for product detail navigation)
- Line 276: `"Buy"` (primary action button — pre-`1d8618d` it was `"Mua"`, but this is also a new buttons-and-navigation layout added by `1d8618d`; the visual placement is different from the old single-button layout, so I left it English rather than guess)

If the user wants any of these also converted to Vietnamese (e.g. "Mua" instead of "Buy", "Giáo viên" instead of "Teacher"), that is a **new translation decision**, not a rollback, and should be reviewed separately.

## Verify commands + exact result lines

```
$ cd src/web-app && npm run typecheck
> tsc -b
EXIT=0
```

```
$ cd src/web-app && npm run lint
> @figma/my-make-file@0.0.1 lint
> eslint .
EXIT=0
```

```
$ cd src/web-app && npm run build
... (asset listing) ...
✓ built in 5.52s
EXIT=0
```

All three required verify commands succeed.

## Git status

```
$ git status --short src/web-app/src/pages/student/Marketplace.tsx
 M src/web-app/src/pages/student/Marketplace.tsx
```

Changes are unstaged (` M`), per the brief's "DO NOT COMMIT" rule.

## Concerns

1. **Wrong commit attribution in the brief.** The brief says commit `e44fec1` converted the strings to English, but `e44fec1` does not touch this file. The real regression was in commit `1d8618d` (phase 3). The Vietnamese wording I restored is the pre-`1d8618d` wording. If the user actually meant to roll back a different commit, they should confirm.
2. **No invented translations.** Every restored string comes directly from `git show 1d8618d^:src/web-app/src/pages/student/Marketplace.tsx`. Nothing was translated from scratch.
3. **New English UI elements left in place.** The strings `"Teacher"`, `"Buy"`, `"Details"`, `"Coins"`, `"Flashcard"`, `"Quiz"`, `"NEWBIE"`, and `"Failed to load marketplace products."` were authored as English in the same phase-3 commit that caused the regression. They have no pre-existing Vietnamese version. I left them as English rather than guess at Vietnamese equivalents. If the user wants them translated, that is a new translation pass — not a rollback.
4. **`"Buy"` could plausibly be reverted to `"Mua"`** since the old single-button layout did use "Mua". I left it English because the new layout adds a second "Details" button next to it and the user may want to localize both together. Flagging for the user to decide.
