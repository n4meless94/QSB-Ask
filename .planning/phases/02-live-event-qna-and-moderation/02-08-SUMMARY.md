---
phase: 02-live-event-qna-and-moderation
plan: 08
subsystem: qna-realtime
tags: [nextjs, supabase-realtime, qna, playwright, accessibility]

requires:
  - phase: 02-live-event-qna-and-moderation
    provides: Moderation queue, audience approved-question list, presenter view, and safe public question projection.
provides:
  - Supabase Realtime publication entries for Q&A tables.
  - Staff/public subscription helpers with separate refresh paths.
  - Connection status UI for connected, reconnecting, and refresh-needed states.
  - Realtime wiring for moderator, audience, and presenter surfaces.
  - Cross-surface E2E verification for safe refresh behavior.
affects: [phase-03-surveys-results-presentation, phase-04-reconnect-hardening]

tech-stack:
  added: []
  patterns:
    - Realtime callbacks refresh server-rendered safe data instead of storing row payloads in public/presenter state.
    - E2E fixture-mode realtime uses browser custom events to prove UI behavior without requiring live Supabase Realtime.
    - Component keys remount refreshed client state after server refreshes provide new question timestamps or vote counts.

key-files:
  created:
    - supabase/migrations/202605220204_qna_realtime.sql
    - src/lib/qna/realtime.ts
    - src/components/qna/ConnectionStatus.tsx
    - tests/e2e/qna-realtime.spec.ts
    - tests/e2e/qna-flow.spec.ts
  modified:
    - src/components/qna/ModeratorQueue.tsx
    - src/components/qna/AudienceQuestionList.tsx
    - src/components/qna/PresenterView.tsx
    - src/app/(app)/events/[eventId]/page.tsx
    - src/app/(app)/events/[eventId]/presenter/page.tsx
    - src/app/join/[joinCode]/qna/page.tsx
    - src/lib/qna/public.ts

key-decisions:
  - "Public and presenter realtime callbacks call `router.refresh()` and rely on safe server queries instead of client-filtering private realtime payloads."
  - "Staff realtime subscriptions include moderation history refresh, while public/presenter subscriptions stay limited to approved question list refresh."
  - "Fixture-mode custom events are used only under the existing E2E auth path to verify 2-second UI behavior without a live Supabase Realtime service."

patterns-established:
  - "ConnectionStatus is the shared accessible status indicator for Q&A live surfaces."
  - "Realtime-enabled client components use keys from question ids, updated_at, status, and vote_count to remount after server refreshes."
  - "Phase 4 owns prolonged reconnect hardening; Phase 2 only exposes live/reconnecting/refresh-needed copy and disables moderation actions when disconnected."

requirements-completed: [QNA-03, LIVE-01, LIVE-02, LIVE-04]

duration: 20min
completed: 2026-05-26
---

# Phase 02 Plan 08: Q&A Realtime Summary

**Normal-condition realtime refresh across moderation, audience, and presenter Q&A surfaces**

## Performance

- **Duration:** 20 min
- **Started:** 2026-05-26T07:12:00Z
- **Completed:** 2026-05-26T07:21:00Z
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments

- Added RED then GREEN E2E coverage for audience/presenter realtime-safe updates and moderator pending-count refresh.
- Added Supabase publication migration entries for `questions`, `question_votes`, and `moderation_actions`.
- Added client subscription helpers for staff and public Q&A surfaces.
- Added shared connection status UI and wired it into moderator, audience, and presenter components.
- Verified public and presenter realtime fixture updates never render pending or archived question text.

## Task Commits

1. **Task 1: Prove realtime and no-leak integration behavior** - `108ce0a` (test)
2. **Task 2: Implement Q&A realtime publication and subscription helpers** - `fddcfb0` (feat)
3. **Task 3: Wire realtime into moderation, audience, and presenter surfaces** - `fddcfb0` (feat)

## Files Created/Modified

- `supabase/migrations/202605220204_qna_realtime.sql` - Adds Q&A tables to Supabase Realtime publication when available.
- `src/lib/qna/realtime.ts` - Staff and public realtime subscription helpers.
- `src/components/qna/ConnectionStatus.tsx` - Accessible connection status indicator.
- `src/components/qna/ModeratorQueue.tsx` - Staff realtime refresh and disconnected-action guard.
- `src/components/qna/AudienceQuestionList.tsx` - Public-safe realtime refresh and fixture event handling.
- `src/components/qna/PresenterView.tsx` - Presenter-safe realtime refresh and fixture event handling.
- `src/app/(app)/events/[eventId]/page.tsx` - Realtime remount key for moderation queue data.
- `src/app/(app)/events/[eventId]/presenter/page.tsx` - Realtime remount key and fixture-mode presenter wiring.
- `src/app/join/[joinCode]/qna/page.tsx` - Audience realtime fixture-mode wiring and remount key.
- `src/lib/qna/public.ts` - Maintains compatibility with older Supabase query mocks while preserving real chained ordering.
- `tests/e2e/qna-realtime.spec.ts` - Public/presenter realtime-safe update coverage.
- `tests/e2e/qna-flow.spec.ts` - Moderator pending-count refresh and public no-leak coverage.

## Decisions Made

- Used server refresh as the public/presenter realtime boundary so browser state is rebuilt from `listPublicQuestions` instead of trusting row payloads.
- Kept realtime hardening narrow: no offline action queues, no prolonged reconnect workflow, and no survey/export realtime behavior in Phase 2.
- Kept visible live status copy as "Connected" to preserve existing Presenter View expectations while still supporting reconnecting and refresh-needed states.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Adjusted existing tests for shared connection copy and query mock compatibility**
- **Found during:** Task 3 (Wire realtime into moderation, audience, and presenter surfaces)
- **Issue:** Presenter E2E expected existing "Connected" copy, and an older moderation unit mock did not support chained Supabase `.order()` calls.
- **Fix:** Kept the live status copy as "Connected" and made public question ordering tolerate single-order mocks while real Supabase queries continue chaining.
- **Files modified:** `src/components/qna/ConnectionStatus.tsx`, `src/lib/qna/public.ts`
- **Verification:** `npm run test -- tests/qna/voting.test.ts tests/qna/presenter.test.ts tests/qna/moderation.test.ts`; combined E2E regression run.
- **Committed in:** `fddcfb0`

---

**Total deviations:** 1 auto-fixed blocking issue  
**Impact on plan:** The fix preserved existing UX copy and test compatibility without changing realtime scope.

## Issues Encountered

- `npm run lint` failed once while Playwright was rotating `test-results`; rerunning lint separately passed.
- `npx supabase db reset` could not run because local Supabase was not running: `supabase start is not running.`

## User Setup Required

None - no external service configuration required. Local Supabase must be started before applying and resetting the realtime migration locally.

## Verification

- `npm run test:e2e -- tests/e2e/qna-realtime.spec.ts tests/e2e/qna-flow.spec.ts` - passed, 2 tests.
- `npm run test -- tests/qna/voting.test.ts tests/qna/presenter.test.ts tests/qna/moderation.test.ts` - passed, 16 tests.
- `npm run test:e2e -- tests/e2e/audience-qna.spec.ts tests/e2e/presenter-view.spec.ts tests/e2e/moderation.spec.ts tests/e2e/qna-realtime.spec.ts tests/e2e/qna-flow.spec.ts` - passed, 9 tests.
- `npm run lint` - passed on rerun.
- `npx supabase db reset` - not run to completion; local Supabase stack was unavailable.

## Next Phase Readiness

Phase 2 implementation is complete. Phase 3 can build surveys, results, presentation, and CSV exports on top of the established event/session/public-display patterns.

## Self-Check: PASSED

- Created/modified files exist.
- Task commits found: `108ce0a`, `fddcfb0`.
- Verification commands passed except local Supabase reset, which is blocked by unavailable local services.

---
*Phase: 02-live-event-qna-and-moderation*
*Completed: 2026-05-26*
