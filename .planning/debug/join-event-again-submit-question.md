---
status: resolved
trigger: "sometimes participants join link via qr when submit question it said please join event again"
created: 2026-06-09
updated: 2026-06-09
---

# Debug Session: join-event-again-submit-question

## Symptoms

- expected_behavior: "Scanning a Q&A QR should establish the participant session before the participant asks a question."
- actual_behavior: "Some participants can reach the Q&A form from a QR/link, submit a question, and then see the join-again message."
- error_messages: "\"Join this event again before submitting a question.\""
- timeline: "Reported on 2026-06-09 after the earlier cookie-scope fix was already present in production."
- reproduction: "Open a QR/link that lands directly on `/join/{joinCode}/qna`, then submit a question without first passing through `/join/{joinCode}`."

## Current Focus

- hypothesis: "The presenter QR link bypasses the participant join action by targeting the Q&A subroute directly."
- test: "Inspect generated presenter QR joinLink and participant Q&A no-cookie behavior; add focused regression coverage."
- expecting: "Presenter QR should point to `/join/{joinCode}` so the join action sets the participant cookie before redirecting to Q&A."
- next_action: "deploy and mobile-UAT presenter QR join-entry fix"
- reasoning_checkpoint:
- tdd_checkpoint:

## Evidence

- 2026-06-09: Production running revision `973a1fcfb6c3f98b73f9eea6a4f10e544b30469d` already contains the participant cookie `path: "/join"` fix, so the question-submit report is not the old narrow-cookie-path issue.
- 2026-06-09: `src/app/(app)/events/[eventId]/presenter/page.tsx` built the presenter Q&A QR link by appending `/qna` to the event join link, allowing QR scans to bypass `joinParticipantAction`.
- 2026-06-09: `src/app/join/[joinCode]/qna/submit-actions.ts` returns exactly `"Join this event again before submitting a question."` when the event-scoped participant cookie is missing.
- 2026-06-09: Focused verification passed: Vitest participant/session/presenter tests, TypeScript, ESLint, and Playwright Q&A submission plus presenter-view specs against a webpack dev server.

## Eliminated

- hypothesis: "Production is missing the earlier `/join` cookie-scope fix."
  reason: "Live container revision inspection and `origin/main` source show participant cookies are already scoped to `/join`."

## Resolution

- root_cause: "The presenter Q&A QR linked directly to `/join/{joinCode}/qna`, skipping the join action that creates the participant session cookie."
- fix: "Make presenter Q&A QR/link use the join entry URL `/join/{joinCode}`, redirect no-cookie Q&A subroute visitors back to join, and require a participant cookie before the E2E submission shortcut."
- verification: "`npm test -- tests/qna/submission.test.ts tests/qna/participant-session.test.ts tests/qna/presenter.test.ts`; `npx tsc --noEmit`; focused ESLint on touched files; `npx playwright test tests/e2e/qna-submission.spec.ts tests/e2e/presenter-view.spec.ts --project=chromium --workers=1` against manual `next dev --webpack`."
- files_changed: "src/app/(app)/events/[eventId]/presenter/page.tsx; src/app/join/[joinCode]/qna/page.tsx; src/app/join/[joinCode]/qna/submit-actions.ts; src/components/qna/PresenterView.tsx; tests/e2e/presenter-view.spec.ts; tests/e2e/qna-submission.spec.ts; tests/qna/submission.test.ts"
