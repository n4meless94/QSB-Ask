---
quick_id: 260606-3md
status: complete
created_at: "2026-06-06T02:41:02+08:00"
---

# Presenter Event Title And Queue Focus

## Goal

Remove the hardcoded "Townhall Briefing" presenter header and make presenter question selection queue-first, with a moderation queue affordance for opening a specific public question in Presenter View.

## Acceptance Criteria

- Presenter top bar shows the actual event title.
- Presenter default question uses public presenter queue order instead of vote popularity.
- Moderation Q&A cards show queue numbers for `live` and `answered` questions.
- Public queue cards include an icon link to open Presenter View focused on that question.
- Pending and archived questions remain excluded from presenter/public surfaces.

## Verification

- `npm run lint -- 'src/components/qna/PresenterView.tsx' 'src/components/qna/ModeratorQueue.tsx' 'src/app/(app)/events/[eventId]/presenter/page.tsx' 'tests/e2e/presenter-view.spec.ts' 'tests/e2e/moderation.spec.ts'`
- `npx tsc --noEmit`
- `npx playwright test tests/e2e/presenter-view.spec.ts tests/e2e/moderation.spec.ts --project=chromium`
- `git diff --check -- 'src/lib/qna/presenter-queue.ts' 'src/components/qna/PresenterView.tsx' 'src/app/(app)/events/[eventId]/presenter/page.tsx' 'src/components/qna/ModeratorQueue.tsx' 'tests/e2e/presenter-view.spec.ts' 'tests/e2e/moderation.spec.ts'`
