---
status: complete
completed: "2026-06-04"
task: "Polish presenter live Q&A display from Hallmark screenshot review"
---

# Summary

Polished the existing Presenter View so the approved question reads as the main stage content instead of a dashboard card.

## Changed

- Centered and enlarged the featured question with a clear "Now answering" stage label.
- Kept status, vote count, edited state, and moderation safety copy visible without competing with the question.
- Enlarged the presenter QR card and changed presenter-mode fallback text from the full join URL to the short host.
- Moved the Popular/Recent presenter sort controls into the Approved queue panel header.
- Updated focused Presenter View E2E expectations for the new host fallback and stage label.

## Verification

- `npm run lint -- src/components/qna/PresenterView.tsx src/components/events/EventJoinQrCard.tsx tests/e2e/presenter-view.spec.ts` passed.
- `npx tsc --noEmit` passed.
- `npx playwright test tests/e2e/presenter-view.spec.ts` passed: 3 tests.
- Six-width Playwright sweep passed at 320, 360, 375, 414, 768, and 1280 px: no horizontal overflow, no management controls, stage label and short host present.
- `npm run build` passed.
- Visual screenshots reviewed: `test-results/presenter-polish-1280.png` and `test-results/presenter-polish-360.png`.
