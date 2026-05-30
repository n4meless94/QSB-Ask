---
phase: 03-surveys-results-presentation-and-csv
plan: 04
subsystem: survey-presentation
tags: [nextjs, react, supabase-realtime, surveys, presentation, accessibility]

requires:
  - phase: 03-surveys-results-presentation-and-csv
    plan: 02
    provides: Participant survey submission and response persistence.
  - phase: 03-surveys-results-presentation-and-csv
    plan: 03
    provides: Survey aggregate DTOs and chart/table result components.
provides:
  - Survey Realtime publication coverage for survey tables.
  - Browser subscription helper for survey result refresh triggers.
  - Presenter-gated survey presentation route with aggregate-only result rendering.
  - Participant completion state that shows aggregate result charts only when organiser visibility is enabled.
affects: [phase-03-csv-export, phase-04-reconnect-hardening, survey-results]

tech-stack:
  added: []
  patterns: [realtime refresh trigger only, presenter access before aggregate load, participant-visible aggregate gating]

key-files:
  created:
    - supabase/migrations/202605300304_survey_realtime.sql
    - src/lib/surveys/realtime.ts
    - src/app/(app)/events/[eventId]/presentation/surveys/[surveyId]/page.tsx
    - src/components/surveys/SurveyPresentationView.tsx
    - tests/db/survey-realtime.test.ts
    - tests/e2e/survey-presentation.spec.ts
    - tests/surveys/realtime.test.ts
  modified:
    - src/lib/surveys/results.ts
    - src/app/join/[joinCode]/surveys/page.tsx
    - src/components/surveys/SurveySubmitForm.tsx
    - tests/surveys/results.test.ts

key-decisions:
  - "Survey realtime events are refresh triggers only; presentation UI reloads safe server aggregate DTOs instead of rendering payload rows."
  - "Presentation results use getPresenterEventAccess before loading aggregate survey data."
  - "Participant result charts render only after completion when results_visible_to_participants is enabled."

patterns-established:
  - "subscribeToSurveyResults mirrors Q&A connection states: live, reconnecting, refresh-needed."
  - "SurveyPresentationView owns fixture refresh state for E2E but uses router.refresh for production realtime callbacks."
  - "Participant-visible results reuse SurveyResult DTOs and suppress open text rows from public rendering."

requirements-completed: [LIVE-05, SURV-09, SURV-13]

duration: 11min
completed: 2026-05-30
---

# Phase 03 Plan 04: Survey Presentation And Realtime Summary

**Survey presentation view with Supabase Realtime refresh triggers and organiser-gated participant result visibility**

## Performance

- **Duration:** 11 min
- **Started:** 2026-05-30T03:55:36Z
- **Completed:** 2026-05-30T04:06:17Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments

- Added idempotent Supabase Realtime publication entries for `surveys`, `survey_responses`, and `survey_answers`.
- Added `subscribeToSurveyResults` with the same connection-state model as Q&A and refresh-only payload handling.
- Added presenter-gated survey presentation route and `SurveyPresentationView` with charts, tables, response count, zero-response state, and fixture-mode 2-second refresh coverage.
- Extended participant survey completion UI to show aggregate charts only when participant result visibility is enabled.

## Task Commits

1. **Task 1: Prove survey presentation and realtime-safe visibility behavior** - `dde7684` (test)
2. **Task 2 RED: Prove helper-level realtime and presentation aggregate behavior** - `83fd691` (test)
3. **Task 2 GREEN: Implement survey realtime publication and aggregate visibility helpers** - `e86136f` (feat)
4. **Task 3: Build survey presentation view and participant visible-results state** - `f103611` (feat)

**Plan metadata:** pending final docs commit.

## Files Created/Modified

- `supabase/migrations/202605300304_survey_realtime.sql` - Adds survey tables to `supabase_realtime` idempotently.
- `src/lib/surveys/realtime.ts` - Provides survey result realtime subscriptions as refresh triggers.
- `src/lib/surveys/results.ts` - Adds presenter-gated `getPresentationSurveyResults`.
- `src/app/(app)/events/[eventId]/presentation/surveys/[surveyId]/page.tsx` - Adds authenticated survey presentation route.
- `src/components/surveys/SurveyPresentationView.tsx` - Renders display-focused aggregate survey charts and connection state.
- `src/app/join/[joinCode]/surveys/page.tsx` - Loads participant-visible aggregate results when allowed.
- `src/components/surveys/SurveySubmitForm.tsx` - Renders participant aggregate charts after completion when visible.
- `tests/db/survey-realtime.test.ts` - Verifies survey Realtime publication migration text and Q&A publication preservation.
- `tests/surveys/realtime.test.ts` - Verifies subscription filters and refresh callbacks.
- `tests/surveys/results.test.ts` - Verifies presentation aggregate helper access and DTO safety.
- `tests/e2e/survey-presentation.spec.ts` - Verifies presentation UI, fixture refresh, visibility gating, and private-data exclusions.

## Decisions Made

- Survey Realtime subscriptions intentionally refresh from the server and do not inspect or render raw realtime row payloads.
- Presentation aggregate loading uses presenter/staff access rules, while organiser-only result editing and CSV/export controls stay out of the presentation route.
- Participant-visible charts are rendered only in the completed state and only when the organiser visibility flag allows it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Stabilized presentation E2E fixture assertions**
- **Found during:** Task 3 verification.
- **Issue:** Response-count text appears in both summary and per-question chart regions, and fixture refresh could fire before the client listener mounted.
- **Fix:** Scoped duplicate text assertions and added a fixture-only readiness marker before dispatching the refresh event.
- **Files modified:** `tests/e2e/survey-presentation.spec.ts`, `src/components/surveys/SurveyPresentationView.tsx`
- **Verification:** `npm run test:e2e -- tests/e2e/survey-presentation.spec.ts tests/e2e/survey-submission.spec.ts` passed.
- **Committed in:** `f103611`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** No scope expansion; the fix made the planned realtime fixture proof deterministic.

## Issues Encountered

- `npm run lint` failed once while running in parallel with Playwright because ESLint scanned `test-results` while Playwright was rotating it. Rerunning lint by itself passed.

## Verification

- `npm test -- tests/db/survey-realtime.test.ts tests/surveys/realtime.test.ts tests/surveys/results.test.ts` - passed, 10 tests.
- `npm test -- tests/db/survey-realtime.test.ts tests/surveys/results.test.ts` - passed, 9 tests.
- `npm run test:e2e -- tests/e2e/survey-presentation.spec.ts tests/e2e/survey-submission.spec.ts` - passed, 5 tests.
- `npm run lint` - passed on isolated rerun.

## Known Stubs

None.

## Threat Flags

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 03-05 can build CSV exports on top of the same survey response tables and aggregate boundaries. Phase 4 should handle prolonged reconnect hardening beyond the normal-condition refresh behavior completed here.

## Self-Check: PASSED

- Created/modified files listed in this summary exist on disk.
- Task commits found: `dde7684`, `83fd691`, `e86136f`, `f103611`.

---
*Phase: 03-surveys-results-presentation-and-csv*
*Completed: 2026-05-30*
