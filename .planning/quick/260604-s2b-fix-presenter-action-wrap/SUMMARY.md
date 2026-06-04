---
quick_id: 260604-s2b
status: complete
completed_at: 2026-06-04
---

# Fix Presenter Action Wrap Summary

## What Changed

- Matched the "Open Presenter View" action typography and padding to the compact event action style used by "Copy join details".
- Added `whitespace-nowrap` and a non-shrinking icon so the presenter action remains one line in the right-side access panel.
- Added a Playwright regression check that confirms the presenter link stays nowrap and matches the copy button height.

## Files Changed

- `src/components/events/EventWorkspace.tsx`
- `tests/e2e/event-workspace.spec.ts`

## Verification

- `npm run lint`
- `npm run test:e2e -- tests/e2e/event-workspace.spec.ts`
