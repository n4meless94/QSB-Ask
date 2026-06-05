---
quick_id: 260606-4cc
slug: fix-q-a-moderation-queue-presenter-focus
status: complete
completed_at: "2026-06-06T03:30:00+08:00"
---

# Summary

The moderation queue's presenter focus action now updates an existing Presenter View in the same browser context instead of opening a new popup. `PresenterView` listens for event-scoped focus changes, keeps the query-string focus behavior for direct links, and remounts the featured-question block with a short transition when the displayed question changes.

## Verification

- `npx eslint src/components/qna/ModeratorQueue.tsx src/components/qna/PresenterView.tsx src/lib/qna/presenter-control.ts tests/e2e/presenter-view.spec.ts tests/e2e/moderation.spec.ts`
- `npx tsc --noEmit`
- `npx playwright test tests/e2e/presenter-view.spec.ts tests/e2e/moderation.spec.ts`
- Browser visual check: opened Presenter View and moderator queue, clicked Queue #2, confirmed the existing Presenter View changed to Queue #2 and no popup opened.

