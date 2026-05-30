# Phase 3: Surveys, Results, Presentation, And CSV - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the v1 survey workflow and reporting/export surfaces for QSB Ask. Organisers can create, configure, publish, close, view results for, and export surveys. Participants can submit one response per survey session. Presentation and participant-facing result views show survey results only through safe, organiser-controlled visibility rules. CSV export covers questions, moderation history, and survey responses.

This phase does not handle prolonged reconnect failure hardening, Coolify deployment, DNS/public production readiness, or full UAT. Those remain Phase 4. It also does not introduce quizzes, word clouds, Excel export, cross-event analytics, or broader Slido parity.

</domain>

<decisions>
## Implementation Decisions

### Survey Authoring And Lifecycle
- Reuse the existing authenticated Event Workspace pattern and add survey controls as quiet operational work surfaces, not a separate app shell.
- Keep organiser-only survey authoring server-side, using the existing event role helper pattern rather than client-side role filtering.
- Support the approved v1 question types only: multiple choice, multiple select, rating, and open text.
- Enforce valid publish rules on the server: choice questions need at least two options, rating questions use 1-5 or 1-10, and draft/closed surveys are not participant-submittable.

### Participant Submission And Visibility
- Reuse the existing join/session token model; participant survey actions must validate the event-scoped participant session before reading or writing responses.
- Allow one response per participant session per survey, enforced by database constraints and server-side handling.
- Keep participant results hidden by default and expose them only when the survey's result visibility allows it.
- Public survey/result routes must never render organiser controls, staff metadata, private response identifiers, or unpublished/closed draft content as active forms.

### Results And Presentation
- Use server-derived aggregate DTOs for result charts and open-text data views rather than exposing raw answer rows to public surfaces.
- Render chart-style results with accessible labels, counts, percentages, and data-table alternatives; if no chart dependency exists, use semantic HTML/CSS bars before adding a dependency.
- Presentation View should be a focused display surface without admin controls and should update survey result data under normal conditions within the same 2-second target as Q&A.
- Empty and zero-response states must be explicit, calm, and useful for organisers and presenters.

### CSV Export
- Implement CSV export server-side through route handlers or server actions guarded by organiser access.
- Keep v1 to CSV only; do not add XLSX or reporting dashboards beyond event-level needs.
- Export questions/question versions, moderation actions, and survey responses with stable headers and safe anonymous participant labels.
- Empty exports should show a clear empty-state response or page message instead of silently downloading meaningless empty files.

### the agent's Discretion
- Choose whether to split plans by database, organiser UI, participant flow, results/presentation, and exports based on the smallest safe implementation slices.
- Add a small internal chart component if it keeps accessibility and testing simpler than adding Recharts during v1.
- Add database RPCs only where they materially improve atomicity, aggregation, or RLS clarity.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/events/EventWorkspace.tsx`, `EventAccessPanel.tsx`, and `EventSettingsPanel.tsx` establish the authenticated event workspace composition.
- `src/app/(app)/events/[eventId]/page.tsx` is the current event workspace entry point and can host survey management/results panels.
- `src/app/join/[joinCode]/qna/page.tsx`, `src/app/join/actions.ts`, and `src/lib/participants/session.ts` establish public join/session validation patterns.
- `src/components/qna/PresenterView.tsx`, `AudienceQuestionList.tsx`, and `ConnectionStatus.tsx` establish live-view display and normal reconnect state patterns.
- `src/lib/qna/moderation.ts`, `public.ts`, `presenter.ts`, `submission.ts`, and `voting.ts` show the role-specific helper style to mirror for survey modules.
- Survey tables, enums, and RLS baseline already exist in `supabase/migrations/202605220101_foundation_schema.sql` and generated types.

### Established Patterns
- Server actions live beside route segments for user operations; reusable data and validation logic lives under `src/lib/{domain}`.
- Public surfaces use safe DTOs and restricted status sets at query boundaries.
- Participant cookies store only raw session tokens client-side; database records store hashes.
- UI uses Tailwind and small internal components (`Button`, `Field`, `Badge`, `Alert`) with dense, professional layouts.
- E2E tests cover mobile overflow and visibility-safety for Q&A; Phase 3 should mirror those checks for survey routes.

### Integration Points
- Add survey staff helpers under `src/lib/surveys/` and participant-facing helpers under the same domain boundary.
- Add organiser survey actions/routes inside `src/app/(app)/events/[eventId]/`.
- Add participant survey routes under `src/app/join/[joinCode]/`.
- Add presentation/results route(s) under the authenticated event tree, reusing presenter role access rules where appropriate.
- Add export route handlers under an event-scoped API or app route path guarded by organiser role checks.
- Add migrations only if the existing survey schema needs uniqueness, atomic response submission, realtime publication, or export support improvements.

</code_context>

<specifics>
## Specific Ideas

- Preserve the Phase 2 safety posture: public and presenter surfaces should receive only data they are allowed to display.
- Treat surveys as part of an event workspace, not as a new top-level product area.
- Keep chart visuals readable at a distance for presentation use and usable on mobile for organisers.
- Maintain the v1 capacity target of 300 participants per active event.

</specifics>

<deferred>
## Deferred Ideas

- Prolonged reconnect failure handling and refresh prompts remain Phase 4.
- Coolify deployment, production URL readiness, and full UAT remain Phase 4.
- Excel export remains v2/P1.
- Quizzes, word clouds, idea boards, gamification, AI interactions, and advanced cross-event analytics remain out of v1.

</deferred>
