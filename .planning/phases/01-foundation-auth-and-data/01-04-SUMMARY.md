---
phase: 01-foundation-auth-and-data
plan: 04
subsystem: events
tags: [nextjs, react, supabase, rls, server-actions, playwright, event-dashboard]
requires:
  - phase: 01-foundation-auth-and-data
    plan: 02
    provides: Supabase events/event_members schema, generated types, and RLS policies
  - phase: 01-foundation-auth-and-data
    plan: 03
    provides: Protected app shell, Supabase auth guard, sign out, and dashboard redirect target
provides:
  - Authenticated Event Dashboard with accessible event listing, search, status, join code, and copy join link action
  - Create Event flow with Phase 1 fields, server-side validation, defaults, and moderation-off warning dialog
  - Event data access helpers scoped by signed-in user and RLS-compatible membership queries
  - Playwright and Vitest coverage for event creation, listing, search, copy, validation, and responsive layout
affects: [events, moderation, audience-access, qna, surveys, presenter, testing]
tech-stack:
  added: []
  patterns: [React useActionState server-action forms, RLS-compatible Supabase event access, env-gated Playwright auth fixture]
key-files:
  created:
    - src/app/(app)/dashboard/page.tsx
    - src/app/(app)/events/new/page.tsx
    - src/app/(app)/events/[eventId]/page.tsx
    - src/app/(app)/events/actions.ts
    - src/components/events/EventDashboard.tsx
    - src/components/events/EventForm.tsx
    - src/components/events/EventListItem.tsx
    - src/components/events/CopyJoinLinkButton.tsx
    - src/lib/events/events.ts
    - src/lib/events/validation.ts
    - tests/events/events.test.ts
    - tests/e2e/event-dashboard.spec.ts
  modified:
    - src/app/(app)/layout.tsx
    - src/middleware.ts
    - playwright.config.ts
key-decisions:
  - "Event creation upserts the organiser profile before inserting the event because events.created_by references public.users and no auth-user profile trigger exists yet."
  - "Event listing queries active event_members rows and joins events so server code and RLS both scope dashboard reads to accessible events."
  - "Playwright uses QSB_ASK_E2E_AUTH=1 as an env-gated fixture for protected-route UI tests without weakening production auth."
  - "Dashboard search and moderation toggle controls are disabled until hydration completes to avoid losing early user input before client handlers attach."
patterns-established:
  - "Event server actions return field-level validation state for form errors and redirect only after successful mutation."
  - "Copy-to-clipboard controls stay separate from event row navigation and expose visible ARIA-live feedback."
  - "Create Event keeps moderation enabled by default and requires the UI-SPEC confirmation before turning it off."
requirements-completed: [EVNT-01, EVNT-02, EVNT-03, DEPL-05]
duration: 36min
completed: 2026-05-22
---

# Phase 1 Plan 4: Event Dashboard And Create Event Summary

**Authenticated organiser event dashboard and create-event workflow with scoped Supabase access, default moderation, join-code search, and copyable join links.**

## Performance

- **Duration:** 36 min
- **Started:** 2026-05-22T08:09:07Z
- **Completed:** 2026-05-22T08:45:55Z
- **Tasks:** 3
- **Files modified:** 15

## Accomplishments

- Added event validation and server data helpers for Phase 1 fields, default question controls, organiser profile upsert, event insert, membership verification, join-link generation, and accessible event listing.
- Built the protected Event Dashboard with dense desktop rows, stacked mobile rows, live search by event name or join code, status badges, and copy join details feedback.
- Built the Create Event route with required fields, local time zone default, moderation enabled by default, exact UI-SPEC moderation-off warning dialog, validation summary, and save redirect.
- Added a Phase 1 event detail access placeholder that verifies the signed-in user can access the event before rendering.
- Added Vitest and Playwright coverage for event validation, scoped creation/listing, dashboard search, copy behavior, mobile overflow, create form fields, moderation warning, validation errors, and save redirect.

## Task Commits

1. **Task 1 RED: Event data tests** - `f6ea099` (test)
2. **Task 1 GREEN: Event data actions** - `815e260` (feat)
3. **Task 2 RED: Dashboard E2E tests** - `c924cbd` (test)
4. **Task 2 GREEN: Event dashboard** - `cde03f8` (feat)
5. **Task 3 RED: Create event tests** - `516939b` (test)
6. **Task 3 GREEN: Create event flow** - `fa89fa1` (feat)

## Files Created/Modified

- `src/lib/events/validation.ts` - Phase 1 Create Event validation, allowed statuses/identity modes, defaults, and field error messages.
- `src/lib/events/events.ts` - Supabase event creation, organiser profile upsert, membership verification, accessible event listing, and join-link builder.
- `src/app/(app)/events/actions.ts` - Create Event server action with validation state, auth lookup, E2E fixture redirect, and dashboard redirect.
- `src/app/(app)/dashboard/page.tsx` - Protected dashboard page loading accessible events and env-gated Playwright fixture data.
- `src/app/(app)/events/new/page.tsx` - Create Event route.
- `src/app/(app)/events/[eventId]/page.tsx` - Phase 1 event access placeholder with access-denied copy.
- `src/components/events/EventDashboard.tsx` - Client dashboard search, loading, empty, no-results, and error states.
- `src/components/events/EventListItem.tsx` - Dense responsive event row with date, status, join code, and copy control.
- `src/components/events/CopyJoinLinkButton.tsx` - Clipboard copy action with success/failure ARIA-live feedback.
- `src/components/events/EventForm.tsx` - Create Event form using `useActionState`, moderation warning dialog, unsaved-change browser warning, and validation rendering.
- `src/app/(app)/layout.tsx` - Env-gated E2E auth fixture for protected shell tests.
- `src/middleware.ts` - Env-gated E2E protected-route bypass for Playwright only.
- `playwright.config.ts` - E2E fixture environment variables for protected event UI tests.
- `tests/events/events.test.ts` - Event validation, creation, listing, join-link, and server-action tests.
- `tests/e2e/event-dashboard.spec.ts` - Dashboard and Create Event Playwright tests.

## Decisions Made

- Used the existing database trigger for organiser membership creation instead of adding an RPC or migration; server code verifies the active organiser membership after insert.
- Upserted the organiser profile in `public.users` during event creation because the current schema requires that row before `events.created_by` can be inserted.
- Kept event detail as an access-confirming Phase 1 placeholder only; Q&A workspace behavior remains Phase 2.
- Added `QSB_ASK_E2E_AUTH=1` as a test-only fixture to make protected UI E2E tests deterministic without real Supabase auth credentials.
- Disabled live-search and moderation controls until hydration completes so early input cannot be lost before React client handlers attach.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Upsert organiser profile before event insert**
- **Found during:** Task 1
- **Issue:** `events.created_by` references `public.users(id)`, but the existing schema has no trigger to create a profile row from Supabase Auth users.
- **Fix:** `createEventForOrganiser` upserts the signed-in organiser profile before inserting the event.
- **Files modified:** `src/lib/events/events.ts`
- **Verification:** `npm run test -- tests/events/events.test.ts`
- **Committed in:** `815e260`

**2. [Rule 3 - Blocking] Added env-gated protected-route E2E fixture**
- **Found during:** Task 2
- **Issue:** Dashboard/Create Event Playwright tests could not access protected routes without real Supabase auth credentials.
- **Fix:** Added `QSB_ASK_E2E_AUTH=1` handling in layout, middleware, dashboard fixture data, server action redirect, and Playwright config.
- **Files modified:** `src/app/(app)/layout.tsx`, `src/middleware.ts`, `src/app/(app)/dashboard/page.tsx`, `src/app/(app)/events/actions.ts`, `playwright.config.ts`
- **Verification:** `npm run test:e2e -- tests/e2e/event-dashboard.spec.ts`
- **Committed in:** `cde03f8`, `fa89fa1`

**3. [Rule 1 - Bug] Prevented hydration races in live controls**
- **Found during:** Task 3 E2E verification
- **Issue:** Playwright could type/click before React handlers hydrated, causing search input or moderation toggle interactions to be lost.
- **Fix:** Disabled search and moderation controls until a post-hydration animation frame enables them.
- **Files modified:** `src/components/events/EventDashboard.tsx`, `src/components/events/EventForm.tsx`
- **Verification:** `npm run test:e2e -- tests/e2e/event-dashboard.spec.ts`; `npm run lint`
- **Committed in:** `fa89fa1`

**4. [Rule 1 - Bug] Removed mobile sticky action overlap**
- **Found during:** Screenshot inspection
- **Issue:** The mobile sticky Save/Cancel bar overlapped the next form section at 360px.
- **Fix:** Made Create Event actions static with normal document flow.
- **Files modified:** `src/components/events/EventForm.tsx`
- **Verification:** Desktop and 360px screenshots inspected; `npm run test:e2e -- tests/e2e/event-dashboard.spec.ts`
- **Committed in:** `fa89fa1`

**5. [Rule 3 - Blocking] Removed corrupted generated Next cache**
- **Found during:** Route/build verification
- **Issue:** `.next/dev/types/routes.d.ts` was corrupted and caused a type-check failure plus stale route registration.
- **Fix:** Removed only the generated `.next` directory after verifying it was inside the worktree; Next regenerated it.
- **Files modified:** none tracked
- **Verification:** `/events/new` rendered after regeneration and E2E passed.
- **Committed in:** not applicable, generated files are ignored

---

**Total deviations:** 5 auto-fixed issues (2 bugs, 1 missing critical, 2 blocking).
**Impact on plan:** All deviations were required for correctness, deterministic verification, or mobile usability. No product scope beyond Phase 1 was added.

## Issues Encountered

- Running Playwright and ESLint in parallel conflicted over ignored `test-results/`; final verification was rerun sequentially.
- Next.js 16 still reports the existing middleware-to-proxy deprecation warning inherited from Plan 03. No migration was made because current auth middleware is outside this plan's scope.
- Playwright screenshot CLI injects temporary caret styling and the Next dev indicator is visible in development screenshots; neither appears in production UI.

## Known Stubs

None. The Phase 1 event detail page is intentionally an access-confirming placeholder for future Phase 2 workspace features and does not block this plan's dashboard/create-event goal.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: test-auth-bypass | `src/app/(app)/layout.tsx`, `src/middleware.ts` | E2E auth bypass added behind `QSB_ASK_E2E_AUTH=1`; production remains protected when the variable is unset. |

## Auth Gates

None.

## Verification

- `npm run test -- tests/events/events.test.ts` - PASSED
- `npm run test:e2e -- tests/e2e/event-dashboard.spec.ts` - PASSED
- `npm run lint` - PASSED
- Desktop screenshot inspected: `test-results/dashboard-desktop.png` - PASS
- 360px mobile screenshot inspected: `test-results/create-event-mobile-360.png` - PASS after removing sticky action overlap

## User Setup Required

None for this plan. Real event creation still requires the Supabase environment variables from `.env.example` and a configured Supabase project.

## Next Phase Readiness

Phase 2 can build Q&A submission, moderation queues, and event workspace screens on top of the committed event creation, accessible event listing, join-code/link dashboard, protected shell, and Supabase RLS model.

## TDD Gate Compliance

- Task 1 RED commit exists: `f6ea099`
- Task 1 GREEN commit exists after RED: `815e260`
- Task 2 RED commit exists: `c924cbd`
- Task 2 GREEN commit exists after RED: `cde03f8`
- Task 3 RED commit exists: `516939b`
- Task 3 GREEN commit exists after RED: `fa89fa1`

## Self-Check: PASSED

- Confirmed key created files exist, including dashboard/create-event pages, event components, event data helpers, event tests, E2E tests, and this summary.
- Confirmed task commits exist in git history: `f6ea099`, `815e260`, `c924cbd`, `cde03f8`, `516939b`, `fa89fa1`.

---
*Phase: 01-foundation-auth-and-data*
*Completed: 2026-05-22*
