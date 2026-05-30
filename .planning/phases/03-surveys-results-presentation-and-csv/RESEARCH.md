# Phase 3: Surveys, Results, Presentation, And CSV - Research

**Researched:** 2026-05-30  
**Domain:** Next.js App Router, Supabase Postgres/RLS/Realtime, survey UI, Recharts, CSV export  
**Confidence:** HIGH for codebase architecture and schema, MEDIUM for Recharts implementation details because Context7 had v3.3.0 docs while npm latest is 3.8.1.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
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

### Deferred Ideas (OUT OF SCOPE)
- Prolonged reconnect failure handling and refresh prompts remain Phase 4.
- Coolify deployment, production URL readiness, and full UAT remain Phase 4.
- Excel export remains v2/P1.
- Quizzes, word clouds, idea boards, gamification, AI interactions, and advanced cross-event analytics remain out of v1.
</user_constraints>

## Summary

Phase 3 should extend the existing Phase 2 architecture instead of introducing a new shell: authenticated organiser work stays under `src/app/(app)/events/[eventId]`, participant survey submission stays under `src/app/join/[joinCode]`, reusable domain logic belongs in `src/lib/surveys`, and display components should follow the current Tailwind/internal component system. [VERIFIED: codebase grep] [VERIFIED: 03-CONTEXT.md]

The database foundation already contains survey status/type enums, `surveys`, `survey_questions`, `survey_options`, `survey_responses`, `survey_answers`, indexes, RLS, and the one-response-per-session uniqueness constraint. [VERIFIED: supabase/migrations/202605220101_foundation_schema.sql] The missing database slice is a Phase 3 migration for survey realtime publication and likely stronger server/RPC support for atomic response+answers submission and publish validation. [VERIFIED: supabase/migrations/202605220204_qna_realtime.sql] [VERIFIED: codebase grep]

**Primary recommendation:** implement Phase 3 as five slices: survey DB/realtime/RPC hardening, organiser survey management, participant submission, aggregate results/presentation with Recharts plus accessible tables, and organiser-only CSV route handlers. [VERIFIED: 03-CONTEXT.md] [VERIFIED: Context7 /vercel/next.js] [VERIFIED: Context7 /supabase/supabase] [VERIFIED: Context7 /recharts/recharts]

## Project Constraints (from AGENTS.md)

- Build only from approved URS, PRD, SPEC, SRS, and `.planning/` artifacts to avoid scope drift. [VERIFIED: AGENTS.md]
- Use managed Supabase for v1 Auth, Postgres, RLS, Realtime, and data storage. [VERIFIED: AGENTS.md]
- Next.js must deploy as a Coolify-managed resource on QSB VPS; Phase 3 must not add an alternate long-lived deployment model. [VERIFIED: AGENTS.md]
- Core live views must update within 2 seconds in normal conditions. [VERIFIED: AGENTS.md]
- Public views must never show pending, dismissed, or archived questions before moderator/organiser control. [VERIFIED: AGENTS.md]
- v1 export format is CSV only. [VERIFIED: AGENTS.md]
- Core flows target WCAG 2.1 AA and audience screens must be mobile-friendly. [VERIFIED: AGENTS.md]
- v1 capacity target is 300 participants per active event. [VERIFIED: AGENTS.md]
- Before file-changing implementation work, use GSD workflow entry points; this research file is the requested planning artifact. [VERIFIED: AGENTS.md]

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LIVE-05 | Presentation View shows survey charts without admin controls and updates results within 2 seconds. | Use aggregate survey DTOs, presentation route under authenticated event tree, survey realtime subscription, and no admin/export controls. [VERIFIED: .planning/REQUIREMENTS.md] |
| SURV-01 | Organiser can create a survey with title and draft/published/closed status. | Use organiser-only `src/lib/surveys/management.ts` plus Event Workspace tab/actions. [VERIFIED: 03-CONTEXT.md] |
| SURV-02 | Organiser can add multiple choice questions with at least two options. | Existing enum/table supports `multiple_choice`; server publish validation must enforce two options. [VERIFIED: supabase/migrations/202605220101_foundation_schema.sql] |
| SURV-03 | Organiser can add multiple select questions with at least two options. | Existing enum/table supports `multiple_select`; answer storage uses `selected_option_ids uuid[]`. [VERIFIED: supabase/migrations/202605220101_foundation_schema.sql] |
| SURV-04 | Organiser can add rating questions with 1-5 or 1-10 scale. | Existing DB check allows rating scale 5 or 10 for rating questions. [VERIFIED: supabase/migrations/202605220101_foundation_schema.sql] |
| SURV-05 | Organiser can add open text survey questions. | Existing enum supports `open_text`; answers can store `text_value`. [VERIFIED: supabase/migrations/202605220101_foundation_schema.sql] |
| SURV-06 | Organiser can publish and close a valid survey. | Add server actions/RPC-style helpers; do not rely on client-side validation alone. [VERIFIED: 03-CONTEXT.md] |
| SURV-07 | Organiser can set result visibility per survey, hidden by default. | `results_visible_to_participants boolean default false` already exists. [VERIFIED: supabase/migrations/202605220101_foundation_schema.sql] |
| SURV-08 | Participant can submit one response per survey session. | Unique constraint `(survey_id, participant_session_id)` already exists; add atomic response+answers write. [VERIFIED: supabase/migrations/202605220101_foundation_schema.sql] |
| SURV-09 | Participant sees results only when organiser enabled visibility. | Add participant result helper that returns aggregates only when `results_visible_to_participants=true`. [VERIFIED: 03-CONTEXT.md] |
| SURV-10 | Organiser can view response counts. | Aggregate on `survey_responses` per survey/question. [VERIFIED: supabase/migrations/202605220101_foundation_schema.sql] |
| SURV-11 | Organiser can view chart results for choice/rating. | Use Recharts `BarChart`/`ResponsiveContainer` or internal semantic bars with table fallback. [VERIFIED: Context7 /recharts/recharts] |
| SURV-12 | Organiser can view open text responses. | Staff-only open text DTO can read `survey_answers.text_value` through event-member RLS. [VERIFIED: supabase/migrations/202605220101_foundation_schema.sql] |
| SURV-13 | Charts include readable labels, values, and accessible data table alternatives. | Recharts v3 has default accessibility layer, but UI-SPEC still requires adjacent tables and visible labels. [VERIFIED: Context7 /recharts/recharts] [VERIFIED: 03-UI-SPEC.md] |
| EXPT-01 | Organiser can export questions and question versions as CSV. | Route handler guarded by organiser access should join `questions` and `question_versions`. [VERIFIED: supabase/migrations/202605220101_foundation_schema.sql] |
| EXPT-02 | Organiser can export moderation action history as CSV. | Route handler guarded by organiser access should read `moderation_actions`. [VERIFIED: supabase/migrations/202605220101_foundation_schema.sql] |
| EXPT-03 | Organiser can export survey responses as CSV. | Route handler guarded by organiser access should flatten survey response/answer rows. [VERIFIED: supabase/migrations/202605220101_foundation_schema.sql] |
| EXPT-04 | Exports include anonymous participants as Anonymous with per-session audit identifier. | Use participant session id or a stable derived short id in CSV; never export raw participant token/hash. [VERIFIED: 03-CONTEXT.md] [ASSUMED] |
| EXPT-05 | Empty export with no records shows empty-state instead of downloading empty file. | Export tab should prefetch counts and route handlers should reject empty downloads with a clear non-download response. [VERIFIED: 03-UI-SPEC.md] |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Survey authoring/lifecycle | API / Backend | Frontend Server (SSR) | Organiser role checks, publish validation, and status changes must run server-side; workspace UI renders forms and states. [VERIFIED: 03-CONTEXT.md] |
| Participant survey submission | API / Backend | Browser / Client | Session token validation and one-response enforcement belong server-side; browser owns form state only. [VERIFIED: 03-CONTEXT.md] |
| Result aggregation | API / Backend | Database / Storage | Public/presentation surfaces must receive aggregate DTOs, not raw answer rows. [VERIFIED: 03-CONTEXT.md] |
| Chart rendering | Browser / Client | Frontend Server (SSR) | Recharts is a React chart library; server prepares serializable chart data. [VERIFIED: Context7 /recharts/recharts] |
| Realtime refresh | Browser / Client | Supabase Realtime | Current Q&A pattern subscribes in client components and refreshes server-rendered safe data. [VERIFIED: src/lib/qna/realtime.ts] |
| CSV export | Frontend Server (SSR) | API / Backend | Next route handlers can return `Response` with `text/csv` and attachment headers; organiser guard runs before data serialization. [VERIFIED: Context7 /vercel/next.js] |
| Persistence/RLS | Database / Storage | API / Backend | Existing Supabase schema/RLS owns visibility and uniqueness; server helpers add business validation. [VERIFIED: supabase/migrations/202605220101_foundation_schema.sql] |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | repo uses `^16.2.2`; npm latest `16.2.6` modified 2026-05-30 | App Router pages, server actions, route handlers, SSR. | Existing stack and official docs support route handlers returning CSV `Response` and server actions for mutations. [VERIFIED: package.json] [VERIFIED: npm registry] [VERIFIED: Context7 /vercel/next.js] |
| `react` / `react-dom` | repo uses `^19.2.0` | Client components, forms, chart rendering. | Existing Next 16 app stack. [VERIFIED: package.json] |
| `@supabase/supabase-js` | repo uses `^2.106.1`; npm latest `2.106.2` modified 2026-05-28 | Typed database calls and realtime subscriptions. | Existing app uses Supabase v2 `channel().on("postgres_changes")` pattern. [VERIFIED: package.json] [VERIFIED: src/lib/qna/realtime.ts] [VERIFIED: Context7 /supabase/supabase] |
| `@supabase/ssr` | repo/latest `0.10.3` modified 2026-05-07 | Server/browser Supabase clients with Next cookies. | Existing `createSupabaseServerClient` and browser client use this package. [VERIFIED: package.json] [VERIFIED: src/lib/supabase/server.ts] |
| `recharts` | npm latest `3.8.1`, modified 2026-05-24 | Survey result charts for choice/rating data. | Approved stack names Recharts 3.x, Context7 resolves official Recharts package, slopcheck rated package OK, and npm package has no `postinstall`. [VERIFIED: .planning/research/STACK.md] [VERIFIED: Context7 /recharts/recharts] [VERIFIED: npm registry] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vitest` | repo uses `^4.0.0` | Unit tests for survey helpers, CSV serializers, migration text checks. | Use for fast Phase 3 logic and SQL-fragment validation. [VERIFIED: package.json] [VERIFIED: vitest.config.ts] |
| `@playwright/test` | repo uses `^1.58.2` | E2E/mobile/live-view checks. | Use for participant submission, presentation no-admin-controls, export empty-state, and realtime smoke tests. [VERIFIED: package.json] [VERIFIED: playwright.config.ts] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `recharts` | Internal Tailwind/HTML bar chart | UI-SPEC allows internal bars, but approved stack already selected Recharts 3.x and package legitimacy is OK; still provide table alternatives either way. [VERIFIED: 03-UI-SPEC.md] [VERIFIED: npm registry] |
| Route handlers for CSV | Server actions returning URLs | Next route handlers map directly to downloadable `Response` headers; server actions are better for mutations/forms. [VERIFIED: Context7 /vercel/next.js] |
| Ad hoc client aggregation | Server-derived aggregate DTOs | Client aggregation risks exposing raw answers on public/presentation surfaces. [VERIFIED: 03-CONTEXT.md] |

**Installation:**

```bash
npm install recharts@3.8.1
```

**Version verification:** `npm view recharts version time.created time.modified repository.url scripts.postinstall --json` returned `3.8.1`, created `2015-08-07T07:04:41.432Z`, modified `2026-05-24T02:51:41.541Z`, repository `github.com/recharts/recharts`, and no `postinstall` field. [VERIFIED: npm registry]

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `recharts` | npm | created 2015-08-07 | 46,937,341 downloads last week | `github.com/recharts/recharts` | OK | Approved; add as explicit dependency before chart implementation. [VERIFIED: npm registry] |

**Packages removed due to slopcheck [SLOP] verdict:** none. [VERIFIED: slopcheck]  
**Packages flagged as suspicious [SUS]:** none. [VERIFIED: slopcheck]  
**Audit note:** `slopcheck install recharts --json` is unsupported by the installed slopcheck; `slopcheck install recharts` printed `[OK] recharts (npm)` before its Windows wrapper failed while attempting to run npm. No package file changed. [VERIFIED: slopcheck]

## Architecture Patterns

### System Architecture Diagram

```text
Organiser Event Workspace
  -> Server action / src/lib/surveys/management.ts
  -> Supabase surveys/questions/options with organiser RLS
  -> publish/close validation

Participant /join/{joinCode}/surveys
  -> HTTP-only participant cookie
  -> validateParticipantSession(eventId, rawToken)
  -> atomic response + answers insert
  -> completion or visibility-gated aggregate results

Results / Presentation
  -> server aggregate DTOs from survey_responses/survey_answers
  -> Recharts/client chart component + table fallback
  -> Supabase realtime postgres_changes on survey tables
  -> router.refresh() to reload safe server data

Exports Tab
  -> organiser-only route handler
  -> event-scoped query
  -> CSV serialization with stable headers
  -> Response(text/csv + Content-Disposition) or empty-state response
```

### Recommended Project Structure

```text
src/
├── app/(app)/events/[eventId]/
│   ├── survey-actions.ts
│   ├── export/
│   │   └── [kind]/route.ts
│   └── presentation/
│       └── surveys/[surveyId]/page.tsx
├── app/join/[joinCode]/surveys/
│   ├── page.tsx
│   └── submit-actions.ts
├── components/surveys/
│   ├── SurveyEditor.tsx
│   ├── SurveyResultsPanel.tsx
│   ├── SurveyPresentationView.tsx
│   ├── SurveySubmitForm.tsx
│   ├── SurveyBarChart.tsx
│   └── ExportPanel.tsx
└── lib/surveys/
    ├── management.ts
    ├── participant.ts
    ├── results.ts
    ├── realtime.ts
    ├── export.ts
    └── validation.ts
```

### Pattern 1: Role-Specific Survey Helpers

**What:** Mirror `src/lib/qna` by separating organiser management, participant submission, results/presentation, realtime, and export helpers. [VERIFIED: src/lib/qna]  
**When to use:** Every route/action should call the helper matching its trust boundary. [VERIFIED: 03-CONTEXT.md]

```typescript
// Source: src/lib/events/access.ts + src/lib/qna/moderation.ts
export async function listOrganiserSurveys(userId: string, eventId: string) {
  await assertEventRole(userId, eventId, EVENT_MANAGEMENT_ROLES);
  const supabase = await createSupabaseServerClient();
  return supabase.from("surveys").select("id,title,status,results_visible_to_participants,updated_at").eq("event_id", eventId);
}
```

### Pattern 2: Server-Derived Aggregate DTOs

**What:** Convert raw responses into `{ questionId, label, count, percentage }` DTOs before passing to public/presentation components. [VERIFIED: 03-CONTEXT.md]  
**When to use:** Organiser results, participant-visible results, and presentation view. [VERIFIED: 03-UI-SPEC.md]

```typescript
// Source: 03-CONTEXT.md aggregate DTO decision
export type SurveyChoiceDatum = {
  label: string;
  count: number;
  percentage: number;
};
```

### Pattern 3: CSV Route Handler

**What:** Use an App Router `route.ts` `GET` that validates organiser access, returns a non-download empty state for zero records, and otherwise returns CSV headers. [VERIFIED: Context7 /vercel/next.js]  
**When to use:** `questions`, `moderation`, and `survey-responses` export kinds. [VERIFIED: .planning/REQUIREMENTS.md]

```typescript
// Source: Context7 /vercel/next.js Route Handler Response pattern
return new Response(csvText, {
  headers: {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": 'attachment; filename="qsb-ask-survey-responses.csv"',
  },
});
```

### Anti-Patterns to Avoid

- **Client-side role filtering:** Do not render organiser controls and merely hide them in the browser; existing patterns use server role assertions. [VERIFIED: src/lib/events/access.ts]
- **Raw answer rows in public/presentation props:** Public surfaces should receive aggregates only. [VERIFIED: 03-CONTEXT.md]
- **Blank CSV downloads:** Requirement EXPT-05 requires empty-state handling. [VERIFIED: .planning/REQUIREMENTS.md]
- **Realtime payload trust:** Current Q&A realtime callbacks refresh safe server data instead of storing raw row payloads; surveys should copy that pattern. [VERIFIED: src/lib/qna/realtime.ts]
- **Adding XLSX/report dashboards:** v1 is CSV only and advanced reporting is out of scope. [VERIFIED: .planning/REQUIREMENTS.md] [VERIFIED: 03-CONTEXT.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Survey chart primitives | Custom SVG chart engine | `recharts@3.8.1` plus adjacent table fallback | Recharts provides React bar chart composition and default accessibility layer in v3; project still needs visible labels/tables. [VERIFIED: Context7 /recharts/recharts] |
| CSV HTTP download mechanics | Custom API abstraction | Next route handlers returning `Response` | Official Next docs show route handlers returning `text/csv` and `Content-Disposition`. [VERIFIED: Context7 /vercel/next.js] |
| Role authorization | Client-side checks | `assertEventRole` with `EVENT_MANAGEMENT_ROLES`, `MODERATION_ROLES`, `PRESENTER_ROLES` | Existing Phase 2 helpers already encode role gates. [VERIFIED: src/lib/events/access.ts] |
| Participant identity/session validation | Trusting a session id from form data | `validateParticipantSession(eventId, rawToken)` from HTTP-only cookie | Existing participant model stores raw token client-side and hash in DB. [VERIFIED: src/lib/participants/session.ts] |
| Realtime reconnect framework | New websocket client | Existing Supabase browser client and `ConnectionStatus` pattern | Q&A already uses `channel().on("postgres_changes")` and basic live/reconnecting/refresh-needed states. [VERIFIED: src/lib/qna/realtime.ts] |

**Key insight:** Phase 3 complexity is not chart drawing; it is preserving trust boundaries while transforming survey answers into safe aggregates and exports. [VERIFIED: 03-CONTEXT.md]

## DB, RLS, And Migration Findings

| Area | Finding | Action |
|------|---------|--------|
| Survey schema | Tables/enums for surveys, questions, options, responses, and answers already exist. [VERIFIED: supabase/migrations/202605220101_foundation_schema.sql] | Do not recreate tables; add incremental migrations only. |
| One response per session | `survey_responses_one_per_session unique (survey_id, participant_session_id)` exists. [VERIFIED: supabase/migrations/202605220101_foundation_schema.sql] | Surface duplicate submission as "already submitted"; avoid second response insert. |
| Publish validity | DB checks cover nonblank prompts, positions, rating scale, but not "choice/select have at least two options" or "survey has at least one question". [VERIFIED: supabase/migrations/202605220101_foundation_schema.sql] | Enforce in server helper/RPC before changing status to `published`. |
| Results visibility | `results_visible_to_participants default false` exists. [VERIFIED: supabase/migrations/202605220101_foundation_schema.sql] | Add participant result helper that checks this flag before returning aggregates. |
| Participant published reads | RLS allows participants to select published surveys/questions/options for current event session. [VERIFIED: supabase/migrations/202605220101_foundation_schema.sql] | Keep public route query boundary to published surveys only. |
| Answers validation | DB permits answer columns but does not enforce exactly-one answer shape per question type. [VERIFIED: supabase/migrations/202605220101_foundation_schema.sql] | Validate answer shape server-side; consider an RPC for response+answers transaction. |
| Realtime publication | Current realtime migration adds `questions`, `question_votes`, and `moderation_actions` only. [VERIFIED: supabase/migrations/202605220204_qna_realtime.sql] | Add `surveys`, `survey_responses`, and `survey_answers`; add `survey_questions/options` if authoring live refresh is needed. |

## Common Pitfalls

### Pitfall 1: Non-Atomic Survey Submission
**What goes wrong:** A response row inserts but one or more answer rows fail, leaving incomplete survey data. [ASSUMED]  
**Why it happens:** The current Q&A submission helper performs two separate inserts for question and version history; surveys require more rows per submission. [VERIFIED: src/lib/qna/submission.ts]  
**How to avoid:** Prefer a Postgres RPC for response+answers or compensate with explicit transaction-safe design. [ASSUMED]  
**Warning signs:** Survey response count increments while chart totals do not match submitted answers. [ASSUMED]

### Pitfall 2: Participant Result Leakage
**What goes wrong:** Participant-visible routes expose raw open text rows or hidden aggregates. [VERIFIED: 03-CONTEXT.md]  
**Why it happens:** Reusing organiser result helpers on public routes skips visibility rules. [ASSUMED]  
**How to avoid:** Maintain separate `getOrganiserSurveyResults`, `getPresentationSurveyResults`, and `getParticipantVisibleSurveyResults` helpers. [VERIFIED: src/lib/qna pattern]  
**Warning signs:** Public markup contains response ids, emails, token hashes, or hidden-result data. [VERIFIED: 03-UI-SPEC.md]

### Pitfall 3: Realtime Without Publication
**What goes wrong:** Client subscribes successfully but receives no survey table changes. [ASSUMED]  
**Why it happens:** Supabase Postgres Changes require tables in `supabase_realtime` publication. [VERIFIED: Context7 /supabase/supabase]  
**How to avoid:** Add survey tables to publication in a migration and test presentation update within 2 seconds. [VERIFIED: supabase/migrations/202605220204_qna_realtime.sql]  
**Warning signs:** Manual refresh shows new results but presentation view does not update. [ASSUMED]

### Pitfall 4: Chart Accessibility Treated As Library-Solved
**What goes wrong:** Charts are keyboard reachable but labels/tables are insufficient for WCAG and corporate reporting. [VERIFIED: 03-UI-SPEC.md]  
**Why it happens:** Recharts v3 provides a default accessibility layer, but the project requires visible labels, values, percentages, and adjacent tables. [VERIFIED: Context7 /recharts/recharts] [VERIFIED: 03-UI-SPEC.md]  
**How to avoid:** Implement `SurveyBarChart` as chart plus table, not chart alone. [VERIFIED: 03-UI-SPEC.md]  
**Warning signs:** Chart data exists only in tooltip or color-coded bars. [VERIFIED: 03-UI-SPEC.md]

### Pitfall 5: Blank CSV Downloads
**What goes wrong:** User downloads a zero-byte or header-only CSV and interprets it as broken export. [VERIFIED: .planning/REQUIREMENTS.md]  
**Why it happens:** Route handler does not coordinate with export counts/empty state. [ASSUMED]  
**How to avoid:** Export panel fetches counts; route handler returns a clear non-download empty-state response for zero rows. [VERIFIED: 03-UI-SPEC.md]  
**Warning signs:** `Download CSV` button is enabled with `0` records. [VERIFIED: 03-UI-SPEC.md]

## Code Examples

### Supabase Realtime Subscription

```typescript
// Source: Context7 /supabase/supabase and src/lib/qna/realtime.ts
const channel = supabase
  .channel(`qsb-ask-surveys-${eventId}`)
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "survey_responses", filter: `survey_id=eq.${surveyId}` },
    () => onRefresh(),
  )
  .subscribe();
```

### Recharts Bar Chart Wrapper

```tsx
// Source: Context7 /recharts/recharts
<ResponsiveContainer width="100%" height={320}>
  <BarChart data={data}>
    <XAxis dataKey="label" />
    <YAxis allowDecimals={false} />
    <Tooltip />
    <Bar dataKey="count" fill="#0F766E" />
  </BarChart>
</ResponsiveContainer>
```

### CSV Escaping Helper

```typescript
// Source: RFC-style CSV practice [ASSUMED]
export function csvCell(value: unknown) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Next API routes for downloads | App Router route handlers returning `Response` | App Router era; verified in Next v16.2.2 docs | Use `route.ts` for CSV, not Pages Router API routes. [VERIFIED: Context7 /vercel/next.js] |
| Supabase v1 `.from(...).on(...)` realtime | Supabase v2 `channel().on("postgres_changes")` | Supabase JS v2 docs/blog in Context7 | Follow current Q&A code pattern. [VERIFIED: Context7 /supabase/supabase] [VERIFIED: src/lib/qna/realtime.ts] |
| Chart-only visual reporting | Chart plus accessible data table | Required by Phase 3 UI-SPEC | Every chart result needs adjacent table values. [VERIFIED: 03-UI-SPEC.md] |

**Deprecated/outdated:**
- Pages Router API routes for new CSV work: this app is App Router-based. [VERIFIED: codebase grep] [VERIFIED: Context7 /vercel/next.js]
- Raw realtime payload rendering: Phase 2 uses realtime events as refresh triggers, not display payloads. [VERIFIED: src/lib/qna/realtime.ts] [VERIFIED: 03-CONTEXT.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | CSV anonymous audit identifier can be participant session id or stable derived short id. | Phase Requirements | May require a user decision if raw UUIDs are considered too revealing for audit exports. |
| A2 | Postgres RPC is preferred for atomic survey submission if multi-row inserts cannot be safely handled from server code. | Pitfalls | Planner may choose server-side sequential inserts and need stronger compensating tests. |
| A3 | CSV escaping helper follows standard double-quote escaping practice. | Code Examples | Incorrect escaping could corrupt exports with commas/newlines/quotes. |

## Open Questions

1. **Anonymous audit identifier format**
   - What we know: EXPT-04 requires `Anonymous` plus a per-session audit identifier. [VERIFIED: .planning/REQUIREMENTS.md]
   - What's unclear: Whether QSB wants full UUIDs, short deterministic ids, or event-local sequence labels. [ASSUMED]
   - Recommendation: Use `Anonymous (<short participant_session_id>)` for v1 unless user governance requires a different label. [ASSUMED]

2. **Recharts versus internal bars**
   - What we know: `.planning/research/STACK.md` approves Recharts 3.x, npm/latest is `3.8.1`, and `package.json` lacks it. [VERIFIED: .planning/research/STACK.md] [VERIFIED: npm registry]
   - What's unclear: UI-SPEC allows internal bars if that keeps v1 simpler. [VERIFIED: 03-UI-SPEC.md]
   - Recommendation: Install `recharts@3.8.1` because the stack already approved it and legitimacy checks passed; still keep the chart wrapper small. [VERIFIED: npm registry]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Next/Vitest/Playwright | yes | v24.14.0 | none needed. [VERIFIED: shell] |
| npm | Package install/scripts | yes | 11.6.2 | none needed. [VERIFIED: shell] |
| Supabase CLI | Local migration reset/type generation | no | - | Planner should add install/use-existing-container step or run SQL text tests only. [VERIFIED: shell] |
| Docker CLI | Supabase local services | partial | 29.4.1 client; engine not reachable | Do not assume local Supabase reset can run until Docker engine is available. [VERIFIED: shell] |
| Git | Optional docs commit/status | yes | 2.52.0.windows.1 | If OneDrive Git errors appear, use direct file/artifact verification. [VERIFIED: shell] |

**Missing dependencies with no fallback:**
- Supabase CLI and reachable Docker engine block local Supabase reset/type generation unless installed/started before execution. [VERIFIED: shell]

**Missing dependencies with fallback:**
- Migration SQL can still be covered by Vitest text checks like `tests/db/foundation-schema.test.ts`. [VERIFIED: tests/db/foundation-schema.test.ts]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest `^4.0.0` and Playwright `^1.58.2`. [VERIFIED: package.json] |
| Config file | `vitest.config.ts`, `playwright.config.ts`. [VERIFIED: codebase grep] |
| Quick run command | `npm test -- tests/surveys` after Wave 0 tests exist. [VERIFIED: package.json] |
| Full suite command | `npm test && npm run lint && npm run test:e2e`. [VERIFIED: package.json] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| LIVE-05 | Presentation updates survey results within 2 seconds and has no admin controls. | e2e | `npm run test:e2e -- survey-presentation.spec.ts` | No, Wave 0. |
| SURV-01..SURV-07 | Organiser creates, edits, validates, publishes, closes, and toggles visibility. | unit + e2e | `npm test -- tests/surveys/management.test.ts && npm run test:e2e -- surveys-management.spec.ts` | No, Wave 0. |
| SURV-08..SURV-09 | Participant submits one response and sees results only when visible. | unit + e2e | `npm test -- tests/surveys/participant.test.ts && npm run test:e2e -- survey-submission.spec.ts` | No, Wave 0. |
| SURV-10..SURV-13 | Results counts/charts/open text/tables are correct and accessible. | unit + e2e | `npm test -- tests/surveys/results.test.ts && npm run test:e2e -- survey-results.spec.ts` | No, Wave 0. |
| EXPT-01..EXPT-05 | CSV exports have stable headers, safe anonymous labels, and empty-state handling. | unit + route/e2e | `npm test -- tests/surveys/export.test.ts && npm run test:e2e -- csv-exports.spec.ts` | No, Wave 0. |

### Sampling Rate

- **Per task commit:** run focused Vitest file for touched survey/export helper. [VERIFIED: package.json]
- **Per wave merge:** run `npm test && npm run lint`. [VERIFIED: package.json]
- **Phase gate:** run full suite plus targeted Playwright Phase 3 specs before `$gsd-verify-work`. [VERIFIED: package.json]

### Wave 0 Gaps

- [ ] `tests/surveys/management.test.ts` - covers SURV-01 to SURV-07. [VERIFIED: no existing file]
- [ ] `tests/surveys/participant.test.ts` - covers SURV-08 and SURV-09. [VERIFIED: no existing file]
- [ ] `tests/surveys/results.test.ts` - covers SURV-10 to SURV-13. [VERIFIED: no existing file]
- [ ] `tests/surveys/export.test.ts` - covers EXPT-01 to EXPT-05. [VERIFIED: no existing file]
- [ ] `tests/db/survey-realtime.test.ts` - covers survey realtime publication migration. [VERIFIED: no existing file]
- [ ] `tests/e2e/surveys-management.spec.ts`, `survey-submission.spec.ts`, `survey-results.spec.ts`, `survey-presentation.spec.ts`, `csv-exports.spec.ts`. [VERIFIED: no existing file]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | Existing Supabase Auth and server-side `getUser()` for protected routes. [VERIFIED: src/app/(app)/events/[eventId]/page.tsx] |
| V3 Session Management | yes | Existing HTTP-only participant cookies plus SHA-256 token hashes. [VERIFIED: src/lib/participants/session.ts] |
| V4 Access Control | yes | `assertEventRole` and Supabase RLS per event role. [VERIFIED: src/lib/events/access.ts] [VERIFIED: supabase/migrations/202605220101_foundation_schema.sql] |
| V5 Input Validation | yes | Server validation for survey title/questions/options/rating/answers; no new validation library required. [VERIFIED: 03-CONTEXT.md] |
| V6 Cryptography | yes | Continue using Node crypto for token hashing; do not hand-roll crypto. [VERIFIED: src/lib/participants/session.ts] |
| V8 Data Protection | yes | Do not expose raw response ids, participant emails, raw tokens, or token hashes in public/presentation UI. [VERIFIED: 03-UI-SPEC.md] |
| V13 API and Web Service | yes | CSV route handlers must validate organiser role before querying event data. [VERIFIED: 03-CONTEXT.md] |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Participant submits duplicate survey response | Tampering | DB unique constraint plus duplicate-aware server action response. [VERIFIED: supabase/migrations/202605220101_foundation_schema.sql] |
| Participant accesses hidden results | Information Disclosure | Visibility-gated aggregate helper and RLS-safe public routes. [VERIFIED: 03-CONTEXT.md] |
| Staff export exposes session token/hash | Information Disclosure | CSV serializer must use safe participant labels only. [VERIFIED: 03-UI-SPEC.md] |
| Formula injection in CSV | Tampering | Prefix or escape values beginning with `=`, `+`, `-`, `@` before CSV serialization. [ASSUMED] |
| Client-side role bypass | Elevation of Privilege | Server route/action access assertions before every mutation/export. [VERIFIED: src/lib/events/access.ts] |

## Sources

### Primary (HIGH confidence)
- `AGENTS.md` - project constraints, stack, GSD workflow rules. [VERIFIED: file read]
- `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `03-CONTEXT.md`, `03-UI-SPEC.md` - phase scope and UI/security constraints. [VERIFIED: file read]
- `supabase/migrations/202605220101_foundation_schema.sql` - survey schema, indexes, constraints, and RLS. [VERIFIED: file read]
- `supabase/migrations/202605220204_qna_realtime.sql` - current Q&A-only realtime publication migration. [VERIFIED: file read]
- `src/lib/qna`, `src/components/qna`, `src/components/events`, `src/app/(app)/events/[eventId]`, `src/app/join/[joinCode]/qna` - established implementation patterns. [VERIFIED: codebase grep]
- Context7 `/vercel/next.js/v16.2.2` - route handler `Response` and server action mutation patterns. [VERIFIED: Context7]
- Context7 `/supabase/supabase` - Postgres Changes subscription/publication pattern. [VERIFIED: Context7]
- Context7 `/recharts/recharts/v3.3.0` - Recharts composition/accessibility examples. [VERIFIED: Context7]

### Secondary (MEDIUM confidence)
- npm registry metadata for `next`, `@supabase/supabase-js`, `@supabase/ssr`, and `recharts`. [VERIFIED: npm registry]
- slopcheck package legitimacy output for `recharts`. [VERIFIED: slopcheck]

### Tertiary (LOW confidence)
- CSV formula-injection mitigation details and exact anonymous audit-id format are marked `[ASSUMED]` pending implementation/user confirmation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - existing package versions verified and Recharts package audited. [VERIFIED: package.json] [VERIFIED: npm registry]
- Architecture: HIGH - based on existing Phase 2 source patterns and locked Phase 3 context. [VERIFIED: codebase grep] [VERIFIED: 03-CONTEXT.md]
- Pitfalls: MEDIUM - most are grounded in schema/context; atomicity and CSV details need implementation validation. [VERIFIED: supabase/migrations/202605220101_foundation_schema.sql] [ASSUMED]

**Research date:** 2026-05-30  
**Valid until:** 2026-06-06 for npm/version specifics; 2026-06-29 for codebase architecture if Phase 3 has not started.
