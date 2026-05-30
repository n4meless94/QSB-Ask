---
phase: 04-hardening-deployment-and-uat
plan: 01
subsystem: live-reconnect-hardening
tags: [nextjs, react, supabase-realtime, qna, surveys, accessibility, playwright]

requires:
  - phase: 02-live-event-qna-and-moderation
    plan: 08
    provides: Q&A realtime refresh-trigger helpers and shared ConnectionStatus UI.
  - phase: 03-surveys-results-presentation-and-csv
    plan: 04
    provides: Survey presentation realtime refresh-trigger helper and aggregate-only presentation UI.
provides:
  - Offline connection state for Q&A and survey realtime helpers.
  - Prolonged reconnect escalation to refresh-needed after a 30-second default timeout.
  - Keyboard-operable Refresh view action for refresh-needed live surfaces.
  - Cleanup for reconnect timers, browser online/offline listeners, polling intervals, and realtime channels.
  - Focused unit and E2E coverage for safe refresh-trigger-only behavior.
affects: [live-qna, survey-presentation, phase-04-uat]

tech-stack:
  added: []
  patterns:
    - Realtime callbacks remain refresh triggers only and do not render raw Supabase payloads.
    - Browser offline state is surfaced separately from Supabase reconnecting state.
    - Refresh-needed is an actionable user state with a page refresh boundary.

key-files:
  created:
    - tests/qna/realtime.test.ts
  modified:
    - src/lib/qna/realtime.ts
    - src/lib/surveys/realtime.ts
    - src/components/qna/ConnectionStatus.tsx
    - src/components/qna/AudienceQuestionList.tsx
    - src/components/qna/ModeratorQueue.tsx
    - src/components/qna/PresenterView.tsx
    - src/components/surveys/SurveyPresentationView.tsx
    - tests/surveys/realtime.test.ts
    - tests/e2e/qna-realtime.spec.ts
    - tests/e2e/survey-presentation.spec.ts

key-decisions:
  - "Prolonged reconnect escalation defaults to 30 seconds and remains test-overridable through subscription options."
  - "Offline moderator controls are disabled only when the browser is offline; realtime reconnect warnings do not block normal HTTP actions."
  - "E2E fixture connection events carry state only; raw payload details are ignored and never rendered."

patterns-established:
  - "Q&A and survey realtime helpers register browser online/offline listeners and clear reconnect timers on cleanup."
  - "ConnectionStatus is a compact banner with state-specific copy, aria-live status text, and an optional Refresh view button."
  - "Fixture-mode live surfaces can simulate connection states without bypassing safe server-refresh boundaries."

requirements-completed: [LIVE-06]

duration: 10min
completed: 2026-05-30
---

# Phase 04 Plan 01: Reconnect Hardening Summary

**Live Q&A and survey presentation now surface offline, reconnecting, and refresh-needed states with safe manual refresh actions**

## Performance

- **Duration:** 10 min
- **Started:** 2026-05-30T12:53:00+08:00
- **Completed:** 2026-05-30T13:03:05+08:00
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments

- Added Q&A and survey helper support for `offline`, delayed `refresh-needed`, and online recovery.
- Upgraded `ConnectionStatus` from a badge to a compact banner with exact LIVE-06 copy and a keyboard-focusable `Refresh view` button.
- Wired refresh actions into audience, moderator, presenter, and survey presentation surfaces through `router.refresh()`.
- Kept realtime payloads as refresh triggers only and added E2E assertions that raw fixture payload values are not rendered.

## Task Commits

The user requested a single atomic commit for this plan:

1. **Plan 04-01 reconnect hardening** - pending final commit (`feat(04): harden live reconnect states`)

## Files Created/Modified

- `src/lib/qna/realtime.ts` - Adds offline state, delayed reconnect escalation, test timeout override, and listener/timer cleanup for Q&A subscriptions.
- `src/lib/surveys/realtime.ts` - Adds the same connection hardening while preserving survey result polling cleanup.
- `src/components/qna/ConnectionStatus.tsx` - Renders state-specific accessible banner copy and `Refresh view`.
- `src/components/qna/AudienceQuestionList.tsx` - Wires refresh-needed action and fixture connection-state events.
- `src/components/qna/ModeratorQueue.tsx` - Wires refresh-needed action, fixture connection-state events, and offline-only action disabling.
- `src/components/qna/PresenterView.tsx` - Wires refresh-needed action and fixture connection-state events.
- `src/components/surveys/SurveyPresentationView.tsx` - Wires refresh-needed action and fixture connection-state events.
- `tests/qna/realtime.test.ts` - Adds Q&A realtime hardening coverage.
- `tests/surveys/realtime.test.ts` - Extends survey realtime hardening coverage.
- `tests/e2e/qna-realtime.spec.ts` - Verifies Q&A offline/refresh-needed UI and raw-payload safety.
- `tests/e2e/survey-presentation.spec.ts` - Verifies survey presentation offline/refresh-needed UI and raw-payload safety.

## Decisions Made

- `CHANNEL_ERROR`, `TIMED_OUT`, and `CLOSED` all enter `reconnecting` first, then escalate to `refresh-needed` only after the prolonged reconnect timeout.
- Browser `offline` clears any reconnect timer and shows explicit offline copy; `online` re-enters reconnecting until Supabase reports `SUBSCRIBED`.
- Refresh actions use page/server refresh boundaries only; no offline queues or client-side raw payload rendering were added.

## Deviations from Plan

None - plan executed within the requested reconnect-hardening scope.

## Issues Encountered

- `.planning/STATE.md` prose is stale, but structured `gsd-sdk query init.execute-phase` correctly identified Phase 4 Plan 04-01 as the first incomplete plan.
- The working tree already contained unrelated Phase 4/deployment changes outside this plan scope; they were left untouched and were not staged.

## User Setup Required

None - no external service configuration required.

## Verification

- `npm test -- tests/qna/realtime.test.ts tests/surveys/realtime.test.ts` - passed, 9 tests.
- `npm run test:e2e -- tests/e2e/qna-realtime.spec.ts tests/e2e/survey-presentation.spec.ts` - passed, 6 tests.
- `npm run lint` - passed.

## Next Phase Readiness

LIVE-06 reconnect hardening is ready for the remaining Phase 4 deployment and UAT plans. Hosted Supabase latency still belongs in UAT evidence rather than local fixture tests.

## Self-Check: PASSED

- Created/modified files listed in this summary exist on disk.
- Focused verification commands requested by the user passed.
- No offline mutation queue or raw realtime payload rendering was introduced.

---
*Phase: 04-hardening-deployment-and-uat*
*Completed: 2026-05-30*
