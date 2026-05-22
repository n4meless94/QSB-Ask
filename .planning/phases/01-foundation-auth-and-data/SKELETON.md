# Walking Skeleton - QSB Ask

**Phase:** 1
**Generated:** 2026-05-22

## Capability Proven End-to-End

A signed-in organiser can run the Next.js app locally, authenticate with Supabase, create an event, and see its join code/link on the Event Dashboard.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16 App Router with TypeScript | Approved by SRS and fits full-stack server components, route handlers, server actions, and protected organiser workflows. |
| Styling | Tailwind CSS with a small internal component set | Approved by SRS and UI-SPEC; keeps Phase 1 operational, dense, and maintainable without a heavy design system. |
| Data layer | Managed Supabase Postgres with SQL migrations in `supabase/migrations` | Approved by SRS and CONTEXT; gives reviewable schema, RLS, Realtime readiness, and reproducible database setup. |
| Auth | Supabase Auth email/password plus app-level guards | Approved by SPEC/SRS; password reset uses Supabase, while exact lockout and inactivity rules are enforced in app code if Supabase does not cover them exactly. |
| Deployment target | Coolify-managed Next.js app on QSB VPS with managed Supabase backend | Approved by PROJECT/SRS; Phase 1 documents local configuration and adds a health route, while Coolify deployment executes in Phase 4. |
| Directory layout | `src/app` route groups, `src/components`, `src/lib`, `src/types`, `supabase/migrations`, `tests/e2e` | Separates signed-in organiser surfaces, public participant surfaces, shared helpers, database contracts, and verification. |

## Stack Touched in Phase 1

- [ ] Project scaffold: Next.js, React, TypeScript, Tailwind, lint, test runner.
- [ ] Routing: auth routes, protected dashboard route, create event route, health route.
- [ ] Database: schema migrations for users, events, memberships, participant sessions, questions, surveys, and audit records.
- [ ] UI: login, password reset, shell, Event Dashboard, Create Event, copy join details.
- [ ] Local run: documented environment variables and working local commands.

## Out of Scope (Deferred to Later Slices)

- Participant Q&A submission and moderation queue are Phase 2.
- Moderator, speaker, and organiser role invitation management are Phase 2.
- Presenter View and participant-facing live Q&A are Phase 2.
- Surveys, chart/data result views, presentation view, and CSV export are Phase 3.
- Coolify deployment, production domain cutover, reconnect hardening, accessibility audit, and UAT readiness are Phase 4.
- Excel export, labels, downvotes, administrator role, gamification, AI interactions, and Slido parity extras are out of v1 scope.

## Subsequent Slice Plan

- Phase 2: Add live moderated Q&A across organiser, moderator, audience, and presenter views.
- Phase 3: Add surveys, results, presentation view, and CSV exports.
- Phase 4: Harden live reconnect behaviour, deploy through Coolify, and prepare UAT.
