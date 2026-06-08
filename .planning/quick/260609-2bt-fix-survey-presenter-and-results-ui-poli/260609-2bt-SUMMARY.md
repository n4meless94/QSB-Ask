---
status: complete
quick_id: 260609-2bt
slug: fix-survey-presenter-and-results-ui-poli
completed: 2026-06-09
---

# Quick Task Summary: Fix Survey Presenter And Results UI Polish

## Completed

- Fixed survey presenter tile sizing so long answer labels wrap inside cards instead of clipping.
- Removed presenter bar-mode fixed-width pressure and hid horizontal overflow in the chart region.
- Added early-signal/low-response notes to presenter, organiser, and participant result surfaces.
- Replaced cramped dashboard Recharts axis labels with readable HTML chart rows while preserving the accessible table fallback.
- Strengthened survey selector selected state with `aria-current="page"`, a visible Selected badge, and a stronger active card treatment.
- Added regression coverage for 1920x1080 and 1920x1200 presenter layouts with long BNRC-style option labels.

## Verification

- `npm run lint -- src/components/surveys/SurveyPresentationView.tsx src/components/surveys/SurveyBarChart.tsx src/components/surveys/SurveyResultsPanel.tsx tests/e2e/survey-presentation.spec.ts tests/e2e/survey-results.spec.ts tests/surveys/results.test.ts`
- `npx tsc --noEmit`
- `npm test -- tests/surveys/results.test.ts`
- `npx playwright test tests/e2e/survey-presentation.spec.ts tests/e2e/survey-results.spec.ts --project=chromium`
- `npm run build`
- In-app browser check on `/join/QSB2X9ZA/surveys?fixture=visible` showed participant results rendered with no horizontal overflow; protected presenter route was covered by Playwright fixture auth.
