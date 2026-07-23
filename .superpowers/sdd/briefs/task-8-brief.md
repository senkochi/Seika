# Task 8 — R-9 + R-10 Frontend gates on refund + review forms

## Where this fits

Task 8 of 10. Plan: `/home/cuongnh/Projects/Seika/docs/superpowers/plans/2026-07-17-teacher-tiered-economy-v3-remediation.md`. Tasks 1-7 are complete.

## Goal

Tighten two defense-in-depth gates on the student `ProductDetail.tsx` page that the audit identified as Required security items.

## Read these files first

- `/home/cuongnh/Projects/Seika/src/pages/student/ProductDetail.tsx` — find the refund-button JSX (~line 454-470) and the review-form JSX (~line 553-558).
- `/home/cuongnh/Projects/Seika/src/store/hooks.ts` and `/home/cuongnh/Projects/Seika/src/store/slices/authSlice.ts` — confirm how to get the current userId (likely `useAppSelector((s) => s.auth.user?.id)` or similar). Look at how OTHER components in this file get the current user — the pattern is already established.
- `/home/cuongnh/Projects/Seika/src/web-app/STATE_MANAGEMENT_REDUX_ARCHITECTURE.md` — rules for typed Redux hooks (do NOT import `useDispatch`/`useSelector` directly; use the typed hooks in `src/store/hooks.ts`).

## What R-9 + R-10 are

**R-9:** The "Yêu cầu hoàn tiền" (refund request) button is gated only by escrow presence, not by `escrow.buyerId === currentUserId`. A user could (in theory) call the API directly anyway, but UI defense-in-depth matters.

**R-10:** The review form is rendered unconditionally. A seller could submit a self-review, which is the canonical wash signal the collusion-detection machinery looks for.

## What the fix must do

### R-9 — refund gate

Locate the JSX `<Button ... color="warning" ... >Yêu cầu hoàn tiền</Button>` (or similar) around line 454-470. Add the buyer-match check:

```tsx
{escrow && userId && escrow.buyerId === userId && (
  <Button
    variant="outlined"
    color="warning"
    onClick={handleRequestRefund}
    disabled={refundLoading}
  >
    Yêu cầu hoàn tiền
  </Button>
)}
```

Substitute the existing button markup, preserving `onClick`, `disabled`, `loading` props. If the existing markup differs from the snippet, **only the gate changes** — don't refactor unrelated parts of the button.

### R-10 — review form gate

Locate the review form JSX around line 553-558. Wrap it in a self-product guard:

```tsx
const isOwnProduct = !!(product?.sellerUserId && userId && product.sellerUserId === userId);

{!isOwnProduct ? (
  <ReviewForm productId={productId} onSubmitted={reload} />
) : (
  <Typography variant="body2" color="text.secondary">
    Bạn không thể tự đánh giá sản phẩm của chính mình.
  </Typography>
)}
```

Match the surrounding MUI Card/panel styling.

## TDD / verify

Frontend has no `npm test`. Verify by:
```bash
cd src/web-app
npm run typecheck
npm run lint
npm run build
```
All three must succeed with zero errors. If `npm install --legacy-peer-deps` hasn't been run in this session, run it first.

## DO NOT COMMIT

Leave changes un-staged on disk.

## Required output

Write full report to `/home/cuongnh/Projects/Seika/.superpowers/sdd/reports/task-8-report.md`:
- Status: DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED
- Files modified (absolute paths)
- Verify commands + exact result lines
- Decisions on the selector pattern (which useAppSelector you used)
- Reply with: status, one-line verify summary (e.g. "typecheck ✓; lint ✓; build ✓"), concerns.