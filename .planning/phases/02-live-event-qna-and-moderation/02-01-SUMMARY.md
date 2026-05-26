---
phase: 02-live-event-qna-and-moderation
plan: 01
subsystem: auth-ui
tags: [nextjs, supabase, rls, server-actions, playwright, vitest]

requires:
  - phase: 01-foundation-auth-and-data
    provides: Authenticated app shell, Supabase server client, event schema, RLS role constants, and event dashboard route entry.
provides:
  - Server-side event role assertions for organiser, moderator, and speaker access.
  - Organiser-only member listing, invited moderator/speaker records, and removal-by-status update.
  - Event Workspace shell with Q&A, Access, Settings, and Presenter tabs.
  - Access Management panel with manual onboarding copy and protected original organiser state.
affects: [phase-02-qna, phase-02-moderation, phase-02-presenter, phase-02-settings]

tech-stack:
  added: []
  patterns:
    - Server-only event access helpers using createSupabaseServerClient.
    - Server actions as thin signed-in-user wrappers around role-enforced helpers.
    - Client workspace shell receiving server-rendered role-specific panels.

key-files:
  created:
    - src/lib/events/access.ts
    - src/app/(app)/events/[eventId]/access-actions.ts
    - src/components/events/EventWorkspace.tsx
    - src/components/events/EventAccessPanel.tsx
  modified:
    - src/app/(app)/events/[eventId]/page.tsx
    - tests/events/event-access.test.ts
    - tests/e2e/event-workspace.spec.ts

key-decisions:
  - "Invite flow creates pending event_members rows only; UI and action copy explicitly say manual account onboarding, not email delivery."
  - "Presenter and moderator access helpers are separate server-side entry points so later surfaces do not rely on client-side role filtering."
  - "Q&A, settings, and presenter tab content remains limited to honest later-plan panels in Plan 02-01."

patterns-established:
  - "Access checks re-check returned membership roles in application code after the Supabase role filter."
  - "Original organiser removal is blocked by comparing event.created_by with the target organiser membership."
  - "E2E auth fixture renders deterministic workspace/member data without weakening production auth paths."

requirements-completed: [AUTH-05, AUTH-06, AUTH-07]

duration: 28min
completed: 2026-05-26
---

# Phase 02 Plan 01: Event Workspace Access Summary

**Server-enforced staff role access with organiser member management and an authenticated Event Workspace shell**

## Performance

- **Duration:** 28 min
- **Started:** 2026-05-26T00:39:00Z
- **Completed:** 2026-05-26T01:07:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Added `assertEventRole`, organiser member listing, invite, remove, presenter access, and moderator access helpers in a server-only module.
- Added server actions for invite/remove flows that resolve the signed-in Supabase user server-side and never trust client-supplied role context.
- Replaced the Phase 1 event-detail deferral with a role-aware Event Workspace shell and organiser-only Access panel.
- Preserved Phase 2 safety boundaries: no public/presenter pending-question data, no email-delivery claim, and no later-plan moderation/realtime behavior.

## Task Commits

1. **Task 1: Prove role helper and workspace access behavior** - `4f7096f` (test)
2. **Task 2: Implement event role helpers and access actions** - `4983bbc` (feat)
3. **Task 3: Replace event detail deferral with workspace access UI** - `c27da9e` (feat)

## Files Created/Modified

- `src/lib/events/access.ts` - Server-only role assertion, member list, invite, remove, presenter, and moderator helpers.
- `src/app/(app)/events/[eventId]/access-actions.ts` - Signed-in-user server actions for member invite/remove.
- `src/app/(app)/events/[eventId]/page.tsx` - Event Workspace route using server-side role checks, access-denied handling, and E2E fixture data.
- `src/components/events/EventWorkspace.tsx` - Workspace header, join code/link copy, Presenter action, and tab shell.
- `src/components/events/EventAccessPanel.tsx` - Organiser invite form, member rows, role/status badges, protected owner state, and remove controls.
- `tests/events/event-access.test.ts` - Focused role/access helper and action coverage from the RED commit.
- `tests/e2e/event-workspace.spec.ts` - Workspace tab, Access panel, and mobile no-overflow coverage with tightened selectors.

## Decisions Made

- Pending moderator/speaker access is represented as `event_members.status = invited` with `invited_email`; no email delivery is implied.
- Organiser-only member management is enforced in helpers before any list, insert, or update operation.
- Later Phase 2 areas remain visible as workspace tabs but only render explicit later-plan panels until their owned plans implement real behavior.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Re-checked returned member role after the Supabase filter**
- **Found during:** Task 2 (Implement event role helpers and access actions)
- **Issue:** The helper initially trusted the Supabase `.in("role", allowedRoles)` filter. The focused mock returned a broader active row, which would have allowed role confusion if a data-layer query were widened.
- **Fix:** `assertEventRole` now requires `status === "active"` and `allowedRoles.includes(member.role)` before returning access.
- **Files modified:** `src/lib/events/access.ts`
- **Verification:** `npm run test -- tests/events/event-access.test.ts`
- **Committed in:** `4983bbc`

**2. [Rule 3 - Blocking] Tightened E2E selectors from the RED test**
- **Found during:** Task 3 (Replace event detail deferral with workspace access UI)
- **Issue:** Playwright strict mode found duplicated text for the join code, organiser email, and original organiser label; the role-option assertion also used the wrong matcher shape for options.
- **Fix:** Scoped/exact selectors and read role option values through `evaluateAll`.
- **Files modified:** `tests/e2e/event-workspace.spec.ts`
- **Verification:** `npm run test:e2e -- tests/e2e/event-workspace.spec.ts`
- **Committed in:** `c27da9e`

**3. [Rule 1 - Bug] Restored cookie-scoped E2E auth fixture on event workspace route**
- **Found during:** Parent review after subagent execution
- **Issue:** The event detail route used `QSB_ASK_E2E_AUTH=1` without also requiring the E2E auth cookie, recreating the prior global-auth-bypass risk that Phase 1 had already fixed.
- **Fix:** The route now uses `isE2EAuthEnabled(cookie)` and the E2E suite includes a no-cookie redirect regression.
- **Files modified:** `src/app/(app)/events/[eventId]/page.tsx`, `tests/e2e/event-workspace.spec.ts`
- **Verification:** `npm run test -- tests/events/event-access.test.ts`; `npm run test:e2e -- tests/e2e/event-workspace.spec.ts`; `npm run lint`
- **Committed in:** follow-up parent fix

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking test correction)  
**Impact on plan:** Fixes tightened verification, auth fixture isolation, and role separation. No later Phase 2 scope was added.

## Issues Encountered

- Running `npm run lint` concurrently with Playwright once hit an ESLint `ENOENT` while Playwright rotated `test-results`. Rerunning lint by itself passed.

## Known Stubs

| File | Line | Reason |
|------|------|--------|
| `src/components/events/EventWorkspace.tsx` | 126 | Q&A workspace content is owned by later Phase 2 Q&A/moderation plans. |
| `src/components/events/EventWorkspace.tsx` | 133 | Event lifecycle/settings editing is owned by the settings lifecycle plan. |
| `src/components/events/EventWorkspace.tsx` | 139 | Presenter display data is owned by the presenter plan. |

These stubs are intentional scope boundaries and do not block Plan 02-01's access-management goal.

## Verification

- `npm run test -- tests/events/event-access.test.ts` - passed, 5 tests.
- `npm run test:e2e -- tests/e2e/event-workspace.spec.ts` - passed, 3 tests.
- `npm run lint` - passed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 2 can now build settings, participant join, moderation, and presenter surfaces on explicit server-side role helpers. Later public/presenter plans must continue querying only public-safe question statuses and must not reuse staff moderation data payloads.

## Self-Check: PASSED

- Created/modified files exist.
- Task commits found: `4f7096f`, `4983bbc`, `c27da9e`.

---
*Phase: 02-live-event-qna-and-moderation*
*Completed: 2026-05-26*
