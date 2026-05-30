---
phase: 3
slug: surveys-results-presentation-and-csv
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-30
---

# Phase 3 - UI Design Contract

Visual and interaction contract for QSB Ask Phase 3: organiser survey authoring, participant survey submission, organiser results, survey chart/data views, survey presentation view, and CSV export states.

Phase 3 must continue the Phase 1 and Phase 2 operational corporate UI. It must not use shadcn, marketing hero sections, decorative gradients/orbs, nested cards, or a broad visual redesign.

---

## Source Decisions

| Source | Decisions Used |
|--------|----------------|
| `.planning/phases/03-surveys-results-presentation-and-csv/03-CONTEXT.md` | Phase 3 boundary, survey lifecycle, participant visibility rules, aggregate DTO results, presentation behavior, CSV export scope, and out-of-scope reconnect/deployment/v2 features. |
| `.planning/phases/02-live-event-qna-and-moderation/02-UI-SPEC.md` | Manual Tailwind system, no shadcn, 6px radius, slate/teal/red palette, typography scale, spacing scale, public/presenter safety posture, realtime state copy, and no nested cards rule. |
| `.planning/phases/01-foundation-auth-and-data/01-UI-SPEC.md` | Base app shell, component primitives, copy tone, accessibility baseline, mobile targets, and visual quality rules. |
| `.planning/REQUIREMENTS.md` | LIVE-05, SURV-01 to SURV-13, and EXPT-01 to EXPT-05 define required screens, states, and visibility/export behavior. |
| `.planning/ROADMAP.md` | Phase 3 goal: survey workflow, reporting surfaces, presentation, and CSV exports. |
| `.planning/research/SUMMARY.md` | Approved stack remains Next.js, TypeScript, Tailwind, managed Supabase, live updates, survey builder/results, and CSV export. |
| `src/components/ui` | Existing primitives: `Button`, `Field`, `Badge`, `Alert`; use these before adding new primitives. |
| `src/components/events` | Existing Event Workspace composition, tab treatment, join link copy, settings/access panels, and organiser-only operational layout. |
| `src/components/qna` | Existing `ConnectionStatus`, moderator queue density, participant public list pattern, and presenter display pattern. |
| `src/types/app.ts` and Supabase schema | Survey statuses: Draft, Published, Closed. Question types: multiple choice, multiple select, rating, open text. |

No `components.json` exists and shadcn is not initialized. This is intentional for Phase 3 because the project uses a small internal Tailwind component system and the current request explicitly excludes shadcn.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | Manual internal Tailwind component set |
| Preset | Not applicable |
| Component library | None; extend existing internal components only |
| Chart library | None required for v1; use accessible internal Tailwind/HTML chart components unless a later plan explicitly adds and verifies Recharts |
| Icon library | None required; if icons are introduced, use `lucide-react` only with visible text labels for primary/destructive actions |
| Font | `Inter`, fallback `Arial`, `sans-serif` |
| Styling | Tailwind CSS v4 utility classes matching existing source patterns |
| Radius | 6px for buttons, inputs, badges, alerts, segmented controls, dialogs, list rows, chart panels, and export panels |
| Elevation | Borders first; one subtle `shadow-sm` only for dialogs/popovers |

Existing primitives must be reused or extended before creating new components:

| Component | Phase 3 Use |
|-----------|-------------|
| `Button` | Create survey, Add question, Publish survey, Close survey, Submit survey, Download CSV, Save visibility, retry actions. |
| `Field` | Survey title, question prompt, option label, rating scale metadata, search/filter fields, export date/filter fields if added. |
| `Badge` | Survey status, response status, result visibility, export availability, chart connection state. |
| `Alert` | Publish validation, hidden-results notice, zero-response notice, empty export notice, access denied, export failure. |
| `EventWorkspace` | Add survey/results/export destinations in the authenticated event workspace without creating a second shell. |
| `ConnectionStatus` | Reuse for results and survey presentation realtime states: Connected, Reconnecting, Refresh needed. |

New internal components allowed for Phase 3:

| Component | Contract |
|-----------|----------|
| `SurveyList` | Dense event-scoped list/table of surveys with title, status, response count, result visibility, and actions. |
| `SurveyEditor` | Organiser-only form surface for title, questions, options, rating scale, visibility, publish/close actions, and validation summary. |
| `SurveyQuestionEditor` | Repeated question block with type selector, prompt, options/scale controls, remove option, and reorder controls if implemented. |
| `SurveySubmitForm` | Participant-safe survey response form for published surveys only; one submit action; no organiser metadata. |
| `ChoiceInputGroup` | Radio group for multiple choice and checkbox group for multiple select with visible labels and 44px mobile targets. |
| `RatingScaleInput` | 1-5 or 1-10 segmented/radio control with visible numbers and accessible group label. |
| `SurveyResultsPanel` | Organiser result summary with response counts, chart results, open-text data view, and data table alternatives. |
| `SurveyBarChart` | Semantic internal bar chart for choice/rating results with counts, percentages, labels, and paired accessible table. |
| `OpenTextResponseList` | Readable staff-only list/table of open text responses with participant-safe labels and timestamps. |
| `SurveyPresentationView` | Display-focused chart/results surface with no admin controls and no raw response identifiers. |
| `ExportPanel` | Organiser-only CSV export area with questions, moderation history, and survey responses export rows and states. |

---

## Spacing Scale

Declared values, all multiples of 4:

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, badge inner gaps, chart label gaps, helper spacing |
| sm | 8px | Compact row gaps, option gaps, export row metadata, segmented control gaps |
| md | 16px | Default form, list, chart, and panel spacing |
| lg | 24px | Desktop panel padding, workspace section spacing, chart group padding |
| xl | 32px | Major layout gaps between survey editor, results, and export regions |
| 2xl | 48px | Empty states and presentation view edge padding |
| 3xl | 64px | Maximum desktop vertical page spacing only |

Exceptions:

- Mobile touch targets must be at least 44px high and 44px wide.
- Desktop buttons, inputs, selects, and segmented controls must be at least 40px high.
- Survey presentation view may use 48px spacing between chart groups for second-monitor readability.
- Chart bars may use 12px minimum visible bar height when response count is low or zero.
- Focus rings may extend 2px outside the component box.
- Dense export/result rows may use 12px vertical padding when controls still meet target size.

---

## Typography

Use exactly these four sizes and two weights across Phase 3.

| Role | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Label | 14px | 400 or 600 | 1.4 | Field labels, helper text, metadata, badges, chart axis labels, export row details |
| Body | 16px | 400 | 1.5 | Default body text, inputs, buttons, participant survey questions, table cells |
| Heading | 20px | 600 | 1.25 | Section headings, survey titles inside workspace, dialog headings, chart question headings |
| Display | 28px | 600 | 1.2 | Workspace page title, participant survey title, presentation view survey title |

Presentation view display rule:

- Survey presentation title uses 28px/1.2.
- Chart question text uses 28px/1.2 at desktop widths 1024px and wider.
- Chart labels, counts, and percentages use 20px/1.25 only in presentation view when distance readability matters.
- At widths below 768px, presentation chart question text falls back to 20px/1.25.

Rules:

- Do not use viewport-scaled type.
- Letter spacing is `0`.
- Do not introduce additional font sizes for counters, chart legends, pills, or icons.
- Error text uses 14px/1.4 with text plus a border or icon cue, never color alone.
- Form labels are always visible; placeholders are examples only.

---

## Color

Use the established QSB Ask restrained corporate palette.

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#F8FAFC` | Page background, participant background, presentation canvas |
| Secondary (30%) | `#FFFFFF` | Workspace panels, survey editor sections, chart surfaces, export rows, dialogs |
| Border | `#CBD5E1` | Inputs, panels, list separators, chart boundaries, inactive controls |
| Text Primary | `#0F172A` | Main content, headings, labels, table values |
| Text Secondary | `#475569` | Metadata, helper text, timestamps, explanatory copy |
| Accent (10%) | `#0F766E` | Primary action, active survey tab, focus ring, selected control, visible chart bars, live connection state |
| Accent Hover | `#115E59` | Primary action hover/pressed |
| Warning | `#B54708` | Publish validation, hidden results, zero responses, reconnecting, empty export |
| Destructive | `#B42318` | Close survey confirmation, archive/close event inherited actions, export failure, destructive states only |

Accent reserved for:

- Primary CTA on the active screen.
- Active workspace tab or segmented option.
- Keyboard focus ring.
- Selected survey question option or rating value.
- Survey chart bars and selected chart legend item.
- Successful survey submission, visibility save, copy, and export readiness states.
- Live connection indicator.

Do not use accent for all links, every icon, decorative fills, or non-action badges. Hidden/private result visibility is conveyed through copy and access rules, not color alone.

Survey status badge tones:

| Status | Visual Contract |
|--------|-----------------|
| Draft | White surface, slate border/text, label "Draft". Organiser surfaces only. |
| Published | White surface, teal border/text, label "Published". Participant-submittable. |
| Closed | Slate-100 surface, slate border/text, label "Closed". Records/results remain available. |
| Results hidden | White surface, amber border/text, label "Results hidden". |
| Results visible | White surface, teal border/text, label "Results visible". |

---

## Layout Contract

### Authenticated Event Workspace

- Reuse the existing `AppShell` and `EventWorkspace` visual structure with max width 1120px.
- Extend workspace navigation with survey destinations in this order: `Q&A`, `Surveys`, `Results`, `Exports`, `Access`, `Settings`, `Presenter`.
- If implementation keeps a single client tab component, tabs must remain wrapped at 360px without horizontal scrolling.
- Event header remains the single event context source: event name, status badge, role badge, join code/link copy, and display/presentation entry points.
- Survey authoring and results are organiser-only. Moderators and speakers must not see authoring/export controls.
- Speakers may access display/presentation surfaces only through role-checked routes with safe aggregate data.
- Do not put cards inside cards. Use page sections, bordered panels, tables/lists, and row separators.

### Organiser Survey Authoring

- The Surveys tab uses a two-region layout on desktop:
  - Survey list or index on the left/top with status and response counts.
  - Active survey editor below or to the right depending on available width.
- The focal point is the active survey editor's validation summary and primary action, so organisers always know what must be fixed before publishing.
- Mobile layout stacks: survey actions, list, selected survey editor, validation summary.
- Survey editor max width is 900px; long option labels and prompts wrap inside their containers.
- Question editors are repeated bordered sections, not nested cards inside a parent card.
- The primary action for a draft survey is `Publish survey`; secondary actions are `Save draft`, `Add question`, and `Close survey` only when relevant.
- Publish validation summary appears above the editor and links/focuses to invalid fields.

### Participant Survey Submission

- Participant survey routes live under the public join flow and do not use the authenticated admin shell.
- Mobile-first max width is 760px with 16px side padding at 360px viewport width.
- Header shows event name and survey title, not organiser controls or internal survey ids.
- Published surveys render as a single form with question groups in survey order.
- Draft and closed surveys never render an active form.
- One response per participant session is shown as a completed state, not a second enabled form.
- If participant result visibility is disabled, show a hidden-results notice after submission instead of chart data.

### Results And Data Views

- Results tab uses a compact summary row: survey title, status, response count, result visibility, last updated, presentation link.
- The focal point is the response count plus result visibility state before chart groups, so organisers can first confirm whether data is ready and whether participants can see it.
- Choice and rating questions use `SurveyBarChart` plus an accessible table alternative directly adjacent to the chart.
- Open text questions use `OpenTextResponseList` with readable rows and no chart.
- Zero-response charts show the question, options/scale labels, response count `0`, and a calm empty state. Do not fabricate bars or percentages.
- Results surfaces use aggregate DTOs for chart data. Public/presentation views must not receive raw answer rows or participant emails.

### Survey Presentation View

- Survey Presentation View is a focused display route for survey charts/results.
- Required content: event name, survey title, connection state, response count, chart/result groups, and zero-response state.
- No admin shell account area, survey editor, publish/close controls, export controls, raw open text identifiers, or participant emails.
- Show only surveys/results allowed by role and visibility:
  - Staff presentation may show organiser-approved aggregate results for assigned event roles.
  - Participant-facing results show only when result visibility is enabled.
- Desktop presentation should be readable on a second monitor: generous chart spacing, high contrast, 28px question text, no dense admin chrome.
- Mobile/tablet fallback remains usable without horizontal scrolling.

### CSV Exports

- Exports tab is organiser-only.
- Use one row per export type: questions and versions, moderation history, survey responses.
- Each row shows export name, short description, record count, last generated/requested state if available, and action.
- Nonempty exports show `Download CSV`.
- Empty exports show a compact empty state instead of downloading an empty file.
- Export errors are inline in the row and keep the action available for retry.

---

## Component Contracts

| Component | Contract |
|-----------|----------|
| Button | Use existing variants. Loading state preserves width. One primary action per screen or tab. |
| Field | Visible label, helper/error slot, 44px mobile, 40px desktop, teal focus ring. |
| Select | Native select preferred for survey status, question type, rating scale, result visibility, export filters, and sort controls. |
| SegmentedTabs | Active state uses teal border/text and text label; keyboard operable; wraps on mobile. |
| Badge | Text always visible. Do not rely on color alone for survey status, visibility, or export availability. |
| Alert | Title plus body text; warning/destructive/info variants; publish/export/access errors are not auto-dismissed. |
| Dialog | Max width 480px; focus trap; context-specific secondary actions such as "Keep survey open", "Return to editor", "Keep results hidden", or "Keep results visible" close with Escape unless destructive action is currently saving. |
| Toast/LiveMessage | Use for save success, publish success, submit accepted, and export ready; form/export errors also appear inline. |
| SurveyList | Stable row heights; row actions do not trigger row navigation accidentally; status and response count always visible. |
| SurveyEditor | Preserves unsaved edits during validation failure; disabled while publishing/closing; validation summary has field links. |
| SurveyQuestionEditor | Type selector, prompt, option/scale controls, and remove/reorder actions remain keyboard operable. |
| ChoiceInputGroup | Radio or checkbox group uses semantic fieldset/legend; each option has at least 44px mobile target. |
| RatingScaleInput | Uses radio buttons or accessible segmented controls with visible numeric values and selected state. |
| SurveyBarChart | Uses semantic labels, values, percentages, and a paired table; chart bars have text labels outside or inside only when contrast is sufficient. |
| OpenTextResponseList | Staff-only unless explicitly allowed as aggregate/public text; rows wrap long text and never expose hidden participant emails in public surfaces. |
| ExportPanel | Each export row has record count, action state, empty state, retry/error state, and organiser-only access guard. |
| ConnectionStatus | ARIA live polite text. Shows "Connected", "Reconnecting", or "Refresh needed". |

---

## Screen Contracts

### Event Workspace - Surveys Tab

Required elements:

- Event name remains the page `h1` in the workspace header.
- Surveys tab label.
- Create survey action.
- Survey list with title, status, response count, result visibility, updated time, and actions.
- Empty state for no surveys.
- Organiser-only authoring controls.

States:

- Loading surveys: skeleton rows matching final dimensions.
- No surveys.
- Draft surveys available.
- Published surveys available.
- Closed surveys available.
- Access denied for non-organisers.
- Error loading surveys.

Copy:

- Primary CTA: "Create survey".
- Empty heading: "No surveys yet".
- Empty body: "Create a survey to collect structured feedback during this event."
- Access denied: "Only organisers can create and manage surveys for this event."
- Error: "Surveys could not be loaded. Refresh the page or return to the dashboard."

Interaction rules:

- Create survey opens an editor with title focused.
- Selecting a survey opens the editor/results context without losing event context.
- Survey rows do not expose raw response data.
- Speakers and moderators do not see create/publish/close controls.

### Survey Editor

Required elements:

- Survey title field.
- Status badge: Draft, Published, or Closed.
- Result visibility control, default hidden from participants.
- Add question action.
- Question type selector: Multiple choice, Multiple select, Rating, Open text.
- Question prompt field.
- Multiple choice/select option fields with at least two options.
- Rating scale selector: 1-5 or 1-10.
- Save draft action.
- Publish survey action for valid drafts.
- Close survey action for published surveys.
- Validation summary.

States:

- New draft.
- Existing draft.
- Saving.
- Save success.
- Save failure.
- Publish validation errors.
- Publishing.
- Published and editable only where server rules allow.
- Closing.
- Closed.
- Unsaved changes.

Validation:

- Survey title is required.
- Every question prompt is required.
- Multiple choice and multiple select questions require at least two nonblank options.
- Rating questions require scale 1-5 or 1-10.
- Open text questions require prompt only.
- A survey must have at least one valid question before publishing.

Copy:

- Primary CTA: "Publish survey".
- Save CTA: "Save draft".
- Add question CTA: "Add question".
- Validation heading: "Survey is not ready to publish".
- Validation body: "Fix the highlighted questions before publishing this survey."
- Close confirmation: "Close survey? Participants will no longer be able to submit responses, but results and exports will remain available."

Interaction rules:

- Result visibility defaults to hidden from participants.
- Publish and close actions require server confirmation; no optimistic published/closed status.
- Closing a survey requires confirmation.
- Removing the last option from a choice/select question is disabled or immediately replaced with an empty option field so the editor never hides the minimum requirement.
- Realtime updates must not steal focus from fields or dialogs.

### Participant Survey Submission

Required elements:

- Event name.
- Survey title.
- Survey status-aware intro.
- One question group per survey question.
- Submit survey action.
- Completion state.
- Hidden-results notice when visibility is off.
- Results preview/chart state only when participant visibility is on.

States:

- Loading survey.
- No published surveys.
- Survey available.
- Submitting.
- Submitted.
- Already submitted.
- Draft/unavailable.
- Closed.
- Validation error.
- Session missing or expired.
- Server/network error.

Copy:

- Primary CTA: "Submit survey".
- No published surveys heading: "No surveys are open".
- No published surveys body: "Open surveys will appear here when the organiser publishes them."
- Submitted heading: "Survey submitted".
- Submitted body: "Thank you. Your response has been recorded for this event."
- Already submitted: "You have already submitted this survey."
- Hidden results: "Results are hidden by the organiser."
- Closed: "This survey is closed. New responses are no longer being accepted."
- Error: "Your survey response could not be submitted. Check your connection and try again."

Interaction rules:

- Participant actions validate the event-scoped participant session before reading or writing responses.
- A participant can submit one response per survey session.
- Successful submit clears transient form state and shows completion.
- Failed submit preserves entered responses.
- Draft and closed surveys do not render enabled answer controls.
- Participant views never show organiser controls, staff metadata, raw response ids, or private participant identifiers.

### Results Tab

Required elements:

- Survey selector/list.
- Survey status badge.
- Response count.
- Result visibility state and save control.
- Presentation view link/action.
- Chart results for multiple choice, multiple select, and rating questions.
- Open text data view.
- Accessible data table alternative for each chart.
- Zero-response state.

States:

- Loading results.
- No surveys.
- Selected survey has zero responses.
- Choice/rating results available.
- Open text responses available.
- Results hidden from participants.
- Results visible to participants.
- Reconnecting.
- Refresh needed.
- Error loading results.

Copy:

- Primary CTA: "Save visibility".
- Presentation CTA: "Open presentation view".
- Zero-response heading: "No responses yet".
- Zero-response body: "Charts will update when participants submit this survey."
- Open text empty heading: "No text responses yet".
- Results error: "Survey results could not be loaded. Refresh the page and try again."
- Visibility hidden helper: "Participants cannot see these results unless visibility is enabled."

Interaction rules:

- Results update within 2 seconds in normal conditions.
- Charts refresh from server-derived aggregate DTOs, not raw answer rows in public/presentation surfaces.
- Data tables remain available even when charts render.
- Changing participant visibility is organiser-only and must show success/failure feedback.
- Zero-response charts must preserve final layout dimensions to prevent shift when first response arrives.

### Survey Presentation View

Required elements:

- Event name.
- Survey title.
- Connection status.
- Response count.
- Chart/result groups.
- Zero-response state.
- Access denied state.

States:

- No survey selected or no published/closed survey available.
- Zero responses.
- Results available.
- Reconnecting.
- Refresh needed.
- Access denied.
- Error loading presentation.

Copy:

- Empty heading: "No survey results yet".
- Empty body: "Results will appear here when participants submit responses."
- Access denied: "You do not have access to survey presentation view for this event."
- Refresh needed: "Live updates are not reconnecting. Refresh this view to continue."

Interaction rules:

- No admin controls.
- No survey editor.
- No CSV export controls.
- No raw participant identifiers.
- No unpublished draft survey forms.
- Presentation may auto-refresh through realtime, but scroll position must not jump unless the user is already near the top.

### CSV Exports Tab

Required elements:

- Questions and versions export row.
- Moderation history export row.
- Survey responses export row.
- Record count per export row.
- Download CSV action for nonempty exports.
- Empty state for no records.
- Error/retry state.

States:

- Loading export counts.
- Questions export ready.
- Moderation history export ready.
- Survey responses export ready.
- Empty questions export.
- Empty moderation history export.
- Empty survey responses export.
- Generating/downloading.
- Export failed.
- Access denied.

Copy:

- Primary CTA: "Download CSV".
- Questions export label: "Questions and versions".
- Moderation export label: "Moderation history".
- Survey export label: "Survey responses".
- Empty export heading: "No records to export".
- Empty export body: "This CSV will be available after records exist for this event."
- Export error: "CSV export could not be generated. Try again."
- Access denied: "Only organisers can export event records."

Interaction rules:

- Exports are organiser-only.
- Empty exports show the empty state and do not download a blank file.
- Anonymous participants are labelled `Anonymous` plus a per-session audit identifier in exported CSV content.
- Export actions must not expose secrets, raw participant session tokens, or private auth identifiers in visible UI.
- Download buttons preserve width while loading.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Surveys primary CTA | "Create survey" |
| Survey editor primary CTA | "Publish survey" |
| Survey editor secondary CTA | "Save draft" |
| Add question CTA | "Add question" |
| Participant survey CTA | "Submit survey" |
| Results visibility CTA | "Save visibility" |
| Presentation CTA | "Open presentation view" |
| Export CTA | "Download CSV" |
| Surveys empty heading | "No surveys yet" |
| Surveys empty body | "Create a survey to collect structured feedback during this event." |
| Participant empty heading | "No surveys are open" |
| Participant empty body | "Open surveys will appear here when the organiser publishes them." |
| Results zero-response heading | "No responses yet" |
| Results zero-response body | "Charts will update when participants submit this survey." |
| Open text empty heading | "No text responses yet" |
| Export empty heading | "No records to export" |
| Export empty body | "This CSV will be available after records exist for this event." |
| Generic loading | "Loading surveys." |
| Generic error | "This view could not be loaded. Refresh the page or return to the dashboard." |
| Access denied | "You do not have access to this event." |
| Hidden results | "Results are hidden by the organiser." |
| Submission success | "Survey submitted. Thank you. Your response has been recorded for this event." |
| Submission error | "Your survey response could not be submitted. Check your connection and try again." |
| Export error | "CSV export could not be generated. Try again." |

Destructive or confirmation copy:

| Action | Confirmation Copy |
|--------|-------------------|
| Publish survey with validation errors | "Survey is not ready to publish. Fix the highlighted questions before publishing this survey." |
| Close survey | "Close survey? Participants will no longer be able to submit responses, but results and exports will remain available." |
| Turn participant results on | "Show results to participants? Participants will be able to see aggregate survey results for this survey." |
| Turn participant results off | "Hide results from participants? Organisers can still view results in the workspace." |

Copy rules:

- Use direct verbs: Create survey, Add question, Publish survey, Submit survey, Save visibility, Download CSV.
- Avoid promotional language.
- Never imply participant results are public when visibility is hidden.
- Errors must state the problem and next action.
- Public screens use participant-safe language and never mention internal response ids, RLS, or staff metadata.

---

## Interaction And State Rules

- All mutations have loading, success, validation error, server error, and access-denied states.
- Buttons prevent duplicate submissions while loading.
- Survey authoring and exports are organiser-only.
- Participant survey reads and writes require a valid event-scoped participant session.
- Participants may submit one response per survey session.
- Draft and closed surveys must not render enabled participant response controls.
- Participant result views show charts only when organiser visibility is enabled.
- Public/presentation results receive aggregate result DTOs only.
- Raw answer rows, participant emails, participant session ids, and staff-only metadata never appear in participant or presentation markup.
- Result charts and presentation view update within 2 seconds in normal conditions.
- Realtime updates must not steal focus from active forms, dialogs, chart/table keyboard focus, or export buttons.
- Search/filter/sort controls preserve the selected survey and active workspace tab.
- Row click and row action controls are independent.
- Dialogs restore focus to the triggering control on close.
- Export empty state prevents blank CSV download.
- CSV export UI shows safe labels for anonymous participants and never displays token hashes or raw tokens.

---

## Accessibility Contract

- Target WCAG 2.1 AA for all Phase 3 screens.
- Every route has one `h1`.
- Use semantic `form`, `label`, `fieldset`, `legend`, `button`, `nav`, `main`, `section`, `table`, `ol`, and `ul` markup as appropriate.
- Authenticated screens retain the skip link from `AppShell`.
- Public participant screens include a skip link when repeated navigation or list content appears before the form.
- All controls are keyboard operable with visible teal focus rings.
- Focus moves to the first meaningful error summary after failed submit or failed publish.
- Status, warning, and error states are conveyed through text and structure, not color alone.
- Survey status badges include visible text.
- Dialogs trap focus, restore focus, and support Escape unless a destructive action is currently saving.
- Minimum contrast: 4.5:1 for normal text and 3:1 for large text and graphical UI boundaries.
- Mobile participant survey and results screens must work at 360px width without horizontal scrolling.
- Touch targets on mobile must be at least 44px.
- Chart bars must have text labels, values, and percentages; color alone is insufficient.
- Every chart must have an adjacent accessible table alternative with the same labels, counts, and percentages.
- Open text response lists must wrap long words and preserve readable row boundaries.
- Realtime announcements use polite ARIA live regions; do not announce every individual response update if it would overwhelm screen reader users.
- Presentation View text must remain readable from a second monitor distance with high contrast and no low-contrast metadata.

---

## Visual Quality Criteria

- No hero section, decorative gradient/orb background, split marketing layout, illustrations, or oversized product promotion.
- No nested cards. Use panels, sections, tables/lists, and row separators instead.
- One primary action per screen or tab.
- Survey authoring must be dense enough for organiser work: at least 3 question editors or 6 survey rows visible above the fold on a typical desktop viewport where content exists.
- Participant survey submission must be calm and simple: event/survey title, questions, submit, completion/results state.
- Results must support scanning: response counts and visibility state appear before chart details.
- Presentation View must be readable and display-focused, with no admin chrome.
- Loading skeletons preserve layout size and prevent content shift.
- Empty states are compact and action-oriented, not illustrative.
- Text must wrap inside containers and never overlap controls at 360px mobile width.
- Chart labels must not overlap bars, legends, or table content.
- Use borders and spacing before shadows.
- Do not use color as the sole distinction between survey states, selected answers, chart groups, or export states.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable - shadcn not initialized |
| third-party registries | none | not applicable - no third-party blocks approved |

No registry blocks are approved for Phase 3.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

Approval: pending
