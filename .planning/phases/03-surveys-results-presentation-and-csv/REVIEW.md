---
phase: 03-surveys-results-presentation-and-csv
reviewed: 2026-05-30T04:30:18Z
depth: deep
files_reviewed: 37
files_reviewed_list:
  - package.json
  - src/app/(app)/events/[eventId]/export/[kind]/route.ts
  - src/app/(app)/events/[eventId]/page.tsx
  - src/app/(app)/events/[eventId]/presentation/surveys/[surveyId]/page.tsx
  - src/app/(app)/events/[eventId]/survey-actions.ts
  - src/app/join/[joinCode]/surveys/page.tsx
  - src/app/join/[joinCode]/surveys/submit-actions.ts
  - src/components/events/EventWorkspace.tsx
  - src/components/surveys/ExportPanel.tsx
  - src/components/surveys/OpenTextResponseList.tsx
  - src/components/surveys/SurveyBarChart.tsx
  - src/components/surveys/SurveyEditor.tsx
  - src/components/surveys/SurveyList.tsx
  - src/components/surveys/SurveyPresentationView.tsx
  - src/components/surveys/SurveyResultsPanel.tsx
  - src/components/surveys/SurveySubmitForm.tsx
  - src/lib/supabase/database.types.ts
  - src/lib/surveys/export.ts
  - src/lib/surveys/management.ts
  - src/lib/surveys/participant.ts
  - src/lib/surveys/realtime.ts
  - src/lib/surveys/results.ts
  - src/lib/surveys/validation.ts
  - supabase/migrations/202605300302_survey_submission_rpc.sql
  - supabase/migrations/202605300304_survey_realtime.sql
  - tests/db/survey-realtime.test.ts
  - tests/db/survey-submission-rpc.test.ts
  - tests/e2e/csv-exports.spec.ts
  - tests/e2e/survey-presentation.spec.ts
  - tests/e2e/survey-results.spec.ts
  - tests/e2e/survey-submission.spec.ts
  - tests/e2e/surveys-management.spec.ts
  - tests/surveys/export.test.ts
  - tests/surveys/management.test.ts
  - tests/surveys/participant.test.ts
  - tests/surveys/realtime.test.ts
  - tests/surveys/results.test.ts
findings:
  critical: 5
  warning: 3
  info: 0
  total: 8
status: issues_found
---

# Phase 3: Code Review Report

**Reviewed:** 2026-05-30T04:30:18Z
**Depth:** deep
**Files Reviewed:** 37
**Status:** issues_found

## Fix Pass - 2026-05-30

The blocking findings below were remediated in the follow-up fix commit:

- **CR-01:** Participant-visible aggregates now load only after the current participant has completed the selected survey, and `getParticipantVisibleSurveyResults` verifies a matching response before returning aggregates.
- **CR-02 / WR-03:** Browser realtime subscriptions no longer subscribe to raw `survey_responses` or `survey_answers`; a corrective migration removes those tables from the realtime publication and the client uses sanitized survey metadata plus 2-second refresh polling.
- **CR-03:** Participant survey reads now use the server-verified admin path after cookie-token validation instead of depending on a missing browser/RLS participant context.
- **CR-04:** Survey draft replacement now goes through `replace_survey_draft`, a transaction-scoped security-definer RPC that replaces title/questions/options atomically after organiser verification.
- **CR-05:** CSV formula hardening now catches formula markers after leading whitespace/control characters.
- **WR-01:** Survey authoring and results now use query-driven selected survey/result IDs with keyboard-operable selector links.
- **WR-02:** `questionCount` from form data is clamped to 0..50 before allocation.

Verification after fixes:

- `npm test` - passed, 17 files / 84 tests.
- `npm run lint` - passed.
- `npx tsc --noEmit` - passed.
- `CI='' npm run test:e2e -- tests/e2e/surveys-management.spec.ts tests/e2e/survey-submission.spec.ts tests/e2e/survey-results.spec.ts tests/e2e/survey-presentation.spec.ts tests/e2e/csv-exports.spec.ts` - passed, 13 tests.

## Narrative Findings (AI reviewer)

## Summary

Reviewed the Phase 3 survey management, participant submission, aggregate results, presentation realtime, CSV export, migrations, and focused tests. The main risk is not chart rendering; it is trust-boundary handling. I found data leaks in participant result loading and realtime subscriptions, RLS-context mistakes that can break participant survey flows in production, non-atomic survey draft persistence, and gaps in CSV injection hardening.

## Critical Issues

### CR-01: BLOCKER - Participant aggregate results are serialized before completion

**File:** `src/app/join/[joinCode]/surveys/page.tsx:189`

**Issue:** The participant survey page loads `getParticipantVisibleSurveyResults(event.id, rawToken)` whenever a participant has a cookie, then passes the matching `result` into the client component at lines 251-257. `SurveySubmitForm` hides that prop until `isCompleted` is true, but the aggregate result data is already serialized into the RSC/client payload for a participant who has not submitted yet. This violates the Phase 3 requirement that participant result charts render only after completion when visibility is enabled.

**Fix:**
```ts
if (rawToken) {
  surveyState = await loadParticipantSurvey(event.id, rawToken);
  if (surveyState.completed && surveyState.results.visible) {
    visibleResults = await getParticipantVisibleSurveyResults(event.id, rawToken);
  }
}
```
Also make `getParticipantVisibleSurveyResults` accept a `surveyId` and verify the current participant has a response for that survey before returning aggregates.

### CR-02: BLOCKER - Realtime subscriptions expose raw response and answer payloads to presentation clients

**File:** `src/lib/surveys/realtime.ts:33`

**Issue:** The presentation client subscribes directly to `survey_responses` and `survey_answers` Postgres changes. The callbacks ignore the payload, but Supabase still delivers row payloads to the browser. `survey_responses` includes `participant_session_id`, and `survey_answers` includes raw `text_value`, `selected_option_ids`, and response/question IDs. The migration publishes both tables at `supabase/migrations/202605300304_survey_realtime.sql:21` and `:31`, so speakers/presentation clients can receive raw survey data that the UI intentionally suppresses.

**Fix:** Do not subscribe public/presentation clients to raw response/answer tables. Use a server-side broadcast trigger that emits only `{ eventId, surveyId, version }`, or subscribe only to a sanitized aggregate/update table. Update `tests/surveys/realtime.test.ts` so it fails if `survey_answers` or raw `survey_responses` are subscribed from the browser.

### CR-03: BLOCKER - Participant survey reads do not establish the RLS participant context

**File:** `src/lib/surveys/participant.ts:177`

**Issue:** `loadSurveyForParticipant` and `hasSubmittedSurvey` use `createSupabaseServerClient()` after validating the raw cookie. The RLS policies for participant survey reads depend on `public.current_participant_session_id()`, which is populated from a JWT claim or `x-qsb-participant-session-id` request header in the foundation schema. No Phase 3 code sets that header on the Supabase client. In production, valid participant cookies can fail to load surveys, completion state, and participant-visible results even though the tests mock the database client.

**Fix:** After server-side cookie validation, use a controlled server-side path for participant reads: either a service-role helper/RPC that takes the verified `participantSession.id`, or a Supabase client configured with a safe internal header containing that verified session id. Add an integration-style test that exercises the actual RLS contract instead of only mocking `.from()`.

### CR-04: BLOCKER - Survey draft replacement is not atomic and cannot reliably delete existing questions under RLS

**File:** `src/lib/surveys/management.ts:175`

**Issue:** `persistSurveyDraft` updates the survey title, deletes existing `survey_questions`, inserts replacement questions, then inserts options as separate operations. The reviewed Phase 3 migrations do not add organiser DELETE policies for `survey_questions` or `survey_options`; the foundation schema only has select/insert/update policies. For an existing survey, the delete at lines 189-192 can silently affect no rows under RLS, and the following insert can collide on `(survey_id, position)`. If a later insert fails, earlier updates/deletes are already committed, creating data loss or a partially rewritten survey.

**Fix:** Move draft replacement into a single database transaction, preferably a security-definer RPC that verifies organiser role, deletes/reinserts questions/options atomically, and rolls back the title/questions/options together. If staying with client-side operations, add explicit DELETE policies and still wrap the sequence in a transaction.

### CR-05: BLOCKER - CSV formula hardening is bypassable with leading whitespace/control characters

**File:** `src/lib/surveys/export.ts:50`

**Issue:** `FORMULA_LEADING_PATTERN` only catches cells whose first character is `=`, `+`, `-`, or `@`. Participant-controlled fields such as question text, survey answers, display names, and option labels can begin with spaces, tabs, or carriage returns followed by a formula marker. Spreadsheet applications commonly trim or interpret those prefixes, so a cell such as `\t=HYPERLINK(...)` can bypass the current mitigation.

**Fix:**
```ts
const FORMULA_LEADING_PATTERN = /^[\s]*[=+\-@]/;

function hardenCell(value: CsvValue) {
  const text = String(value ?? "");
  return FORMULA_LEADING_PATTERN.test(text) ? `'${text}` : text;
}
```
Add export tests for leading space, tab, CR, and LF before formula markers.

## Warnings

### WR-01: WARNING - Organisers cannot select or edit surveys beyond the first one

**File:** `src/app/(app)/events/[eventId]/page.tsx:143`

**Issue:** `EventDetailContent` always picks `surveys[0]` as the selected survey. `SurveyList` renders every survey as static cards at `src/components/surveys/SurveyList.tsx:52`, with no link, button, or URL state to choose another survey. Once more than one survey exists, organisers can only edit/publish/close the first survey returned by creation order.

**Fix:** Add selected survey state via query param or client state. Render each survey row as a button/link, derive `selectedSurvey` from that selected id, and add an E2E test that creates/selects a second survey and edits it.

### WR-02: WARNING - `questionCount` can allocate an unbounded array from form data

**File:** `src/lib/surveys/management.ts:370`

**Issue:** `surveyDraftFromFormData` trusts `questionCount` from untrusted form data and passes it directly into `Array.from({ length: questionCount })`. A malicious authenticated user can submit a huge number and force large server-side allocation before validation runs.

**Fix:** Clamp `questionCount` to a documented maximum before allocation and reject negative/non-integer values.
```ts
const MAX_SURVEY_QUESTIONS = 50;
const rawQuestionCount = Number(formData.get("questionCount") ?? 0);
const questionCount = Number.isInteger(rawQuestionCount)
  ? Math.min(Math.max(rawQuestionCount, 0), MAX_SURVEY_QUESTIONS)
  : 0;
```

### WR-03: WARNING - Tests encode the unsafe realtime design instead of guarding against raw payload leakage

**File:** `tests/surveys/realtime.test.ts:33`

**Issue:** The realtime unit test asserts that the browser subscribes to `survey_responses` and `survey_answers`. That makes the raw-payload leak in CR-02 look intentional and prevents the test suite from catching the regression. The E2E tests only check visible text, not network/RSC/realtime payload contents.

**Fix:** Replace this test with a negative assertion that browser subscriptions never target raw answer/response tables. Add a fixture or unit-level contract for a sanitized survey-results invalidation channel.

---

_Reviewed: 2026-05-30T04:30:18Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
