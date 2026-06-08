---
quick_id: 260609-17x
slug: show-all-published-participant-surveys-i
status: complete
completed_at: 2026-06-09
---

# Summary

Participants now see all published surveys for an event instead of only the latest updated survey.

## Changes

- Added `loadParticipantSurveys(...)` in `src/lib/surveys/participant.ts` to batch-load all published surveys, validate the participant once, and attach per-survey completed state.
- Updated `/join/[joinCode]/surveys` to render a multi-survey queue with open/completed counts, per-survey status badges, and the first unanswered survey expanded.
- Kept the existing single-survey submission server action contract intact.
- Made participant result heading IDs survey-specific to avoid duplicate IDs when multiple completed survey forms render.
- Added unit and Playwright regression coverage for multiple published participant surveys.

## Verification

- `npx vitest run tests/surveys/participant.test.ts` passed.
- `npx eslint src/lib/surveys/participant.ts src/app/join/[joinCode]/surveys/page.tsx src/components/surveys/SurveySubmitForm.tsx tests/surveys/participant.test.ts tests/e2e/survey-submission.spec.ts` passed.
- `npx tsc --noEmit` passed.
- `npx playwright test tests/e2e/survey-submission.spec.ts` passed.
- `git diff --check` passed with only standard Windows LF-to-CRLF warnings.

## Known unrelated failure

- `npm test` still fails in `tests/events/events.test.ts` on two date-sensitive event creation expectations. The survey-focused test file passed, and the failing tests are outside this change.
