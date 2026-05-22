# Phase 1: Foundation, Auth, And Data - Context

**Gathered:** 2026-05-22  
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase creates the working technical foundation for QSB Ask: a Next.js/TypeScript/Tailwind application, Supabase integration, database schema and Row Level Security foundation, email/password authentication baseline, account security guards, local development documentation, event creation, and Event Dashboard with join code/link.

This phase does not implement participant Q&A submission, moderation queues, surveys, presenter view, live updates, exports, or Coolify deployment. Those belong to later roadmap phases.

</domain>

<decisions>
## Implementation Decisions

### App Foundation
- Use the Next.js App Router with TypeScript and Tailwind CSS.
- Keep the initial UI quiet, dense, and operational rather than marketing-oriented.
- Use clear route groups for signed-in organiser surfaces and public participant surfaces, even if public participant functionality is mostly later-phase.
- Add a health route early so later Coolify deployment has a stable target.

### Supabase And Data
- Use managed Supabase for Auth, Postgres, Row Level Security, and Realtime readiness.
- Store schema migrations in the repo so the database contract is reviewable and reproducible.
- Create all core v1 tables in Phase 1 even where UI lands later, so RLS and relationships are established early.
- Enforce visibility and role rules in server-side code and database policies, not client-only checks.

### Authentication
- Use Supabase Auth email/password and password reset.
- Implement the app-level account lockout guard required by SPEC if Supabase does not provide the exact policy.
- Add session inactivity handling at the app layer.
- Keep organiser user profile data separate from Supabase Auth identity.

### Event Dashboard
- Event Dashboard is the first signed-in destination after login.
- The dashboard shows accessible events with name, date, status, and join code.
- Create Event captures only Phase 1 fields needed for the foundation: name, date/time zone, status, identity mode, moderation toggle, and question rules defaults.
- Join code generation must be non-guessable enough for v1 and unique in the database.

### the agent's Discretion
- Choose project file organisation that best fits current Next.js conventions.
- Choose validation library only if it reduces real complexity.
- Use pragmatic components instead of overbuilding a design system.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- No application code exists yet.
- Approved docs and GSD planning files are the source of truth.

### Established Patterns
- Project uses GSD planning artifacts.
- QSB brand/work outputs should be professional, structured, and measured.
- Deployment must remain compatible with Coolify on QSB VPS.

### Integration Points
- Supabase client/server utilities.
- Next.js route handlers/server actions.
- Database migrations.
- Event Dashboard and Create Event screens.
- Health route for future deployment verification.

</code_context>

<specifics>
## Specific Ideas

- Public product domain target is `ask.qsbportal.com.my`, but deployment happens in Phase 4.
- Supabase custom domain is not required for v1.
- V1 capacity target is 300 participants per active event.
- CSV export is v1, Excel is P1.

</specifics>

<deferred>
## Deferred Ideas

- Participant Q&A submission and moderation queue are Phase 2.
- Surveys, charts, presentation view, and CSV export are Phase 3.
- Coolify deployment, reconnect hardening, and UAT are Phase 4.
- Excel export, labels, downvotes, and cross-event administrator role remain v2/P1.

</deferred>
