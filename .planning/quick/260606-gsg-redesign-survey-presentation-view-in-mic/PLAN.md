---
quick_id: 260606-gsg
slug: redesign-survey-presentation-view-in-mic
status: complete
date: 2026-06-06
---

# Quick Task: Redesign Survey Presentation View

Redesign the survey presentation view to use a Microsoft Forms-style presenter stage based on the supplied references.

## Scope

- Replace the organiser-report-style survey presentation layout with a full-screen presenter surface.
- Add a left QR/link rail for participant joining.
- Show one survey question per slide with large projector-safe chart modes.
- Preserve safe aggregate-only rendering and accessibility tables/summaries.
- Update focused E2E coverage for the redesigned interaction.

## Verification

- `npm run lint`
- `npx tsc --noEmit`
- `npx playwright test tests/e2e/survey-presentation.spec.ts`
- Playwright desktop and mobile visual/overflow checks
- `npm run build`
