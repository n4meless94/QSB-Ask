---
quick_id: 260605-vyf
status: planned
created_at: 2026-06-05
title: Fix high-impact code optimizer findings
autonomous: true
subagents: true
files_modified:
  - src/app/(app)/events/[eventId]/page.tsx
  - src/app/(app)/events/[eventId]/presenter/page.tsx
  - src/app/join/[joinCode]/qna/page.tsx
  - src/lib/surveys/results.ts
  - src/components/surveys/SurveySubmitForm.tsx
  - src/components/surveys/SurveyBarChart.tsx
  - tests/surveys/results.test.ts
must_haves:
  truths:
    - "Moderator, presenter, and audience route pages no longer force React remounts from live question updated_at/status/vote_count data."
    - "Organiser workspace and participant Q&A loaders run independent reads concurrently after required auth/session gates."
    - "Survey result aggregation returns the same DTOs and privacy boundaries while avoiding repeated per-question answer scans."
    - "Participant survey submission does not statically pull Recharts into the initial form path before completed visible results need charts."
  artifacts:
    - path: "src/app/(app)/events/[eventId]/page.tsx"
      provides: "Stable route rendering plus parallel organiser/moderator loaders"
    - path: "src/app/(app)/events/[eventId]/presenter/page.tsx"
      provides: "Presenter view without live-data remount key"
    - path: "src/app/join/[joinCode]/qna/page.tsx"
      provides: "Stable audience Q&A rendering plus parallel public question/vote loaders"
    - path: "src/lib/surveys/results.ts"
      provides: "Indexed survey result aggregation"
    - path: "src/components/surveys/SurveySubmitForm.tsx"
      provides: "Participant chart code-splitting boundary"
    - path: "src/components/surveys/SurveyBarChart.tsx"
      provides: "Chart rendering with preserved accessible table fallback"
  key_links:
    - from: "src/app/(app)/events/[eventId]/page.tsx"
      to: "src/components/qna/ModeratorQueue"
      via: "props update, not key-forced remount"
    - from: "src/app/(app)/events/[eventId]/presenter/page.tsx"
      to: "src/components/qna/PresenterView"
      via: "props update, not key-forced remount"
    - from: "src/app/join/[joinCode]/qna/page.tsx"
      to: "src/components/qna/AudienceQuestionList"
      via: "props update, not key-forced remount"
    - from: "src/components/surveys/SurveySubmitForm.tsx"
      to: "src/components/surveys/SurveyBarChart.tsx"
      via: "dynamic import only for completed visible participant results"
verification:
  required:
    - npm run lint
    - npx tsc --noEmit
    - npm test
---

# Fix High-Impact Code Optimizer Findings

## Goal

Fix the read-only code optimizer findings that have direct performance impact without changing product scope, database shape, access rules, or public UX behavior.

## Scope Boundaries

Out of scope for this quick task per user constraint: rate limiting changes, transactional RPC migrations, database indexes, and public list virtualization. Do not add package dependencies, migrations, Supabase RPCs, or broad UI redesigns.

## Subagent Strategy

Use three independent subagents, then one coordinator pass:

- Subagent A: route rendering and loader parallelization in the three route pages.
- Subagent B: survey result aggregation in `src/lib/surveys/results.ts` plus focused aggregation tests.
- Subagent C: participant survey chart code-splitting and chart render cleanup.
- Coordinator: merge, inspect for scope creep, and run final verification.

Do not assign two subagents to the same source file. If a subagent needs a file owned by another subagent, stop and hand that change to the coordinator.

<tasks>

<task type="auto" subagent="route-performance">
  <name>Task 1: Stabilize route rendering and parallelize route loaders</name>
  <files>src/app/(app)/events/[eventId]/page.tsx, src/app/(app)/events/[eventId]/presenter/page.tsx, src/app/join/[joinCode]/qna/page.tsx</files>
  <action>Remove component-level `key` props whose values are built from live question arrays, timestamps, statuses, or vote counts on `ModeratorQueue`, `PresenterView`, and `AudienceQuestionList`; let prop updates and existing realtime refreshes update the components without forced remounts. In `EventDetailPage`, keep auth and `assertEventRole` first, then run organiser-only loaders and moderation loaders with `Promise.all` after `access.role` is known; keep zero/default values for non-organisers and do not call organiser-only loaders for moderator/speaker roles. In participant Q&A, resolve params/searchParams concurrently, short-circuit invalid events before live loaders, and load public questions plus voted question IDs concurrently when a valid non-fixture participant token exists. Preserve the E2E fixture branches and existing access/session boundaries.</action>
  <verify>
    <automated>npm run lint</automated>
    <automated>npx tsc --noEmit</automated>
    <automated>rg -n "key=\\{.*(updated_at|vote_count|status)" -- "src/app/(app)/events/[eventId]/page.tsx" "src/app/(app)/events/[eventId]/presenter/page.tsx" "src/app/join/[joinCode]/qna/page.tsx" returns no matches</automated>
  </verify>
  <done>The three route pages no longer remount child surfaces from changing live row data, and their independent reads are grouped with `Promise.all` without widening auth, role, or participant-session behavior.</done>
</task>

<task type="auto" subagent="survey-aggregation">
  <name>Task 2: Index survey result aggregation</name>
  <files>src/lib/surveys/results.ts, tests/surveys/results.test.ts</files>
  <action>Refactor in-memory survey aggregation so each survey's answers are grouped by response and question with maps/sets instead of repeatedly filtering the full answer array for every question and chart calculation. Preserve `SurveyResult`, `SurveyQuestionResult`, percentages, question/option ordering, open-text labels, presentation-safe omission of open text, and participant visibility/completion gates. Do not change Supabase table queries into RPCs, do not add migrations, and do not add indexes. Extend `tests/surveys/results.test.ts` only where needed to prove cross-survey answers do not contaminate counts and the existing chart/open-text DTO expectations still hold.</action>
  <verify>
    <automated>npm test -- tests/surveys/results.test.ts</automated>
    <automated>npx tsc --noEmit</automated>
  </verify>
  <done>Survey result outputs match existing behavior, participant-visible results still require completion and visibility, staff-only open text remains private, and aggregation no longer depends on repeated full-array scans per question.</done>
</task>

<task type="auto" subagent="participant-chart-cost">
  <name>Task 3: Split participant survey chart cost from the initial form path</name>
  <files>src/components/surveys/SurveySubmitForm.tsx, src/components/surveys/SurveyBarChart.tsx</files>
  <action>Remove the static `SurveyBarChart` import from `SurveySubmitForm.tsx` and load it through `next/dynamic` only inside the completed, results-visible participant results branch. Provide a small accessible loading fallback for the chart area. Keep organiser/results/presentation chart behavior intact. In `SurveyBarChart.tsx`, keep the accessible list/table and zero-response copy while reducing avoidable per-render work in local derivations such as totals, max count, labels, and chart height. Do not remove participant result charts or replace them with a different visualization.</action>
  <verify>
    <automated>npm test -- tests/surveys/results.test.ts tests/surveys/participant.test.ts</automated>
    <automated>npx tsc --noEmit</automated>
    <automated>rg -n "import .*SurveyBarChart" -- "src/components/surveys/SurveySubmitForm.tsx" returns no matches</automated>
  </verify>
  <done>Participant survey forms do not statically import the Recharts-backed chart component before completed visible results are rendered, and existing chart accessibility/data-table behavior remains available when charts load.</done>
</task>

<task type="auto" subagent="coordinator">
  <name>Task 4: Merge, scope check, and full verification</name>
  <files>.planning/quick/260605-vyf-fix-high-impact-code-optimizer-findings-/260605-vyf-SUMMARY.md</files>
  <action>After subagent slices land, inspect the combined diff for file conflicts and scope creep. Confirm no source changes implement rate limiting, transactional RPC migrations, database indexes, or public list virtualization. Run required gates and record command results plus any known caveats in the summary file. If `npm test` is not feasible, run the focused tests from Tasks 2 and 3 and record why the full test suite was not run.</action>
  <verify>
    <automated>npm run lint</automated>
    <automated>npx tsc --noEmit</automated>
    <automated>npm test</automated>
    <automated>git diff --check</automated>
  </verify>
  <done>All required gates pass or any infeasible full-suite gate has a clear reason plus focused test evidence, and the summary documents the fixes without claiming deployment or production readiness.</done>
</task>

</tasks>

## Success Criteria

- No live-data-derived `key` props remain on the top-level moderation, presenter, or audience list components.
- Independent server loaders are parallelized only after their auth/session prerequisites are known.
- Survey result tests prove aggregation behavior and privacy outputs still match expected DTOs.
- Participant survey completion path loads Recharts-backed charts dynamically instead of as part of the initial submit form bundle.
- Required verification commands are run: `npm run lint`, `npx tsc --noEmit`, and `npm test` if feasible.
