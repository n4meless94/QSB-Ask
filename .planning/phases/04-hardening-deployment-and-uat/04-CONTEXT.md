# Phase 4: Hardening, Deployment, And UAT - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 prepares the completed v1 feature set for controlled pilot use. It owns prolonged reconnect handling, Coolify deployment readiness, production domain handoff planning, health check suitability, accessibility/mobile smoke coverage, and UAT runbooks. It must not add new Q&A, survey, analytics, export, or Slido-parity features beyond what is needed to harden and validate the approved v1 scope.

</domain>

<decisions>
## Implementation Decisions

### Reconnect Hardening
- Reuse the existing `live`, `reconnecting`, and `refresh-needed` state vocabulary already used by Q&A and survey presentation surfaces.
- Treat prolonged reconnect failure as an explicit refresh-required state with visible copy and a user-operated refresh action.
- Keep offline mutation queues out of v1; offline moderator reconciliation is listed as later-scope `LIVE2-01`.
- Use safe server refresh boundaries only: realtime callbacks trigger refresh, not direct rendering of raw Supabase payload rows.

### Deployment Readiness
- Keep the app as a Coolify-managed Next.js resource on QSB VPS, with managed Supabase retained for Auth, Postgres, Realtime, and storage.
- Do not introduce unmanaged VPS services or ad hoc Docker Compose deployment as the primary v1 path.
- Extend the existing non-secret `/api/health` route and documentation only as needed for Coolify checks.
- Document production URL readiness for `https://ask.qsbportal.com.my`, including DNS/Coolify cutover responsibilities and environment variables without secrets.

### UAT And Smoke Checks
- Produce practical UAT scenarios from the implemented v1 flows: auth, event setup, participant join, moderated Q&A, presenter view, surveys, presentation charts, and CSV export.
- Verify accessibility and mobile readiness through the existing Playwright style of 360px no-overflow checks plus semantic checks already present in component tests.
- Record live Supabase Realtime latency as human/UAT evidence rather than pretending local fixture tests prove hosted two-second behavior.
- Keep verification commands repeatable for local CI: unit tests, lint, typecheck, and targeted E2E suites.

### the agent's Discretion
Implementation details may be chosen conservatively to match the existing Next.js App Router, Tailwind, Supabase, Playwright, and internal component patterns.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/qna/ConnectionStatus.tsx` renders the live/reconnecting/refresh-needed status indicator.
- `src/lib/qna/realtime.ts` and `src/lib/surveys/realtime.ts` contain the active realtime subscription patterns.
- `src/app/api/health/route.ts` already returns a non-secret machine-readable health payload.
- Existing Playwright specs under `tests/e2e/` cover auth, event dashboard/workspace, participant join, Q&A, presenter view, surveys, presentation, CSV exports, and 360px mobile overflow checks.

### Established Patterns
- Client realtime code uses Supabase browser channels and `router.refresh()` to reload safe server-derived DTOs.
- Public participant and presenter surfaces remain outside organiser controls and prioritize mobile-safe layouts.
- Tests prefer focused Vitest coverage for helpers and Playwright fixture modes for user-visible workflows.
- Documentation belongs in `.planning/` and README-style operational files; secrets are named but never printed.

### Integration Points
- Reconnect hardening connects to Q&A audience, presenter, moderation, survey presentation, and participant-visible survey result surfaces.
- Deployment readiness connects to `.env.example`, `README.md`, `next.config.ts`, `/api/health`, and any Coolify runbook added under project docs.
- UAT readiness connects to the completed Phase 1-3 summaries and the v1 requirements in `.planning/REQUIREMENTS.md`.

</code_context>

<specifics>
## Specific Ideas

- Keep reconnect copy calm and operational: tell users when live updates are reconnecting and when refresh is required.
- Add a deployment/UAT checklist that QSB operators can run without exposing Supabase service keys or private values.
- Treat the live hosted two-second update check as a UAT scenario because local fixture E2E cannot prove real Supabase network latency.

</specifics>

<deferred>
## Deferred Ideas

- Offline moderation action queues and reconciliation remain future scope (`LIVE2-01`).
- Backend migration away from managed Supabase remains future scope unless data governance changes.
- Excel export, cross-event analytics, quizzes, word clouds, and broader Slido parity remain outside v1.

</deferred>
