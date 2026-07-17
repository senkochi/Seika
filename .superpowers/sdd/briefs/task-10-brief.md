# Task 10 — Roll back Vietnamese→English regression in Marketplace.tsx

## Where this fits

Task 10 of 10. Plan: `/home/cuongnh/Projects/Seika/docs/superpowers/plans/2026-07-17-teacher-tiered-economy-v3-remediation.md`. Tasks 1-9 are complete.

## Goal

Restore pre-`e44fec1` Vietnamese strings on the student marketplace UI that the "Fix UI bugs" commit silently converted to English. The project (per CLAUDE.md) commits to a Vietnamese UI.

## Read these files first

- `/home/cuongnh/Projects/Seika/src/web-app/src/pages/student/Marketplace.tsx` lines ~135-195 — current English strings.
- Run `git log -p -1 e44fec1 -- src/web-app/src/pages/student/Marketplace.tsx | head -200` to see what the file looked like before commit `e44fec1`. You can also do `git show e44fec1^:src/web-app/src/pages/student/Marketplace.tsx | sed -n '135,195p'` to read the file at the previous commit.
- Check `/home/cuongnh/Projects/Seika/CLAUDE.md` for the Vietnamese-UI commitment.

## What the regression is

The review identified strings like "Browse teacher-made flashcard decks...", "Refresh", "Not enough coins..." on lines ~139-189 that previously existed in Vietnamese. The audit only required diacritic fixes on the teacher wallet screens, not English conversions on the student marketplace — this regression was likely unintended.

## What the fix must do

Replace each English string in `Marketplace.tsx` lines ~135-195 with the Vietnamese version that existed before commit `e44fec1`. **Read the pre-`e44fec1` version of the file first** to get the exact original wording — don't invent translations.

If the implementer is uncertain about the original wording for any specific string, **STOP and ask** rather than guess. There are many valid Vietnamese phrasings; the user knows which one was there before.

## DO NOT COMMIT

Leave changes un-staged on disk.

## Verify

```bash
cd src/web-app
npm run typecheck
npm run lint
npm run build
```
All three must succeed.

## Required output

Write full report to `/home/cuongnh/Projects/Seika/.superpowers/sdd/reports/task-10-report.md`:
- Status: DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED
- Files modified (absolute paths)
- Each English→Vietnamese replacement (line by line, with original and new wording)
- Verify commands + exact result lines
- Reply with: status, one-line verify summary, concerns.