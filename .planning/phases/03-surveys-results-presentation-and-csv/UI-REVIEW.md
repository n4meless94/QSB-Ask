# Phase 3 - UI Review

**Audited:** 2026-05-30T12:27:43+08:00
**Baseline:** `.planning/phases/03-surveys-results-presentation-and-csv/03-UI-SPEC.md`
**Screenshots:** not captured (no dev server at localhost ports 3000, 5173, or 8080)

---

## Fix Pass - 2026-05-30

The blocker-level workflow findings were addressed after this audit:

- Survey authoring no longer binds permanently to the first survey; survey rows are keyboard-operable links using `?tab=surveys&surveyId=...`.
- Results no longer bind permanently to the first result; `SurveyResultsPanel` includes a selector and uses `?tab=results&resultSurveyId=...`.
- Full verification after the fix pass passed: `npm test`, `npm run lint`, `npx tsc --noEmit`, and the five Phase 3 E2E specs.

Remaining UI warnings are polish/backlog items rather than completion blockers: nested bordered surfaces, exact UI-SPEC copy drift, close confirmation, and richer export loading/error states.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 2/4 | Several required UI-SPEC strings are missing or changed, including survey empty and publish validation body copy. |
| 2. Visuals | 2/4 | Core operational hierarchy is incomplete: survey/results lists are not selectable and rows omit required scan metadata. |
| 3. Color | 3/4 | Palette mostly follows slate/white/teal/amber/red, but accent use is broad and chart colors are hardcoded in component code. |
| 4. Typography | 3/4 | Size scale mostly matches the contract, but `font-medium` introduces an undeclared 500 weight. |
| 5. Spacing | 2/4 | Nested bordered panels and undeclared 20px spacing tokens (`gap-5`, `p-5`, `pb-5`) conflict with the spacing/no-nested-card contract. |
| 6. Experience Design | 2/4 | Destructive close lacks confirmation, export/loading/error states are incomplete, and multi-survey workflows are blocked. |

**Overall: 14/24**

---

## Top 3 Priority Fixes

1. **Make survey and results selection real** - organisers cannot select or manage any survey except the first one - replace first-item binding with route/query state or client tab state, and make survey/result rows keyboard-operable buttons/links.
2. **Remove nested card structure in survey/results/export panels** - dense operational UI reads as cards inside cards and violates the UI-SPEC - keep one outer workspace section and convert inner rows to border-separated lists/tables without full bordered card containers.
3. **Add required confirmation and state handling** - `Close survey` can be submitted without the specified confirmation and exports have no generating/error retry UI - add a 480px confirmation dialog, restore focus, preserve button width while saving, and render inline export retry errors.

---

## Detailed Findings

### Pillar 1: Copywriting (2/4)

- WARNING - Survey empty body copy does not match the UI-SPEC. Required: "Create a survey to collect structured feedback during this event." Actual: "Create a draft survey before adding questions." See `src/components/surveys/SurveyList.tsx:46-49`.
- WARNING - Publish validation body copy does not match the UI-SPEC. Required: "Fix the highlighted questions before publishing this survey." Actual fallback is "Complete the survey title and add at least one question." See `src/components/surveys/SurveyEditor.tsx:190-200`.
- WARNING - Participant completion state combines success copy with an already-submitted message, which can read as both a fresh submission and a duplicate state. See `src/components/surveys/SurveySubmitForm.tsx:57-64`.
- WARNING - Participant page intro uses internal/product phrasing: "Submit the active event survey from this public participant view." The UI-SPEC asks for participant-safe, event/survey-focused language. See `src/app/join/[joinCode]/surveys/page.tsx:221-226`.
- PASS - Several required CTAs are present: "Create survey", "Publish survey", "Save draft", "Submit survey", "Save visibility", "Open presentation view", and "Download CSV".

### Pillar 2: Visuals (2/4)

- BLOCKER - The survey list is visual only; rows render as `div` elements with no link/button/action, and `EventDetailContent` always selects `surveys[0]`. Organisers cannot select or edit any survey except the first one. See `src/app/(app)/events/[eventId]/page.tsx:143` and `src/components/surveys/SurveyList.tsx:52-75`.
- BLOCKER - Results also bind to the first result only (`const selected = results[0]`) and provide no survey selector/list, despite the UI-SPEC requiring a survey selector/list and result context per survey. See `src/components/surveys/SurveyResultsPanel.tsx:42-44`.
- WARNING - Survey list rows omit required scan metadata: response count, result visibility, updated time, and actions. They show only title/status/question count. See `src/components/surveys/SurveyList.tsx:60-74`.
- WARNING - Nested bordered white surfaces appear throughout Phase 3: the Surveys workspace wraps `SurveyList` and `SurveyEditor` inside a bordered white section, Results wraps summary/chart cards inside another bordered white section, and Exports wraps rows inside a bordered white panel. See `src/app/(app)/events/[eventId]/page.tsx:195-218`, `src/components/surveys/SurveyResultsPanel.tsx:46-48` plus `:71-144`, and `src/components/surveys/ExportPanel.tsx:39-92`.
- PASS - No marketing hero, gradient/orb, or illustration pattern was found in the Phase 3 survey surfaces.

### Pillar 3: Color (3/4)

- WARNING - Accent usage is broad in the audited scope: scan found `text-teal` 9 times, `border-teal` 8 times, teal focus classes 10 times, `accent-teal` 3 times, `bg-teal` 2 times, plus the chart fill. Most are defensible, but the implementation should verify that teal is limited to active/selected/action/chart states rather than decorative emphasis.
- WARNING - Recharts colors are hardcoded directly in the component (`#CBD5E1`, `#0F766E`, `#0F172A`) instead of being centralized as tokens. The values match the spec, but local hardcoding makes future palette drift easier. See `src/components/surveys/SurveyBarChart.tsx:54` and `:63-73`.
- PASS - Status colors include visible text and match the intended slate/teal/amber/destructive pattern. See `src/components/surveys/SurveyResultsPanel.tsx:24-31` and `src/components/surveys/SurveyEditor.tsx:63-66`.

### Pillar 4: Typography (3/4)

- WARNING - Static typography scan for Phase 3 found the expected sizes only: `text-sm`, `text-base`, `text-[20px]`, and `text-[28px]`.
- WARNING - `font-medium` appears in the chart data table row header, adding an undeclared 500 weight where the UI-SPEC allows 400 or 600 only. See `src/components/surveys/SurveyBarChart.tsx:117`.
- PASS - Presentation view uses 28px display text for event/survey title and 20px/28px question text behavior. See `src/components/surveys/SurveyPresentationView.tsx:26`, `:88-95`.

### Pillar 5: Spacing (2/4)

- WARNING - Static spacing scan found undeclared 20px spacing: `gap-5` 9 times, `p-5` once, and `pb-5` once. The UI-SPEC scale declares 16px and 24px but not 20px. Examples: `src/components/surveys/SurveyResultsPanel.tsx:48`, `src/components/surveys/ExportPanel.tsx:41`, and `src/components/surveys/SurveyPresentationView.tsx:85,101`.
- WARNING - The chart table uses `min-w-[320px]` inside an `overflow-x-auto` wrapper. In a 360px viewport inside a padded panel, this can introduce horizontal scrolling, contrary to the mobile no-horizontal-scroll expectation. See `src/components/surveys/SurveyBarChart.tsx:95-99`.
- WARNING - Multiple arbitrary layout values are present (`grid-cols-[280px_minmax(0,1fr)]`, `grid-cols-[220px_minmax(0,1fr)]`, `min-h-[240px]`). Some are reasonable, but they should be checked against the declared spacing/dimension contract. See `src/app/(app)/events/[eventId]/page.tsx:210`, `src/components/surveys/SurveyEditor.tsx:245`, and `src/components/surveys/SurveyBarChart.tsx:47`.
- PASS - Mobile touch targets generally meet the 44px minimum through `min-h-11` and `min-w-11` on buttons and participant controls. See `src/components/ui/Button.tsx:10-11` and `src/components/surveys/SurveySubmitForm.tsx:123-174`.

### Pillar 6: Experience Design (2/4)

- BLOCKER - Multi-survey workflows are blocked by first-item selection in both authoring and results. Users cannot reliably edit or review a non-first survey. See `src/app/(app)/events/[eventId]/page.tsx:143`, `src/components/surveys/SurveyList.tsx:52-75`, and `src/components/surveys/SurveyResultsPanel.tsx:42-44`.
- WARNING - `Close survey` has no confirmation dialog, despite the UI-SPEC requiring "Close survey? Participants will no longer be able to submit responses, but results and exports will remain available." The only matching code is the direct submit button. See `src/components/surveys/SurveyEditor.tsx:172-180`.
- WARNING - Export rows do not implement generating/downloading, failed, or retry states in the UI; nonempty rows are plain anchors and empty rows are static alerts. See `src/components/surveys/ExportPanel.tsx:75-90`.
- WARNING - The publish validation summary is not linked to invalid fields and there is no visible focus management to move focus to the summary after failure. See `src/components/surveys/SurveyEditor.tsx:190-201`.
- WARNING - Loading skeletons for surveys/results/exports are not implemented in the audited components, despite the UI-SPEC requiring loading states that preserve layout dimensions.
- PASS - Access-denied states exist for event access, surveys, results, exports, and presentation. See `src/app/(app)/events/[eventId]/page.tsx:92-108`, `:149-189`, `:219-225`, and `src/app/(app)/events/[eventId]/presentation/surveys/[surveyId]/page.tsx:61-76`.
- PASS - Chart accessibility includes a chart label, readable list, and adjacent data table. See `src/components/surveys/SurveyBarChart.tsx:47`, `:87-93`, and `:95-125`.

---

## Files Audited

- `.planning/phases/03-surveys-results-presentation-and-csv/03-UI-SPEC.md`
- `.planning/phases/03-surveys-results-presentation-and-csv/03-CONTEXT.md`
- `.planning/phases/03-surveys-results-presentation-and-csv/03-01-PLAN.md`
- `.planning/phases/03-surveys-results-presentation-and-csv/03-01-SUMMARY.md`
- `.planning/phases/03-surveys-results-presentation-and-csv/03-02-PLAN.md`
- `.planning/phases/03-surveys-results-presentation-and-csv/03-02-SUMMARY.md`
- `.planning/phases/03-surveys-results-presentation-and-csv/03-03-PLAN.md`
- `.planning/phases/03-surveys-results-presentation-and-csv/03-03-SUMMARY.md`
- `.planning/phases/03-surveys-results-presentation-and-csv/03-04-PLAN.md`
- `.planning/phases/03-surveys-results-presentation-and-csv/03-04-SUMMARY.md`
- `.planning/phases/03-surveys-results-presentation-and-csv/03-05-PLAN.md`
- `.planning/phases/03-surveys-results-presentation-and-csv/03-05-SUMMARY.md`
- `src/components/events/EventWorkspace.tsx`
- `src/app/(app)/events/[eventId]/page.tsx`
- `src/app/(app)/events/[eventId]/presentation/surveys/[surveyId]/page.tsx`
- `src/app/join/[joinCode]/surveys/page.tsx`
- `src/components/surveys/SurveyList.tsx`
- `src/components/surveys/SurveyEditor.tsx`
- `src/components/surveys/SurveySubmitForm.tsx`
- `src/components/surveys/SurveyResultsPanel.tsx`
- `src/components/surveys/SurveyPresentationView.tsx`
- `src/components/surveys/SurveyBarChart.tsx`
- `src/components/surveys/OpenTextResponseList.tsx`
- `src/components/surveys/ExportPanel.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/Alert.tsx`
- `src/components/ui/Field.tsx`
- `src/components/qna/ConnectionStatus.tsx`

## Recommendation Count

- Priority fixes: 3
- Detailed findings: 22
- Minor recommendations: 19
