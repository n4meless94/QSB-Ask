---
phase: 03-surveys-results-presentation-and-csv
plan: 02
subsystem: participant-surveys
tags: [nextjs, react, supabase, postgres-rpc, surveys, vitest, playwright]

requires:
  - phase: 03-surveys-results-presentation-and-csv
    plan: 01
    provides: Organiser survey authoring, validation helpers, published survey records, and hidden-by-default result visibility.
provides:
  - Session-gated participant survey route under the public join flow.
  - Atomic survey response submission RPC with duplicate-aware response handling.
  - Participant-safe survey loading, answer validation, and visibility-aware completion state.
  - Mobile E2E coverage for hidden results, completed state, duplicate state, draft, and closed surveys.
affects: [survey-results, survey-presentation-view, csv-export]

tech-stack:
  added: []
  patterns:
    - Participant survey writes validate the HTTP-only participant cookie token before calling a service-role RPC.
    - Public survey UI receives participant-safe survey DTOs and visibility state only.
    - Survey submission uses semantic fieldsets with mobile-sized controls outside the authenticated app shell.

key-files:
  created:
    - supabase/migrations/202605300302_survey_submission_rpc.sql
    - src/lib/surveys/participant.ts
    - src/app/join/[joinCode]/surveys/submit-actions.ts
    - src/app/join/[joinCode]/surveys/page.tsx
    - src/components/surveys/SurveySubmitForm.tsx
    - tests/surveys/participant.test.ts
    - tests/db/survey-submission-rpc.test.ts
    - tests/e2e/survey-submission.spec.ts
  modified:
    - src/lib/supabase/database.types.ts

key-decisions:
  - "Participant survey submission uses a service-role-only RPC after app-level participant token validation, so the browser never supplies a trusted participant_session_id."
  - "Participant-facing result handling is limited to visibility/completion state in this slice; charts and aggregation remain later Plan 03 scope."
  - "Draft surveys render as no-open-survey states and closed surveys render disabled closed states, never active response controls."

patterns-established:
  - "Survey answer shape validation happens server-side by question type before the RPC call."
  - "Duplicate survey responses are normalized to the participant-safe copy: You have already submitted this survey."
  - "Public survey E2E fixture mode mirrors the Phase 2 public Q&A fixture pattern."

requirements-completed: [SURV-08, SURV-09]

duration: 12min
completed: 2026-05-30
---

# Phase 03 Plan 02: Participant Survey Submission Summary

**Session-gated participant survey submission with atomic response persistence and hidden-by-default result visibility**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-30T03:15:44Z
- **Completed:** 2026-05-30T03:27:03Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Added `submit_survey_response` as a service-role-only Postgres RPC that inserts one survey response plus answer rows in one database-side operation.
- Added participant survey helpers that validate the event-scoped participant token, load only safe survey DTOs, validate answer shape by question type, and map duplicates to participant-safe copy.
- Added the public `/join/{joinCode}/surveys` route and mobile survey form with published, completed, draft, closed, and hidden-results states.
- Added focused Vitest, migration-text, and Playwright coverage for SURV-08 and SURV-09.

## Task Commits

Each task was committed atomically:

1. **Task 1: Prove participant survey submission behavior** - `e926f0b` (test)
2. **Task 2: Implement atomic participant survey persistence** - `6708328` (feat)
3. **Task 3: Build participant survey route and form** - `b335821` (feat)

**Plan metadata:** pending docs commit

## Files Created/Modified

- `supabase/migrations/202605300302_survey_submission_rpc.sql` - Service-role-only survey response RPC with duplicate handling and answer insertion.
- `src/lib/supabase/database.types.ts` - Generated-style typing for `submit_survey_response`.
- `src/lib/surveys/participant.ts` - Participant-safe survey DTO loading, completion state, answer validation, and RPC submission helper.
- `src/app/join/[joinCode]/surveys/submit-actions.ts` - Server action that reads only the HTTP-only event cookie token and revalidates the public survey route.
- `src/app/join/[joinCode]/surveys/page.tsx` - Public participant survey page with fixture-backed E2E states.
- `src/components/surveys/SurveySubmitForm.tsx` - Semantic mobile-first form for choice, multi-select, rating, and open-text answers.
- `tests/surveys/participant.test.ts` - Unit coverage for token validation, survey states, duplicate handling, hidden results, and cookie trust boundary.
- `tests/db/survey-submission-rpc.test.ts` - Migration-text coverage for RPC, uniqueness, and service-role grants.
- `tests/e2e/survey-submission.spec.ts` - Browser coverage for mobile submission, hidden results, completed/duplicate state, no organiser controls, draft, and closed states.

## Decisions Made

- Used the same service-role RPC pattern as Q&A voting because the trusted participant session id is derived server-side after cookie-token validation.
- Kept participant result output to visibility/completion state only, avoiding results aggregation, presenter charts, and CSV export scope owned by later Phase 3 plans.
- Kept public route fixture behavior environment-gated under `QSB_ASK_E2E_AUTH=1`, matching existing public Q&A test patterns.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Made rating controls directly clickable**
- **Found during:** Task 3 (Build participant survey route and form)
- **Issue:** The first rating-control implementation used visually hidden radios whose label text intercepted Playwright `.check()` interactions.
- **Fix:** Changed rating controls to visible radio inputs inside 44px touch targets.
- **Files modified:** `src/components/surveys/SurveySubmitForm.tsx`
- **Verification:** `npm run test:e2e -- tests/e2e/survey-submission.spec.ts`
- **Committed in:** `b335821`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Interaction fix only; no product scope expansion.

## Issues Encountered

- `npm run lint` failed once while running in parallel with Playwright because ESLint tried to scan `test-results` while Playwright was rotating it. Rerunning lint by itself passed.

## Verification

- `npm test -- tests/surveys/participant.test.ts tests/db/survey-submission-rpc.test.ts` - passed, 8 tests.
- `npm run test:e2e -- tests/e2e/survey-submission.spec.ts` - passed, 2 tests.
- `npm run lint` - passed on isolated rerun.

## Known Stubs

None - no placeholder or unwired participant survey behavior remains in this slice.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 03-03 can build organiser results and participant-visible aggregate results on top of the response/answer records created here. Presenter charts and CSV export remain out of this slice.

## Self-Check: PASSED

- Created/modified files exist.
- Task commits found: `e926f0b`, `6708328`, `b335821`.
- Plan verification passed: focused Vitest, Playwright survey submission spec, and lint.

---
*Phase: 03-surveys-results-presentation-and-csv*
*Completed: 2026-05-30*
