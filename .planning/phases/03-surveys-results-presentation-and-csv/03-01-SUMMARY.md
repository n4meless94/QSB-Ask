---
phase: 03-surveys-results-presentation-and-csv
plan: 01
subsystem: ui
tags: [nextjs, react, supabase, surveys, vitest, playwright]

requires:
  - phase: 02-live-event-qna-and-moderation
    provides: Event Workspace shell, role-gated event access, and Q&A moderation patterns reused for survey authoring.
provides:
  - Organiser-only survey lifecycle helpers for draft, save, publish, close, and result visibility.
  - Survey authoring panels in the Event Workspace for list, editor, lifecycle controls, and validation feedback.
  - Focused unit and E2E coverage for SURV-01 through SURV-07.
affects: [participant-surveys, survey-results, presentation-view, csv-export]

tech-stack:
  added: []
  patterns: [server-guarded survey domain helpers, useActionState survey forms, event workspace feature tabs]

key-files:
  created:
    - src/lib/surveys/validation.ts
    - src/lib/surveys/management.ts
    - src/components/surveys/SurveyList.tsx
    - src/components/surveys/SurveyEditor.tsx
  modified:
    - src/app/(app)/events/[eventId]/survey-actions.ts
    - src/app/(app)/events/[eventId]/page.tsx
    - src/components/events/EventWorkspace.tsx
    - tests/surveys/management.test.ts
    - tests/e2e/surveys-management.spec.ts
    - next.config.ts

key-decisions:
  - "Survey authoring data is loaded only for organisers; non-organisers receive an access-denied panel."
  - "Publish validation reuses the same server-side draft normalization used by save, with stricter question-count checks."
  - "Result visibility remains hidden by default and is changed through an organiser-only server action."

patterns-established:
  - "Survey helpers call assertEventRole with EVENT_MANAGEMENT_ROLES before every list or mutation path."
  - "Survey forms keep optimistic client editing local but submit all lifecycle changes through server actions."
  - "EventWorkspace now accepts explicit panels for Q&A, Surveys, Results, Exports, Access, Settings, and Presenter."

requirements-completed: [SURV-01, SURV-02, SURV-03, SURV-04, SURV-05, SURV-06, SURV-07]

duration: 1h 10min
completed: 2026-05-30
---

# Phase 03 Plan 01: Survey Authoring Summary

**Organiser-only survey authoring with lifecycle validation, hidden-by-default results visibility, and Event Workspace survey tabs**

## Performance

- **Duration:** 1h 10min
- **Started:** 2026-05-30T10:01:00+08:00
- **Completed:** 2026-05-30T11:11:00+08:00
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments

- Added survey validation and management helpers covering create, save draft, publish, close, visibility, question persistence, and option persistence.
- Added the Surveys, Results, and Exports Event Workspace tabs, with organiser-only survey authoring and non-organiser access-denied copy.
- Added Survey List and Survey Editor UI with draft creation, status badge, validation summary, question authoring, publish/save/close controls, and result visibility toggle.
- Added focused Vitest coverage for organiser gating and lifecycle validation plus Playwright coverage for organiser/non-organiser UI and 360px overflow.

## Task Commits

1. **Task 1: Survey management red coverage** - `bb9d80e` (test)
2. **Task 2: Survey management helpers and actions** - `265738a` (feat)
3. **Task 3: Workspace authoring UI, E2E coverage, and summary** - this summary commit

**Plan metadata:** `fb5d113` (docs: create phase plan)

## Files Created/Modified

- `src/lib/surveys/validation.ts` - Pure draft normalization and save/publish validation.
- `src/lib/surveys/management.ts` - Organiser-guarded survey lifecycle and question persistence helpers.
- `src/app/(app)/events/[eventId]/survey-actions.ts` - Server actions for survey lifecycle forms.
- `src/components/surveys/SurveyList.tsx` - Organiser survey list and create-draft form.
- `src/components/surveys/SurveyEditor.tsx` - Survey editor, validation feedback, lifecycle controls, and visibility toggle.
- `src/components/events/EventWorkspace.tsx` - Event Workspace tab expansion for Surveys, Results, Exports, Access, Settings, and Presenter.
- `src/app/(app)/events/[eventId]/page.tsx` - Survey data loading and role-gated panels.
- `tests/surveys/management.test.ts` - Survey lifecycle and validation unit coverage.
- `tests/e2e/surveys-management.spec.ts` - Event Workspace survey authoring and access coverage.
- `next.config.ts` - Pins Turbopack root to the project directory for local dev server stability in this workspace.

## Decisions Made

- Replaced survey questions on draft save rather than patching individual rows, matching the current schema and keeping ordering deterministic for the MVP.
- Kept Results and Exports tabs as reserved panels in this slice so the workspace navigation is stable before later slices fill them.
- Used E2E fixture event IDs to exercise organiser, moderator, and speaker visibility without requiring external Supabase state.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added Turbopack root pin for local verification**
- **Found during:** E2E verification.
- **Issue:** Local Next dev verification in the OneDrive workspace needed an explicit project root to avoid workspace-root ambiguity.
- **Fix:** Added `turbopack.root` in `next.config.ts`.
- **Files modified:** `next.config.ts`
- **Verification:** `CI='' npm run test:e2e -- tests/e2e/surveys-management.spec.ts` passed.
- **Committed in:** this summary commit.

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Verification support only; no product scope change.

## Issues Encountered

- The initial executor stalled after committing server-side helpers, so the workspace UI, verification fixes, and summary were completed locally in the main rollout.
- The first E2E run failed before tests because port `127.0.0.1:3000` was already occupied by the same app's dev server. Rerunning with `CI` cleared reused the existing server and passed.
- `npx tsc --noEmit` is still blocked by pre-existing form-action return type errors in `EventAccessPanel.tsx` and `EventSettingsPanel.tsx`; survey-owned TypeScript errors found during this slice were fixed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 03-02 can build participant survey submission on top of the existing survey tables and the new organiser-authored survey records. Results, presentation, and CSV slices can rely on the new workspace tabs and SurveySummary shape.

---
*Phase: 03-surveys-results-presentation-and-csv*
*Completed: 2026-05-30*
