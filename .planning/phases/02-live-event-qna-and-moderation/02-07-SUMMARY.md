---
phase: 02-live-event-qna-and-moderation
plan: 07
subsystem: qna-presenter-view
tags: [nextjs, presenter-view, qna, access-control, playwright, vitest]

requires:
  - phase: 02-live-event-qna-and-moderation
    provides: Event role access helpers, approved-only public question reads, moderation workflow, and vote counts.
provides:
  - Authenticated Presenter View route for organiser, moderator, and speaker roles.
  - Presenter-safe question helper using live/answered status filters and public fields only.
  - Display-focused Presenter View UI without moderation, submission, access, or participant identity controls.
affects: [phase-02-realtime, phase-03-presentation-survey-results]

tech-stack:
  added: []
  patterns:
    - Presenter data path is separate from moderation helpers and uses the public question projection.
    - Presenter route catches access failures before rendering the display component.
    - Presenter UI uses display-scale rows and local sort controls without exposing management actions.

key-files:
  created:
    - src/lib/qna/presenter.ts
    - src/app/(app)/events/[eventId]/presenter/page.tsx
    - src/components/qna/PresenterView.tsx
    - tests/qna/presenter.test.ts
    - tests/e2e/presenter-view.spec.ts
  modified: []

key-decisions:
  - "Presenter View uses getPresenterEventAccess for organiser, moderator, and speaker roles, then queries only live/answered public question fields."
  - "Presenter E2E fixtures intentionally include no pending or archived rows, and tests assert those known private strings never render."
  - "The route remains in the authenticated app area but renders a display-focused component instead of the Event Workspace management tabs."

patterns-established:
  - "Presenter surfaces must not import moderation queue DTOs or actions."
  - "Presenter denied state uses explicit copy and a dashboard return action."
  - "Presenter sort controls mirror the audience radio-button pattern without vote or moderation actions."

requirements-completed: [AUTH-06, QNA-03, LIVE-03]

duration: 10min
completed: 2026-05-26
---

# Phase 02 Plan 07: Presenter View Summary

**Presenter-safe approved-question display for assigned speakers and staff**

## Performance

- **Duration:** 10 min
- **Started:** 2026-05-26T07:06:24Z
- **Completed:** 2026-05-26T07:09:27Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Added RED then GREEN unit coverage proving presenter access checks and live/answered-only status filtering.
- Added Presenter View E2E coverage for approved question display, vote counts, status labels, access denial, no management controls, and 360px mobile overflow.
- Added `getPresenterQuestions` as a separate presenter-safe data helper rather than reusing moderation data.
- Added authenticated Presenter View route and display-focused UI for approved questions.

## Task Commits

1. **Task 1: Prove presenter access and visibility behavior** - `003935d` (test)
2. **Task 2: Implement presenter helper and route** - `026877e` (feat)
3. **Task 3: Build display-focused Presenter View UI** - `026877e` (feat)

## Files Created/Modified

- `src/lib/qna/presenter.ts` - Presenter access and approved-only question helper.
- `src/app/(app)/events/[eventId]/presenter/page.tsx` - Authenticated presenter route with E2E fixtures and denied state.
- `src/components/qna/PresenterView.tsx` - Display-focused presenter UI with sort controls and readable rows.
- `tests/qna/presenter.test.ts` - Unit coverage for access and safe question projection.
- `tests/e2e/presenter-view.spec.ts` - Presenter display, denial, and mobile overflow coverage.

## Decisions Made

- Kept Presenter View in the protected app route tree for authentication, while rendering a separate display component rather than the Event Workspace shell.
- Used `PUBLIC_QUESTION_STATUSES` directly in the presenter helper to avoid relying on broad event-member question visibility.
- Did not add question highlighting because the plan explicitly kept it out of Phase 2 scope.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Moved JSX construction outside presenter route try/catch**
- **Found during:** Task 2 (Implement presenter helper and route)
- **Issue:** ESLint `react-hooks/error-boundaries` flagged returning JSX from inside a `try` block.
- **Fix:** Assigned the awaited presenter result in the `try/catch`, then returned JSX afterward.
- **Files modified:** `src/app/(app)/events/[eventId]/presenter/page.tsx`
- **Verification:** `npm run lint`
- **Committed in:** `026877e`

---

**Total deviations:** 1 auto-fixed blocking issue  
**Impact on plan:** The fix was a route-structure correction only; presenter behavior and scope stayed unchanged.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Verification

- `npm run test -- tests/qna/presenter.test.ts` - passed, 2 tests.
- `npm run test:e2e -- tests/e2e/presenter-view.spec.ts` - passed, 3 tests.
- `npm run lint` - passed.

## Next Phase Readiness

Plan 02-08 can add realtime subscription behavior across participant, moderator, and presenter surfaces using the approved-only audience/presenter data contracts.

## Self-Check: PASSED

- Created files exist.
- Task commits found: `003935d`, `026877e`.
- Verification commands passed.

---
*Phase: 02-live-event-qna-and-moderation*
*Completed: 2026-05-26*
