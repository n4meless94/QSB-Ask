---
quick_id: 260609-1jj
slug: mobile-participant-bottom-tab-navigation
status: complete
completed_at: 2026-06-09
commit: ee5df84
---

# Summary

Mobile participants now switch between Q&A and Surveys using a fixed bottom tab bar, while tablet and desktop users keep the existing top segmented navigation.

## Changes

- Added `ParticipantSectionNav` as the shared participant Q&A/Surveys navigation component.
- Kept the top segmented nav on `sm+` screens and added a safe-area-aware fixed bottom tab bar on mobile.
- Preserved the latest all-published survey queue behavior, including a mobile Surveys badge when open survey count is known.
- Added mobile bottom padding on participant pages so form content is not hidden behind the fixed bar.
- Replaced the Q&A vote chevron with `ArrowBigUp` and moved the vote toast above the mobile bottom tab bar.
- Added a Playwright assertion that mobile Q&A exposes the Surveys tab at the bottom without horizontal overflow.

## Verification

- `npx eslint src/components/participants/ParticipantSectionNav.tsx src/components/qna/AudienceQuestionList.tsx "src/app/join/[joinCode]/qna/page.tsx" "src/app/join/[joinCode]/surveys/page.tsx" tests/e2e/audience-qna.spec.ts tests/e2e/survey-submission.spec.ts tests/e2e/participant-journey.spec.ts` passed.
- `npx tsc --noEmit` passed.
- `git diff --check` passed with standard Windows LF-to-CRLF warnings only.
- `npx playwright test tests/e2e/audience-qna.spec.ts tests/e2e/survey-submission.spec.ts tests/e2e/participant-journey.spec.ts --workers=1` passed.
- In-app browser mobile viewport `430x932` confirmed Q&A and Surveys bottom tabs, no horizontal overflow, visible multi-survey copy, and `ArrowBigUp` vote icon.
- `npx vitest run tests/qna/voting.test.ts tests/surveys/participant.test.ts` passed.
- `npm run build` passed.
