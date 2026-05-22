---
phase: 01-foundation-auth-and-data
plan: 02
subsystem: database
tags: [supabase, postgres, rls, typescript, auth, events, qna, surveys]
requires:
  - phase: 01-foundation-auth-and-data
    plan: 01
    provides: Next.js app shell, environment contract, TypeScript/Vitest/ESLint foundation
provides:
  - Supabase v1 foundation schema with events, memberships, participant sessions, questions, surveys, and audit records
  - Row Level Security enabled on every application table with membership and participant visibility policies
  - Database-side unique join code generation and helper functions for event roles and participant sessions
  - Typed Supabase browser, server, and server-only admin clients
  - Supabase-generated TypeScript Database types
affects: [auth, events, moderation, qna, surveys, exports, deployment]
tech-stack:
  added: ["@supabase/ssr", "@supabase/supabase-js", "server-only", "supabase CLI local verification"]
  patterns: [schema-first Supabase migrations, database-enforced RLS, server-only service-role client, generated database types]
key-files:
  created:
    - supabase/config.toml
    - supabase/migrations/202605220101_foundation_schema.sql
    - supabase/seed.sql
    - src/lib/supabase/database.types.ts
    - src/lib/supabase/client.ts
    - src/lib/supabase/server.ts
    - src/lib/supabase/admin.ts
    - src/lib/supabase/rls.ts
    - tests/db/foundation-schema.test.ts
  modified:
    - .gitignore
    - package.json
    - package-lock.json
    - src/types/app.ts
    - vitest.config.ts
key-decisions:
  - "Participant/public question reads are guarded by participant-session context and restricted to live or answered statuses only."
  - "Service-role Supabase access is isolated in server-only admin helper with session persistence and token refresh disabled."
  - "Database types were generated from the local Supabase schema after a successful local db reset."
patterns-established:
  - "Every application table must have RLS enabled in the migration where the table is created."
  - "App enum unions in src/types/app.ts must mirror Supabase enum values exactly."
  - "Generated Supabase CLI runtime directories under supabase/.branches and supabase/.temp stay ignored."
requirements-completed: [AUTH-04, EVNT-01, EVNT-02, EVNT-03, DEPL-05]
duration: 19min
completed: 2026-05-22
---

# Phase 1 Plan 2: Supabase Data And Security Foundation Summary

**Supabase schema, RLS policies, generated database types, and typed SSR/admin clients for the v1 event, Q&A, survey, and audit model.**

## Performance

- **Duration:** 19 min
- **Started:** 2026-05-22T07:22:49Z
- **Completed:** 2026-05-22T07:41:56Z
- **Tasks:** 3
- **Files modified:** 14

## Accomplishments

- Created the full v1 foundation schema: users, events, event_members, participant_sessions, questions, question_versions, question_votes, moderation_actions, surveys, survey_questions, survey_options, survey_responses, survey_answers, and login_attempts.
- Added enums, constraints, indexes, triggers, unique join-code generation, event-owner membership creation, and role/session helper functions.
- Enabled RLS on every application table and added policies for authenticated event members, organisers/moderators, participant sessions, public-safe question visibility, surveys, votes, responses, and auth attempt audit records.
- Added typed Supabase browser/server/admin helpers using current `@supabase/ssr` patterns and generated `Database` types from the local Supabase schema.
- Verified the migration against local Supabase with `npx supabase db reset` and regenerated types with `npx supabase gen types typescript --local`.

## Task Commits

1. **Task 1 RED: Foundation schema tests** - `2509462` (test)
2. **Task 1 and Task 2 GREEN: Schema migration and RLS policies** - `4eda353` (feat)
3. **Task 3: Typed Supabase clients and generated types** - `25c90d6` (feat)

## Files Created/Modified

- `supabase/config.toml` - Local Supabase project config for schema/reset verification.
- `supabase/migrations/202605220101_foundation_schema.sql` - v1 enums, tables, constraints, indexes, helper functions, triggers, and RLS policies.
- `supabase/seed.sql` - Intentional no-row seed because app data depends on Supabase Auth users and server flows.
- `src/lib/supabase/database.types.ts` - Supabase-generated TypeScript database types from the local schema.
- `src/lib/supabase/client.ts` - Typed browser Supabase client helper.
- `src/lib/supabase/server.ts` - Typed server Supabase client using Next cookies with `getAll`/`setAll`.
- `src/lib/supabase/admin.ts` - Server-only service-role client with auth persistence disabled.
- `src/lib/supabase/rls.ts` - Shared role/status constants for app code and tests without duplicating database authorization logic.
- `src/types/app.ts` - Extended app unions for member, question, moderation, survey, and survey question enums.
- `tests/db/foundation-schema.test.ts` - Migration contract tests for tables, event fields, uniqueness, RLS enablement, member event reads, and public question visibility.
- `package.json` / `package-lock.json` - Supabase runtime dependencies.
- `vitest.config.ts` - Includes `tests/**/*.test.{ts,tsx}` so plan tests run.
- `.gitignore` - Ignores local Supabase CLI runtime state.

## Decisions Made

- Kept participant-visible question policy narrow: only `live` and `answered` questions can be selected through participant-safe policy, and only when participant session context matches the event.
- Used database helper functions for active membership, role checks, participant session context, join-code generation, and event-owner membership creation.
- Kept service-role usage out of browser-importable modules by using `server-only`, a runtime browser guard, and Supabase admin auth options that disable session persistence, auto refresh, and URL session detection.
- Generated `database.types.ts` from the local Supabase database after validating the migration instead of relying on the initial scaffold.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Included `tests/` in Vitest discovery**
- **Found during:** Task 1 RED
- **Issue:** `npm run test -- tests/db/foundation-schema.test.ts` exited with "No test files found" because `vitest.config.ts` only included `src/**/*.test`.
- **Fix:** Added `tests/**/*.test.{ts,tsx}` to Vitest include patterns.
- **Files modified:** `vitest.config.ts`
- **Verification:** RED then failed on missing migration as intended; final schema test passed.
- **Committed in:** `2509462`

**2. [Rule 3 - Blocking] Ignored generated Supabase CLI local state**
- **Found during:** Task 3 local Supabase verification
- **Issue:** `npx supabase start` and type generation created local runtime state under `supabase/.branches/` and `supabase/.temp/`.
- **Fix:** Added those generated directories to `.gitignore`.
- **Files modified:** `.gitignore`
- **Verification:** `git status --short` no longer showed those generated directories.
- **Committed in:** `25c90d6`

**3. [Rule 3 - Blocking] Converted generated database types to UTF-8**
- **Found during:** Task 3 lint
- **Issue:** PowerShell redirection wrote `database.types.ts` in an encoding ESLint parsed as binary.
- **Fix:** Rewrote the generated type file as UTF-8 after generation.
- **Files modified:** `src/lib/supabase/database.types.ts`
- **Verification:** `npm run lint` passed.
- **Committed in:** `25c90d6`

---

**Total deviations:** 3 auto-fixed blocking issues.
**Impact on plan:** All fixes were required to make planned verification real and keep generated local state out of source control. No product scope was added.

## Issues Encountered

- First Supabase local startup had to pull and extract service images. Startup then applied the migration successfully.
- `npm install` reported two moderate npm audit findings in the current dependency tree. No audit remediation was applied because the requested verification commands passed and forced audit fixes could introduce unrelated dependency churn.

## Known Stubs

None - no TODO/FIXME/placeholder text or hardcoded empty UI data sources were found in changed plan files.

## Auth Gates

None.

## Verification

- `npm run test -- tests/db/foundation-schema.test.ts` - PASSED
- `npm run lint` - PASSED
- `npx supabase db reset` - PASSED after starting the local Supabase stack
- `npx supabase gen types typescript --local > src/lib/supabase/database.types.ts` - PASSED
- `npx supabase stop` - PASSED, local stack stopped after verification

## User Setup Required

None for this plan. Later auth/event plans still need real Supabase project environment variables configured from `.env.example`.

## Next Phase Readiness

Plans 01-03 and 01-04 can build auth and event dashboard flows against the committed schema, RLS baseline, typed Supabase clients, generated database types, and app enum unions.

## TDD Gate Compliance

- RED commit exists: `2509462`
- GREEN commit exists after RED: `4eda353`
- Typed client implementation commit exists after GREEN: `25c90d6`

## Self-Check: PASSED

- Confirmed key created files exist, including the Supabase migration, typed client helpers, generated database types, schema test, and this summary.
- Confirmed task commits exist in git history: `2509462`, `4eda353`, `25c90d6`.

---
*Phase: 01-foundation-auth-and-data*
*Completed: 2026-05-22*
