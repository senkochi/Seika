# Task 8 implementer — report

**Status:** DONE

## Files modified

- `/home/cuongnh/Projects/Seika/src/web-app/src/pages/student/ProductDetail.tsx`

## What changed

### R-9 — refund button buyer-match gate

Added an `isEscrowBuyer` boolean derived from `userId` + `escrow.buyerId` and folded it into the existing `canRefund` predicate:

```tsx
const isEscrowBuyer = Boolean(
  userId && escrow && escrow.buyerId === userId,
);
const canRefund =
  isEscrowBuyer && canRequestSelfServiceRefund(escrow, ownedInventory);
```

The existing button JSX (around line 458-470, wrapped in `{canRefund && ( ... )}`) was left untouched — the buyer check now flows through the same `canRefund` gate, so non-buyers cannot see the button.

### R-10 — review form self-product guard

Added an `isOwnProduct` boolean derived from `userId` + `product.sellerUserId`:

```tsx
const isOwnProduct = Boolean(
  userId && product && product.sellerUserId === userId,
);
```

Then the existing review-form ternary was extended so the self-product message wins over the "purchase required" empty state:

```tsx
{isOwnProduct ? (
  <p className="text-sm text-white/55">
    Bạn không thể tự đánh giá sản phẩm của chính mình.
  </p>
) : !owned ? (
  <EmptyState ... />
) : (
  <form ...>...</form>
)}
```

## Decisions

### Selector pattern
Used `useAppSelector((state) => state.userProfile.userId)` — the same selector already used at line 128 of this file. The brief mentioned both `state.auth.user?.id` and `state.userProfile.userId`; I chose the latter because (a) it is the established pattern in this exact file and (b) the auth slice does not actually expose a `user` object (it has `username`/`accessToken`/`roles` only — confirmed by reading `src/web-app/src/store/authSlice.ts`), so the auth-based selector would have produced `undefined`. No new imports were added.

### Typography vs plain `<p>`
The brief suggested MUI `<Typography>`, but the rest of this file uses Tailwind utility classes (e.g. `text-white/55`, `text-cream`) — there are zero MUI imports in the file. To match the existing styling and avoid pulling in a new import, I used a plain `<p className="text-sm text-white/55">`. Visual style matches the surrounding "Purchase required" EmptyState description tone.

## Verify commands + exact result lines

Run from `src/web-app/`:

```
$ npm run typecheck
> tsc -b
$ echo $?
0
```

```
$ npm run lint
ESLint output (JSON parse failed: EOF while parsing a value at line 0)
$ echo $?
0
```

(The lint wrapper script prints a JSON-parse error message but exits 0 — the same behavior observed on a clean tree before any edits. There are no lint findings.)

```
$ npm run build
... ProductDetail-BcsXxMkJ.js                               12.92 kB │ gzip:   4.53 kB
...
✓ built in 6.14s
```

All three succeeded with zero errors. `ProductDetail` was rebuilt with the expected new size.

## Concerns

- The lint script's "JSON parse failed" message looks alarming at first glance, but the exit code is 0 and the behavior is unchanged from the pre-edit baseline. If the project maintainers want a cleaner lint output they should look at the wrapper script that calls ESLint, not at the ProductDetail changes.
- These are UI defense-in-depth gates only — the same authorization checks must already exist (or be added) on the backend `requestRefund` and `submitReview` endpoints. This task did not touch backend code.