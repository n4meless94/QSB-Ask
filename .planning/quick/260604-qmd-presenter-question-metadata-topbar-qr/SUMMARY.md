---
completed: 2026-06-04
status: complete
---

# Summary

Replaced the Presenter View's fake speaker identity with safe question metadata, tightened the topbar typography, made settings/fullscreen controls functional, and changed the presenter QR target to open the participant Q&A page directly.

## Changes

- Presenter View metadata now shows status, vote count, submitted time, and edited state.
- Presenter View prioritizes `live` questions ahead of `answered` questions before vote/recent sorting.
- Settings icon links to `/events/{eventId}?tab=settings`.
- Fullscreen icon toggles browser fullscreen state.
- Presenter QR value now targets `/join/{joinCode}/qna`.
- Participant Q&A connected state now says `Connected` without polling implementation details.
- Moderation queue now explains that approved live questions feed Presenter View, ordered by votes and recency.

## Verification

- `npm run lint` passed.
- `npx tsc --noEmit` passed.
- `npm test -- tests/qna/presenter.test.ts` passed.
- `npx playwright test tests/e2e/presenter-view.spec.ts tests/e2e/qna-submission.spec.ts tests/e2e/moderation.spec.ts` passed.
- `npm run build` passed.
- Captured screenshots:
  - `test-results/presenter-question-metadata-desktop-full.png`
  - `test-results/presenter-question-metadata-mobile-tall-full.png`
