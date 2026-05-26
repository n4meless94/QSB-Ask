---
phase: 02-live-event-qna-and-moderation
plan: 05
subsystem: qna-moderation
tags: [nextjs, supabase, postgres-rpc, moderation, audit, playwright, vitest]

requires:
  - phase: 02-live-event-qna-and-moderation
    provides: Event workspace role access, participant question submission, and approved-only public question reads.
provides:
  - Staff moderation queue for organiser and moderator roles only.
  - Compare-and-set moderation actions with stale expected status/updated_at handling.
  - Atomic Postgres RPCs for audited status changes and version-preserving edits.
  - Staff-only moderation history panel and E2E fixture coverage.
affects: [phase-02-audience-qna, phase-02-presenter-view, phase-02-realtime]

tech-stack:
  added: []
  patterns:
    - Server-only Q&A moderation helpers call Postgres RPCs for atomic status/action audit writes.
    - Client queue receives staff-safe DTOs from server loaders and never imports server-only helpers.
    - Public question reads remain isolated in the public helper with live/answered status filters.

key-files:
  created:
    - supabase/migrations/202605220202_qna_moderation.sql
    - src/lib/qna/moderation.ts
    - src/lib/qna/moderation-shared.ts
    - src/app/(app)/events/[eventId]/qna-actions.ts
    - src/components/qna/ModeratorQueue.tsx
    - src/components/qna/ModerationHistoryPanel.tsx
    - tests/qna/moderation.test.ts
    - tests/e2e/moderation.spec.ts
  modified:
    - src/app/(app)/events/[eventId]/page.tsx
    - src/components/events/EventWorkspace.tsx
    - src/lib/supabase/database.types.ts

key-decisions:
  - "Moderation state changes and edits use Postgres RPCs so question updates, version rows, and moderation_actions rows happen in one database-side operation."
  - "The moderator queue is role-gated in the Event Workspace; speakers continue to get approved-only Presenter View access without moderation controls."
  - "Client queue components use a client-safe shared DTO/copy module instead of importing server-only moderation helpers."

patterns-established:
  - "Every moderation mutation carries expectedStatus and expectedUpdatedAt and maps empty RPC results to the UI-SPEC stale-state copy."
  - "Archive/dismiss preserve previous_status so restore returns to the correct prior state."
  - "E2E fixtures may use local client state only when gated by the existing qsb_ask_e2e_auth cookie and env fixture path."

requirements-completed: [AUTH-07, QNA-04, QNA-05, QNA-06, QNA-07, QNA-08, QNA-09, QNA-15]

duration: 14min
completed: 2026-05-26
---

# Phase 02 Plan 05: Moderation Queue And Audited Actions Summary

**Race-aware moderation queue with atomic audited state changes and edit version history**

## Performance

- **Duration:** 14 min
- **Started:** 2026-05-26T06:38:33Z
- **Completed:** 2026-05-26T06:52:11Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments

- Added failing then passing unit coverage for approve, dismiss, edit, archive, restore, mark answered, stale-state handling, search/sort, audit behavior, and approved-only public reads.
- Added Postgres RPCs that compare expected status and `updated_at`, lock the target question, update status/text, insert audit rows, and write edit versions atomically.
- Added staff moderation queue UI with Pending/Live/Answered/Archived tabs, search, sorting, edit flow, action success/error states, and staff-only history.
- Wired the Event Workspace Q&A tab to render moderation controls only for organiser/moderator roles.

## Task Commits

1. **Task 1: Prove moderation actions and queue behavior** - `9155bef` (test)
2. **Task 2: Implement compare-and-set moderation helpers and actions** - `cb9aa9f` (feat)
3. **Task 3: Build moderator queue and history UI** - `ac50d13` (feat)

## Files Created/Modified

- `supabase/migrations/202605220202_qna_moderation.sql` - Atomic moderation and edit RPCs plus queue-supporting index.
- `src/lib/qna/moderation.ts` - Server-only queue, history, action, stale-state, and edit helpers.
- `src/lib/qna/moderation-shared.ts` - Client-safe moderation DTOs and stale-state copy.
- `src/app/(app)/events/[eventId]/qna-actions.ts` - Signed-in server actions for moderation queue mutations.
- `src/components/qna/ModeratorQueue.tsx` - Staff queue UI with tabs, search, sort, edit, and actions.
- `src/components/qna/ModerationHistoryPanel.tsx` - Staff-only audit/history display.
- `src/app/(app)/events/[eventId]/page.tsx` - Role-gated moderation data loading and E2E fixture data.
- `src/components/events/EventWorkspace.tsx` - Q&A tab now accepts the moderation panel.
- `src/lib/supabase/database.types.ts` - Added generated-style RPC typings.
- `tests/qna/moderation.test.ts` - Moderation helper/action regression coverage.
- `tests/e2e/moderation.spec.ts` - Queue UI interaction and mobile overflow coverage.

## Decisions Made

- Used database-side RPCs instead of separate client-side update/insert sequences to satisfy first-action-wins and audit atomicity.
- Kept presenter/public data paths separate; Plan 02-05 does not import staff queue payloads into participant or presenter views.
- Split shared moderation types/copy from server-only helpers after the UI build exposed a client/server import boundary.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Split client-safe moderation DTOs from server-only helpers**
- **Found during:** Task 3 (Build moderator queue and history UI)
- **Issue:** The client queue imported `src/lib/qna/moderation.ts` for shared types and stale-state copy, which pulled `server-only` and `next/headers` into the client bundle.
- **Fix:** Added `src/lib/qna/moderation-shared.ts` and re-exported the shared symbols from the server helper for test compatibility.
- **Files modified:** `src/lib/qna/moderation-shared.ts`, `src/lib/qna/moderation.ts`, `src/components/qna/ModeratorQueue.tsx`, `src/components/qna/ModerationHistoryPanel.tsx`
- **Verification:** `npm run test:e2e -- tests/e2e/moderation.spec.ts`; `npm run lint`
- **Committed in:** `ac50d13`

**2. [Rule 3 - Blocking] Tightened E2E selector for edited marker**
- **Found during:** Task 3 (Build moderator queue and history UI)
- **Issue:** Playwright strict mode matched both `Question edited.` status copy and the `Edited` marker.
- **Fix:** Changed the assertion to exact text for the edited marker.
- **Files modified:** `tests/e2e/moderation.spec.ts`
- **Verification:** `npm run test:e2e -- tests/e2e/moderation.spec.ts`
- **Committed in:** `ac50d13`

---

**Total deviations:** 2 auto-fixed blocking issues  
**Impact on plan:** Both fixes were required for the planned UI to compile and verify. No Phase 02-06, 02-07, or 02-08 scope was added.

## Issues Encountered

- `npm run lint` failed once while Playwright was rotating `test-results`; rerunning lint separately passed.
- `npx supabase db reset` could not run because local Supabase was not running: `supabase start is not running.`

## Known Stubs

None.

## Verification

- `npm run test -- tests/qna/moderation.test.ts` - passed, 9 tests.
- `npm run test:e2e -- tests/e2e/moderation.spec.ts` - passed, 2 tests.
- `npm run lint` - passed.
- `npx supabase db reset` - not run to completion; local Supabase stack was unavailable.

## User Setup Required

None - no external service configuration required. Local Supabase must be started before applying and resetting the new migration locally.

## Next Phase Readiness

Plan 02-06 can build participant voting and audience sorting on top of approved-only public reads. Presenter and realtime plans must continue to use public-status-only payloads and must not reuse staff moderation queue data.

## Self-Check: PASSED

- Created/modified files exist.
- Task commits found: `9155bef`, `cb9aa9f`, `ac50d13`.

---
*Phase: 02-live-event-qna-and-moderation*
*Completed: 2026-05-26*
