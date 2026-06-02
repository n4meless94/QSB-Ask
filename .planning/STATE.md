---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Integrated Slide Presenter
current_phase: 5
current_plan: 1
status: planning
last_updated: "2026-06-02T14:45:42.786Z"
last_activity: 2026-06-02
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 8
  completed_plans: 0
  percent: 0
---

# Project State: QSB Ask

**Last updated:** 2026-06-02
**Current phase:** 5
**Current Plan:** 1
**Total Plans in Phase:** 2
**Status:** Phase 5 Plan 01 ready - PDF deck upload and storage
**Last Activity:** 2026-06-02
**Workflow mode:** yolo / auto  
**Project mode:** mvp

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-06-02)

**Core value:** No unapproved, sensitive, inappropriate, or confidential question should appear publicly before the organiser or moderator has control over it.

## Current Focus

Milestone v1.1 builds the Integrated Slide Presenter. The chosen scope is PDF-first: presenters export PowerPoint or Canva decks to PDF, organisers upload the PDF into QSB Ask, and the app presents slides with web-native floating QR and approved-question overlays.

Phase 5 Plan 01 is ready: event-scoped PDF deck upload, storage, validation, and organiser management. Execute it before adding slide rendering, QR overlay, or question overlay behavior.

## Roadmap Status

| Phase | Status | Requirements | Notes |
|-------|--------|--------------|-------|
| 1 | Complete | 9 | Foundation, auth, event dashboard, data security. Plans 01-04 complete. |
| 2 | Complete | 27 | Plans 01-08 complete: workspace access, settings/lifecycle, participant join/session, submission, moderation, audience voting, presenter view, and realtime. |
| 3 | Complete | 19 | Surveys, results, presentation, CSV export. |
| 4 | Complete | 4 | Deployment, reconnect handling, UAT readiness. |
| 04.1 | Complete | 7 | Staff invite activation and participant survey discovery closure. |
| 5 | In Progress | 5 | Plan 01 ready for PDF deck upload, validation, storage, replacement/removal, and organiser management. |
| 6 | Planned | 10 | Browser slide presenter, fullscreen navigation, and saved QR overlay layout. |
| 7 | Planned | 7 | Moderator-controlled show-on-screen question overlay separate from approval. |
| 8 | Planned | 5 | Overlay realtime, reconnect state, permission safety, and UAT coverage. |

## Active Constraints

- Build only against approved URS/PRD/SPEC/SRS and `.planning/` artifacts.
- Keep v1 focused on moderated Q&A, surveys, chart/data results, CSV export, roles, and deployment.
- Do not add Slido parity extras unless requirements are updated.
- Deploy long-lived app services through Coolify on QSB VPS, not ad hoc Docker.
- Use managed Supabase for v1 backend services.
- v1.1 accepts PDF decks only; PowerPoint and Canva decks should be exported to PDF before upload.
- Showing a question on the slide is a separate moderator action from approving it for public Q&A.
- Presenter overlays must use safe public-approved question DTOs and must never expose pending or archived text.

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
- 2026-05-26: Completed Phase 2 Plan 07 Presenter View access and approved-only display surface.
- 2026-05-26: Completed Phase 2 Plan 08 normal-condition Q&A realtime subscriptions and cross-surface integration verification.
- 2026-06-01: Completed Phase 04.1 closure for staff invite activation and participant survey discovery; full unit, E2E, lint, typecheck, and build verification passed.
- 2026-06-02: Started milestone v1.1 Integrated Slide Presenter with PDF-first scope, QR overlay, and moderator-controlled shown-question overlay.
- 2026-06-02: Created Phase 5 context and Plan 01 for event-scoped PDF deck upload, validation, storage, and organiser management.
- 2026-06-02: Published QSB Ask source to GitHub `n4meless94/QSB-Ask`, added GHCR image publishing, and verified the VPS can pull `ghcr.io/n4meless94/qsb-ask:latest`.

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
- [Phase 02]: Plan 07 Presenter View uses `getPresenterEventAccess` and safe live/answered public question fields only.
- [Phase 02]: Plan 07 Presenter View remains in the authenticated route tree but does not render Event Workspace management tabs.
- [Phase 02]: Plan 08 public and presenter realtime callbacks refresh server-rendered safe data instead of storing raw row payloads.
- [Phase 02]: Plan 08 staff realtime subscriptions are separate from public/presenter subscriptions and refresh moderation/history surfaces.
- [Phase 02]: Plan 08 prolonged reconnect hardening remains Phase 4 scope; Phase 2 exposes connected/reconnecting/refresh-needed states only.
- [Phase 03]: Survey realtime events are refresh triggers only. — Presentation UI reloads safe server aggregate DTOs instead of rendering payload rows.
- [Phase 03]: Participant result charts require completed visible surveys. — Charts render only after completion when results_visible_to_participants is enabled.
- [Phase 03]: Presentation results use presenter event access. — Staff access is checked before aggregate survey data is loaded.
- [Phase 03]: CSV exports return 204 without Content-Disposition for empty event export categories.
- [Phase 03]: Anonymous CSV export labels use Anonymous plus a stable session audit prefix while omitting raw tokens and token hashes.
- [Phase 03]: Event Workspace export links render only for organiser-loaded nonzero export counts.
- [Phase 04.1]: Invited staff access activates during server-side event access checks only when the signed-in Supabase Auth user email matches an invited membership for the event and allowed role.
- [Phase 04.1]: Participant Q&A remains the join landing surface, with event-scoped navigation to Surveys and back to Q&A.
- [Milestone v1.1]: Integrated Slide Presenter is PDF-first. Native PowerPoint/Canva overlay and `.pptx` conversion are deferred.
- [Milestone v1.1]: Q&A approval and slide display are separate controls; moderators approve for public visibility, then explicitly show or hide a selected approved question on the presenter.

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
| Phase 02 P07 | 10min | 3 tasks | 5 files |
| Phase 02 P08 | 20min | 3 tasks | 12 files |
| Phase 03 P04 | 11min | 3 tasks | 11 files |
| Phase 03 P05 | 10min | 3 tasks | 6 files |
| Phase 04.1 P01 | 16min | 4 tasks | 13 files |

## Last Session

- **Last session:** 2026-05-30T04:23:08.376Z
- **Stopped At:** Completed 03-05-PLAN.md
- **Resume File:** None

## Next Recommended Command

Execute `.planning/phases/05-pdf-deck-upload-and-storage/05-01-PLAN.md`.

## Accumulated Context

### Roadmap Evolution

- Phase 04.1 inserted after Phase 4: Close v1 audit gaps: staff invite activation and survey discovery (URGENT)

## Current Position

Phase: 5 - PDF Deck Upload And Storage
Plan: 01 - Event-scoped PDF deck upload, validation, storage, and organiser management
Status: Plan ready
Last activity: 2026-06-02 - Phase 5 Plan 01 created
