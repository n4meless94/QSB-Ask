---
phase: 02-live-event-qna-and-moderation
plan: 06
subsystem: qna-audience-voting
tags: [nextjs, supabase, postgres-rpc, qna, voting, playwright, vitest]

requires:
  - phase: 02-live-event-qna-and-moderation
    provides: Participant join sessions, approved-only public question reads, and participant Q&A page.
provides:
  - Audience approved-question list with Popular and Recent sorting.
  - Session-bound one-vote action for approved live questions.
  - Database-side vote insert and vote_count maintenance.
  - Regression coverage for approved-only audience visibility.
affects: [phase-02-presenter-view, phase-02-realtime, phase-03-survey-results]

tech-stack:
  added: []
  patterns:
    - Participant vote mutations validate the event-scoped cookie token server-side before calling a service-role RPC.
    - Audience UI receives only the public question DTO and tracks local voted state after successful actions.
    - Public question sorting stays inside the approved-only query boundary.

key-files:
  created:
    - supabase/migrations/202605220203_qna_voting.sql
    - src/lib/qna/voting.ts
    - src/app/join/[joinCode]/qna/vote-actions.ts
    - src/components/qna/AudienceQuestionList.tsx
    - tests/qna/voting.test.ts
    - tests/e2e/audience-qna.spec.ts
  modified:
    - src/app/join/[joinCode]/qna/page.tsx
    - src/lib/qna/public.ts
    - src/lib/supabase/database.types.ts

key-decisions:
  - "Voting uses a service-role-only Postgres RPC after server-side participant token validation so clients never submit trusted participant_session_id values."
  - "The RPC locks the live question, inserts with the existing one-vote unique constraint, and recalculates vote_count from vote rows after a successful insert."
  - "Audience sorting is client-side after loading the safe public question shape, while the server query still filters to live/answered only."

patterns-established:
  - "Participant actions return compact ok/message/result payloads and revalidate the join Q&A path."
  - "Audience controls use radio-style segmented buttons for predictable keyboard and Playwright interaction."
  - "Local Supabase reset remains a required migration verification step when the stack is running."

requirements-completed: [QNA-03, QNA-10, QNA-11]

duration: 19min
completed: 2026-05-26
---

# Phase 02 Plan 06: Audience Voting Summary

**Approved-only audience question list with Popular/Recent sorting and session-bound one-vote behavior**

## Performance

- **Duration:** 19 min
- **Started:** 2026-05-26T06:58:09Z
- **Completed:** 2026-05-26T07:03:32Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Added RED then GREEN unit coverage for session validation, live-only voting, already-voted handling, public status filtering, and sort ordering.
- Added audience E2E coverage for approved-only visibility, Popular/Recent sorting, answered non-votable rows, one-vote UI state, and 360px mobile overflow.
- Added a service-role-only `upvote_question` RPC that inserts vote rows and keeps `questions.vote_count` aligned with unique votes.
- Replaced the static approved-question list on the participant Q&A page with a dedicated audience list component.

## Task Commits

1. **Task 1: Prove voting and audience sorting behavior** - `ea3afa3` (test)
2. **Task 2: Implement atomic upvote helper and action** - `e0ab6ec` (feat)
3. **Task 3: Build audience approved-question list** - `e0ab6ec` (feat)

## Files Created/Modified

- `supabase/migrations/202605220203_qna_voting.sql` - Service-role-only voting RPC with live-question locking and unique-vote count maintenance.
- `src/lib/qna/voting.ts` - Server-only participant vote helper and voted-question lookup.
- `src/app/join/[joinCode]/qna/vote-actions.ts` - Participant vote server action with cookie-token lookup and path revalidation.
- `src/components/qna/AudienceQuestionList.tsx` - Audience list, sort controls, vote buttons, answered state, and empty state.
- `src/app/join/[joinCode]/qna/page.tsx` - Wires approved questions and voted IDs into the audience component.
- `src/lib/qna/public.ts` - Adds Popular/Recent ordering while keeping live/answered status filtering at the query boundary.
- `src/lib/supabase/database.types.ts` - Adds generated-style `upvote_question` RPC typing.
- `tests/qna/voting.test.ts` - Unit coverage for voting and public sorting behavior.
- `tests/e2e/audience-qna.spec.ts` - Audience Q&A interaction and mobile overflow coverage.

## Decisions Made

- Used a service-role-only RPC rather than public RPC execution because the RPC accepts a participant session id; the server helper validates the raw participant token first and then calls the RPC with the trusted session id.
- Kept answered questions visible but non-votable, matching the approved-only public surface while preventing further vote inflation on completed questions.
- Sorted in the client component for immediate mode switching, with server-side defaults still returning approved questions ordered by popularity.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Replaced hidden radio inputs with radio-style buttons**
- **Found during:** Task 3 (Build audience approved-question list)
- **Issue:** The first E2E run timed out because the visually hidden radio input was covered by its label during Playwright `.check()`.
- **Fix:** Replaced the sort fieldset with an accessible `role="radiogroup"` and `role="radio"` buttons.
- **Files modified:** `src/components/qna/AudienceQuestionList.tsx`, `tests/e2e/audience-qna.spec.ts`
- **Verification:** `npm run test:e2e -- tests/e2e/audience-qna.spec.ts`
- **Committed in:** `e0ab6ec`

**2. [Rule 3 - Blocking] Tightened answered-status E2E selector**
- **Found during:** Task 3 (Build audience approved-question list)
- **Issue:** Playwright strict mode matched both the question text and the `Answered` status badge.
- **Fix:** Changed the assertion to exact status-badge text.
- **Files modified:** `tests/e2e/audience-qna.spec.ts`
- **Verification:** `npm run test:e2e -- tests/e2e/audience-qna.spec.ts`
- **Committed in:** `e0ab6ec`

---

**Total deviations:** 2 auto-fixed blocking issues  
**Impact on plan:** Both fixes were interaction/test stability corrections within the planned audience voting UI scope.

## Issues Encountered

- `npm run lint` failed once while Playwright was rotating `test-results`; rerunning lint separately passed.
- `npx supabase db reset` could not run because local Supabase was not running: `supabase start is not running.`

## User Setup Required

None - no external service configuration required. Local Supabase must be started before applying and resetting the new migration locally.

## Verification

- `npm run test -- tests/qna/voting.test.ts` - passed, 5 tests.
- `npm run test:e2e -- tests/e2e/audience-qna.spec.ts` - passed, 2 tests.
- `npm run lint` - passed on rerun.
- `npx supabase db reset` - not run to completion; local Supabase stack was unavailable.

## Next Phase Readiness

Plan 02-07 can use the approved-only public question contract for Presenter View. The presenter surface should not import audience vote controls or staff moderation queue data.

## Self-Check: PASSED

- Created/modified files exist.
- Task commits found: `ea3afa3`, `e0ab6ec`.
- Verification commands passed except local Supabase reset, which is blocked by unavailable local services.

---
*Phase: 02-live-event-qna-and-moderation*
*Completed: 2026-05-26*
