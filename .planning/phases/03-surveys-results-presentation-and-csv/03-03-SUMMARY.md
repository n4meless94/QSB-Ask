---
phase: 03-surveys-results-presentation-and-csv
plan: 03
subsystem: survey-results
tags: [nextjs, react, recharts, supabase, surveys, accessibility]

requires:
  - phase: 03-surveys-results-presentation-and-csv
    plan: 01
    provides: Organiser-authored survey records, question metadata, and result visibility controls.
  - phase: 03-surveys-results-presentation-and-csv
    plan: 02
    provides: Participant survey response and answer records.
provides:
  - Organiser-only survey result aggregation with per-question counts.
  - Recharts bar chart components with visible labels and accessible table alternatives.
  - Open text response list that keeps raw participant tokens and email-like identifiers out of result DTOs.
  - Results tab wiring in the Event Workspace.
affects: [survey-presentation-view, csv-export, participant-visible-results]

tech-stack:
  added: [recharts@3.8.1]
  patterns: [server aggregate DTO boundary, chart plus table accessibility pair, organiser-only result loading]

key-files:
  created:
    - src/lib/surveys/results.ts
    - src/components/surveys/SurveyBarChart.tsx
    - src/components/surveys/OpenTextResponseList.tsx
    - src/components/surveys/SurveyResultsPanel.tsx
  modified:
    - package.json
    - package-lock.json
    - src/app/(app)/events/[eventId]/page.tsx
    - src/lib/surveys/participant.ts
    - tests/surveys/results.test.ts
    - tests/e2e/survey-results.spec.ts

key-decisions:
  - "Result aggregation happens server-side and UI components receive aggregate DTOs rather than raw answer rows."
  - "Charts always ship with adjacent tables using the same data array."
  - "Participant-visible result helpers suppress open text rows and return only surveys whose visibility is enabled."

patterns-established:
  - "Survey result DTOs include chartData, responseCount, and openTextResponses per question."
  - "SurveyBarChart renders Recharts visual bars, a readable list, and a table alternative for each chart."
  - "Results tab data is loaded only for organisers before rendering EventWorkspace panels."

requirements-completed: [SURV-10, SURV-11, SURV-12, SURV-13]

duration: 35min
completed: 2026-05-30
---

# Phase 03 Plan 03: Survey Results Summary

**Organiser survey results with server-side aggregates, Recharts bar charts, accessible tables, and open text data views**

## Performance

- **Duration:** 35 min
- **Started:** 2026-05-30T11:30:00+08:00
- **Completed:** 2026-05-30T11:55:00+08:00
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- Installed the approved Recharts 3.x dependency.
- Added `getOrganiserSurveyResults` and `getParticipantVisibleSurveyResults` as server aggregation boundaries for survey counts, choice/select/rating charts, and open text rows.
- Added `SurveyBarChart`, `OpenTextResponseList`, and `SurveyResultsPanel` for organiser result review.
- Wired the Event Workspace Results tab to organiser-only result data and E2E fixture coverage.

## Task Commits

1. **Task 1: Survey results red coverage** - `be28875` (test)
2. **Task 2: Install Recharts** - `45f5076` (chore)
3. **Task 3: Result aggregation and UI** - this summary commit

**Plan metadata:** `fb5d113` (docs: create phase plan)

## Files Created/Modified

- `src/lib/surveys/results.ts` - Builds organiser and participant-visible result DTOs from surveys, responses, and answers.
- `src/components/surveys/SurveyBarChart.tsx` - Recharts bar chart with labels, percentages, readable list, and table alternative.
- `src/components/surveys/OpenTextResponseList.tsx` - Staff-only open text response display.
- `src/components/surveys/SurveyResultsPanel.tsx` - Organiser Results tab surface with response counts, visibility control, and presentation link.
- `src/app/(app)/events/[eventId]/page.tsx` - Loads organiser result DTOs and provides deterministic E2E fixtures.
- `src/lib/surveys/participant.ts` - Tightened rating validation type narrowing discovered during typecheck.
- `tests/surveys/results.test.ts` - Aggregation and chart/table tests.
- `tests/e2e/survey-results.spec.ts` - Results tab E2E coverage and mobile overflow check.
- `package.json` and `package-lock.json` - Recharts dependency.

## Decisions Made

- Multiple-select percentages use the count of responses that answered that question as denominator, so each option can independently reach 100%.
- Open text responses are labelled generically as `Response N`; participant tokens, token hashes, and email-like identifiers are not included in result DTOs.
- Participant-visible result helpers reuse the same aggregate builder but filter to published/closed surveys with visibility enabled and omit open text rows.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Scoped E2E assertions to avoid duplicate result labels**
- **Found during:** Results E2E verification.
- **Issue:** `3 responses` and `Results visible` appear in multiple accessible places, causing strict locator collisions.
- **Fix:** Scoped selectors to the survey summary or visible badge.
- **Files modified:** `tests/e2e/survey-results.spec.ts`
- **Verification:** `CI='' npm run test:e2e -- tests/e2e/survey-results.spec.ts` passed.
- **Committed in:** this summary commit.

**2. [Rule 3 - Blocking] Narrowed participant rating validation type**
- **Found during:** `npx tsc --noEmit`.
- **Issue:** `ratingValue` could be undefined in the participant survey validation helper.
- **Fix:** Added an explicit `typeof ratingValue !== "number"` guard before integer and range checks.
- **Files modified:** `src/lib/surveys/participant.ts`
- **Verification:** `npm test -- tests/surveys/participant.test.ts tests/surveys/results.test.ts` passed.
- **Committed in:** this summary commit.

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes preserve planned behavior and reduce verification noise.

## Issues Encountered

- The 03-03 executor stalled after committing dependency and red coverage, so final implementation, fixes, verification, and summary were completed locally.
- `npm run lint` failed once while running in parallel with Playwright because ESLint scanned `test-results` while Playwright was rotating it. Rerunning lint by itself passed.
- `npx tsc --noEmit` remains blocked by pre-existing form-action return type errors in `EventAccessPanel.tsx` and `EventSettingsPanel.tsx`; survey-owned type errors found during this plan were fixed.

## Verification

- `npm ls recharts` - passed, `recharts@3.8.1`.
- `npx vitest run tests/surveys/results.test.ts --reporter=verbose --testTimeout=10000 --hookTimeout=10000` - passed, 6 tests.
- `npm test -- tests/surveys/participant.test.ts tests/surveys/results.test.ts` - passed, 11 tests.
- `CI='' npm run test:e2e -- tests/e2e/survey-results.spec.ts` - passed, 2 tests.
- `npm run lint` - passed on isolated rerun.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 03-04 can reuse `SurveyResult` DTOs and the chart/table components for presentation-oriented survey views. Plan 03-05 can reuse the same aggregate helper for CSV exports.

---
*Phase: 03-surveys-results-presentation-and-csv*
*Completed: 2026-05-30*
