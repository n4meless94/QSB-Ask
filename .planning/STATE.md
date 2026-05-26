---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: Phase 2 - Live Event Q&A And Moderation
current_plan: 7
status: executing
stopped_at: Completed 02-06-PLAN.md
last_updated: "2026-05-26T07:04:34.554Z"
last_activity: 2026-05-26
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 12
  completed_plans: 10
  percent: 83
---

# Project State: QSB Ask

**Last updated:** 2026-05-26  
**Current phase:** Phase 2 - Live Event Q&A And Moderation  
**Current Plan:** 7
**Total Plans in Phase:** 8
**Status:** Ready to execute
**Last Activity:** 2026-05-26
**Workflow mode:** yolo / auto  
**Project mode:** mvp

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-05-22)

**Core value:** No unapproved, sensitive, inappropriate, or confidential question should appear publicly before the organiser or moderator has control over it.

## Current Focus

Phase 2 builds the live event Q&A and moderation workflow on top of the verified Phase 1 foundation. Plans 01-06 are complete and established:

- Server-side event role assertions for organiser, moderator, and speaker access.
- Organiser member access management with pending moderator/speaker records.
- Authenticated Event Workspace shell with Access and Settings panels.
- Organiser-only event settings updates, close/archive lifecycle actions, and moderation-off warning acknowledgement.
- Public join route, identity-mode-aware participant form, and event-scoped participant session cookies with hashed database tokens.
- Participant question submission with pending-by-default moderation, rate/duplicate checks, and approved-only public reads.
- Staff moderation queue with audited compare-and-set actions, edit version history, search, and sort.
- Audience approved-question list with Popular/Recent sorting and one-vote behavior.

## Roadmap Status

| Phase | Status | Requirements | Notes |
|-------|--------|--------------|-------|
| 1 | Complete | 9 | Foundation, auth, event dashboard, data security. Plans 01-04 complete. |
| 2 | In Progress | 27 | Plans 01-06 complete: workspace access, settings/lifecycle, participant join/session, submission, moderation, and audience voting. |
| 3 | Pending | 19 | Surveys, results, presentation, CSV export. |
| 4 | Pending | 4 | Deployment, reconnect handling, UAT readiness. |

## Active Constraints

- Build only against approved URS/PRD/SPEC/SRS and `.planning/` artifacts.
- Keep v1 focused on moderated Q&A, surveys, chart/data results, CSV export, roles, and deployment.
- Do not add Slido parity extras unless requirements are updated.
- Deploy long-lived app services through Coolify on QSB VPS, not ad hoc Docker.
- Use managed Supabase for v1 backend services.

## Recent Activity

- 2026-05-22: GSD project initialized.
- 2026-05-22: PROJECT.md, research files, REQUIREMENTS.md, ROADMAP.md, and STATE.md created from approved docs.
- 2026-05-22: Completed Phase 1 Plan 01 foundation scaffold, health route, env contract, UI primitives, README, and smoke tests.
- 2026-05-22: Completed Phase 1 Plan 02 Supabase schema, RLS policies, generated database types, and typed client helpers.
- 2026-05-22: Completed Phase 1 Plan 03 login, password reset, lockout, protected shell, sign out, and inactivity timeout.
- 2026-05-22: Completed Phase 1 Plan 04 Event Dashboard, Create Event flow, scoped event listing, and join-detail copy.
- 2026-05-26: Completed Phase 2 Plan 01 Event Workspace access helpers, access actions, Access panel, and workspace shell.
- 2026-05-26: Completed Phase 2 Plan 02 organiser event settings, close/archive lifecycle actions, and moderation-off warning.
- 2026-05-26: Completed Phase 2 Plan 03 participant join, identity modes, and secure event-scoped session token.
- 2026-05-26: Completed Phase 2 Plan 04 participant question submission, rate/duplicate checks, and approved-only public reads.
- 2026-05-26: Completed Phase 2 Plan 05 moderator queue, audited moderation actions, edit history, search, and sort.
- 2026-05-26: Completed Phase 2 Plan 06 audience approved-question list, Popular/Recent sorting, and session-bound voting.

## Decisions

- Phase 1 Plan 01 used Tailwind CSS v4 PostCSS setup with `@import "tailwindcss"` in `globals.css`.
- Health route reports missing environment variable names but never serializes secret values.
- Root screen is an operational setup shell with auth and health links, not a landing page.
- Participant/public question reads are guarded by participant-session context and restricted to live or answered statuses only.
- Service-role Supabase access is isolated in a server-only admin helper with session persistence and token refresh disabled.
- Database types are generated from the local Supabase schema after a successful local database reset.
- [Phase 01]: Auth copy constants live in src/lib/auth/messages.ts because Next.js server-action modules can only export async functions.
- [Phase 01]: Lockout state is derived from login_attempts rather than a separate lockout table, using five failures in a 15-minute window and a 30-minute lockout from the latest triggering failure.
- [Phase 01]: The app inactivity marker is a secure same-site HTTP-only cookie refreshed by middleware on protected route access.
- [Phase 01]: Event creation upserts the organiser profile before inserting the event because events.created_by references public.users and no auth-user profile trigger exists yet.
- [Phase 01]: Playwright uses QSB_ASK_E2E_AUTH=1 as an env-gated fixture for protected-route UI tests without weakening production auth.
- [Phase 02]: Plan 01 invite flow creates pending event_members rows only; UI and action copy explicitly say manual account onboarding, not email delivery.
- [Phase 02]: Plan 01 presenter and moderator access helpers are separate server-side entry points so later surfaces do not rely on client-side role filtering.
- [Phase 02]: Plan 01 keeps Q&A, settings, and presenter tab content limited to honest later-plan panels.
- [Phase 02]: Plan 02 settings helpers require organiser role server-side before event settings or lifecycle updates.
- [Phase 02]: Plan 02 close/archive actions update event status only and preserve records.
- [Phase 02]: Plan 02 moderation can be turned off only when the warning acknowledgement field is submitted.
- [Phase 02]: Plan 03 participant cookies store only the raw token client-side; the database stores SHA-256 token hashes.
- [Phase 02]: Plan 03 participant cookies are HTTP-only, SameSite=Lax, and scoped to `/join/{joinCode}`.
- [Phase 02]: Plan 03 public join pages must not render organiser controls, member data, or private settings.
- [Phase 02]: Plan 04 participant Q&A route is `/join/{joinCode}/qna`, outside the protected organiser `/events` shell.
- [Phase 02]: Plan 04 public reads use `PUBLIC_QUESTION_STATUSES` at the query boundary and select only safe public columns.
- [Phase 02]: Plan 04 pending moderated question text is cleared after successful submission and is not rendered in public lists.
- [Phase 02]: Plan 05 moderation actions use Postgres RPCs for atomic compare-and-set question updates, edit versions, and moderation_actions audit rows.
- [Phase 02]: Plan 05 staff moderation queue is rendered only for organiser and moderator roles; speakers remain approved-only Presenter View users.
- [Phase 02]: Plan 05 client moderation UI imports only client-safe shared DTOs/copy, not server-only moderation helpers.
- [Phase 02]: Plan 06 voting uses a service-role-only Postgres RPC after server-side participant token validation.
- [Phase 02]: Plan 06 public question sorting remains inside the approved-only live/answered query boundary.
- [Phase 02]: Plan 06 answered questions remain visible to participants but are not votable.

## Performance Metrics

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01 P01 | 12min | 3 tasks | 24 files |
| Phase 01 P02 | 19min | 3 tasks | 14 files |
| Phase 01 P03 | 15min | 3 tasks | 16 files |
| Phase 01 P04 | 36min | 3 tasks | 15 files |
| Phase 02 P01 | 28min | 3 tasks | 7 files |
| Phase 02 P02 | 31min | 3 tasks | 7 files |
| Phase 02 P03 | 26min | 3 tasks | 7 files |
| Phase 02 P04 | 38min | 3 tasks | 8 files |
| Phase 02 P05 | 14min | 3 tasks | 11 files |
| Phase 02 P06 | 19min | 3 tasks | 9 files |

## Last Session

- **Last session:** 2026-05-26T07:04:34.300Z
- **Stopped At:** Completed 02-06-PLAN.md
- **Resume File:** None

## Next Recommended Command

Continue Phase 2 execution with `02-07-PLAN.md`.
