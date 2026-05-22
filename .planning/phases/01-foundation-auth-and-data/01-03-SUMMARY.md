---
phase: 01-foundation-auth-and-data
plan: 03
subsystem: auth
tags: [nextjs, supabase-auth, middleware, password-reset, lockout, inactivity-timeout]
requires:
  - phase: 01-foundation-auth-and-data
    plan: 01
    provides: Next.js app shell, UI primitives, Vitest, Playwright, ESLint, environment contract
  - phase: 01-foundation-auth-and-data
    plan: 02
    provides: Supabase schema, login_attempts table, typed SSR/admin clients, generated database types
provides:
  - Email/password organiser sign-in through Supabase Auth
  - Password reset request, callback, and confirmation flow
  - App-level login_attempts lockout guard and audit writes
  - Protected app layout with user identity and sign out
  - Middleware route protection and 8-hour inactivity timeout cookie
affects: [auth, dashboard, events, middleware, testing]
tech-stack:
  added: []
  patterns: [server actions for auth mutations, server-only admin audit writes, middleware session activity cookie]
key-files:
  created:
    - src/app/(auth)/actions.ts
    - src/app/(auth)/login/page.tsx
    - src/app/(auth)/password-reset/page.tsx
    - src/app/(auth)/password-reset/confirm/page.tsx
    - src/app/auth/callback/route.ts
    - src/app/(app)/layout.tsx
    - src/lib/auth/lockout.ts
    - src/lib/auth/session.ts
    - src/lib/auth/validation.ts
    - src/lib/auth/messages.ts
    - src/middleware.ts
    - tests/auth/auth-actions.test.ts
    - tests/e2e/auth.spec.ts
  modified:
    - src/components/shell/AppShell.tsx
    - src/app/page.tsx
    - vitest.config.ts
key-decisions:
  - "Auth copy constants live in src/lib/auth/messages.ts because Next.js server-action modules can only export async functions."
  - "Lockout state is derived from login_attempts rather than a separate lockout table, using five failures in a 15-minute window and a 30-minute lockout from the latest triggering failure."
  - "The app inactivity marker is a secure same-site HTTP-only cookie refreshed by middleware on protected route access."
patterns-established:
  - "Use Supabase Auth for credential and password reset decisions; app code only adds validation, routing, audit, and lockout guards."
  - "Use the server-only admin client only for login_attempts lockout reads and audit inserts before Supabase Auth accepts a session."
  - "Keep auth user-facing copy centralized so pages, actions, and tests share exact UI-SPEC strings."
requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04]
duration: 15min
completed: 2026-05-22
---

# Phase 1 Plan 3: Organiser Auth Flow Summary

**Supabase email/password organiser auth with password reset, audit-backed lockout, protected shell, sign out, and 8-hour inactivity timeout.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-05-22T07:47:32Z
- **Completed:** 2026-05-22T08:02:57Z
- **Tasks:** 3
- **Files modified:** 16

## Accomplishments

- Added `/login`, `/password-reset`, and `/password-reset/confirm` screens using the Phase 1 UI contract and exact auth copy for invalid credentials, lockout, reset confirmation, expired links, reset success, and session expiry.
- Implemented auth server actions for sign in, sign out, reset request, and reset confirmation through the typed Supabase SSR client.
- Added account lockout logic using `login_attempts`: five failed attempts within 15 minutes triggers a 30-minute lockout before later sign-in attempts call Supabase Auth.
- Added protected `(app)` layout with user identity and Sign out, plus middleware that redirects unauthenticated users and expires inactive sessions after `APP_SESSION_IDLE_TIMEOUT_SECONDS`.
- Added auth unit and Playwright coverage for sign-in, invalid credentials, lockout, reset request/confirm validation, sign out, session expiry helper, auth pages, and protected-route redirect.

## Task Commits

1. **TDD RED: Auth flow tests** - `1b6de40` (test)
2. **Tasks 1-3 GREEN: Organiser auth implementation** - `4f82980` (feat)

## Files Created/Modified

- `src/app/(auth)/actions.ts` - Server actions for sign in, sign out, reset request, and reset confirmation.
- `src/app/(auth)/login/page.tsx` - Login UI with exact UI-SPEC auth error, lockout, session-expired, and reset-success states.
- `src/app/(auth)/password-reset/page.tsx` - Non-enumerating password reset request UI.
- `src/app/(auth)/password-reset/confirm/page.tsx` - Reset confirmation UI with expired-link and password validation states.
- `src/app/auth/callback/route.ts` - Supabase callback route using `exchangeCodeForSession` and safe next-path redirects.
- `src/app/(app)/layout.tsx` - Protected shell wrapper with Supabase `getUser()` guard and Sign out action.
- `src/middleware.ts` - Protected-route redirect and inactivity enforcement with `APP_SESSION_IDLE_TIMEOUT_SECONDS`.
- `src/lib/auth/lockout.ts` - Login attempt read/write helpers and lockout window calculation.
- `src/lib/auth/session.ts` - Activity cookie helpers and inactivity assertion.
- `src/lib/auth/validation.ts` - Email normalization, form string parsing, and password strength validation.
- `src/lib/auth/messages.ts` - Centralized UI-SPEC auth messages.
- `src/components/shell/AppShell.tsx` - Optional shell account action slot for Sign out.
- `src/app/page.tsx` - Updated local setup sign-in target from `/auth/sign-in` to `/login`.
- `tests/auth/auth-actions.test.ts` - Auth server-action, lockout, reset, sign-out, and session helper tests.
- `tests/e2e/auth.spec.ts` - Auth screen and protected-route Playwright tests.
- `vitest.config.ts` - Added `@` alias resolution for app-module imports in tests.

## Decisions Made

- Kept lockout state computable from `login_attempts` rather than adding a new table or column, preserving the Plan 02 schema.
- Used middleware for inactivity expiry so protected app routes are checked before rendering organiser surfaces.
- Kept `/dashboard` as the successful sign-in target even though the dashboard page is owned by Plan 04.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added Vitest alias resolution**
- **Found during:** Task 1 tests
- **Issue:** Auth tests could not import `@/app/(auth)/actions` because Vitest did not resolve the TypeScript `@/*` path alias.
- **Fix:** Added a `resolve.alias` entry in `vitest.config.ts`.
- **Files modified:** `vitest.config.ts`
- **Verification:** `npm run test -- tests/auth/auth-actions.test.ts` passed.
- **Committed in:** `4f82980`

**2. [Rule 2 - Missing Critical] Added shell Sign out action slot**
- **Found during:** Task 3 protected layout
- **Issue:** Existing `AppShell` could show user identity but had no account action slot for the required Sign out control.
- **Fix:** Added an optional `accountAction` prop and wired Sign out from the protected app layout.
- **Files modified:** `src/components/shell/AppShell.tsx`, `src/app/(app)/layout.tsx`
- **Verification:** `npm run lint` passed and auth tests cover `signOutAction`.
- **Committed in:** `4f82980`

**3. [Rule 1 - Bug] Updated stale root sign-in route**
- **Found during:** Final review
- **Issue:** The root setup screen still linked to `/auth/sign-in`, which does not exist after this plan establishes `/login`.
- **Fix:** Updated the displayed route and link target to `/login`.
- **Files modified:** `src/app/page.tsx`
- **Verification:** `npm run lint` passed.
- **Committed in:** `4f82980`

---

**Total deviations:** 3 auto-fixed issues.
**Impact on plan:** Fixes were limited to test infrastructure, the required shell sign-out affordance, and a stale setup link. No new product scope was added.

## Issues Encountered

- Next.js rejects non-async exports from `"use server"` modules. Auth UI copy was moved into `src/lib/auth/messages.ts`.
- A stale Node dev server was already listening on `127.0.0.1:3000`; it was stopped so Playwright could run against the current code.
- Next.js 16 emits a warning that the `middleware` file convention is deprecated in favor of `proxy`; the plan explicitly required `src/middleware.ts`, so no migration was made.

## Known Stubs

None in files created or modified by this plan. The `/dashboard` page content is intentionally delivered by Plan 04; this plan establishes the protected shell, redirect target, and middleware guard.

## Auth Gates

None.

## Verification

- `npm run test -- tests/auth/auth-actions.test.ts` - PASSED
- `npm run test:e2e -- tests/e2e/auth.spec.ts` - PASSED
- `npm run lint` - PASSED

## User Setup Required

None for this plan. Real Supabase auth flows require the environment variables from `.env.example` and a configured Supabase project.

## Next Phase Readiness

Plan 04 can build the Event Dashboard at `/dashboard` inside the protected `(app)` shell and rely on the committed auth guard, session timeout, sign-out action, and Supabase user identity.

## TDD Gate Compliance

- RED commit exists: `1b6de40`
- GREEN commit exists after RED: `4f82980`
- Note: the GREEN implementation for Tasks 1-3 was committed together because the auth pages, server actions, middleware, and shared tests are tightly coupled.

## Self-Check: PASSED

- Confirmed created auth pages, auth helpers, middleware, callback route, protected layout, tests, and this summary exist.
- Confirmed task commits exist in git history: `1b6de40`, `4f82980`.

---
*Phase: 01-foundation-auth-and-data*
*Completed: 2026-05-22*
