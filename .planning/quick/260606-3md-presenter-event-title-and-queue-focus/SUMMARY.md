---
quick_id: 260606-3md
status: complete
completed_at: "2026-06-06T02:41:02+08:00"
---

# Summary

Removed the hardcoded presenter top-bar title and replaced it with the event name. Added a shared presenter queue helper so Presenter View and the moderation Q&A queue agree on public question order: `live` questions first, then `answered`, with older submissions earlier in the queue.

The presenter route now accepts `?questionId=...` to focus a specific public question. Moderation queue rows for `live` and `answered` questions show `Queue #n` and include an icon link that opens Presenter View focused on that question.

## Verification

- `npm run lint -- 'src/components/qna/PresenterView.tsx' 'src/components/qna/ModeratorQueue.tsx' 'src/app/(app)/events/[eventId]/presenter/page.tsx' 'tests/e2e/presenter-view.spec.ts' 'tests/e2e/moderation.spec.ts'` passed.
- `npx tsc --noEmit` passed.
- `npx playwright test tests/e2e/presenter-view.spec.ts tests/e2e/moderation.spec.ts --project=chromium` passed, 6 tests.
- `git diff --check -- ...` passed with only Windows CRLF warnings.
