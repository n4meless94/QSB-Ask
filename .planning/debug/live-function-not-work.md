---
status: resolved
trigger: "the live function not work. can you check?"
created: "2026-06-06T02:10:00+08:00"
updated: "2026-06-06T02:19:37+08:00"
---

## Symptoms

- expected_behavior: Live Q&A views should update across organiser/moderator, participant, and presenter screens after question submission, voting, moderation, answering, or archiving.
- actual_behavior: The supplied live screenshot shows all views connected, but participant/presenter screens appear stale after a moderation action.
- error_messages: No explicit error provided in chat. Screenshot shows connection indicators as connected.
- timeline: Reported on 2026-06-06 from the production domain `ask.qsbportal.com.my`.
- reproduction: Use the live Townhall event screens, perform a Q&A moderation action, and observe whether participant and presenter views update without manual refresh.

## Current Focus

- hypothesis: Supabase Realtime subscriptions connected, but production Q&A components copied server-provided questions into client state, so `router.refresh()` could fetch fresh props while the visible lists stayed stale.
- test: Refactor Q&A components to render production data directly from fresh server props while keeping fixture/optimistic state as local overlays; run focused Vitest, TypeScript, ESLint, and Playwright realtime checks.
- expecting: Realtime-triggered refresh updates moderator, participant, and presenter question lists while preserving fixture-mode refresh tests and optimistic vote feedback.
- next_action: Deploy the verified fix to production if live remediation is approved.

## Evidence

- timestamp: "2026-06-06T00:00:00+08:00"
  observation: Supplied screenshot shows organiser, participant, and presenter views on production with connection indicators reading connected/live while public-facing Q&A content appears stale after a moderation action.
- timestamp: "2026-06-06T02:12:00+08:00"
  observation: `AudienceQuestionList`, `PresenterView`, and `ModeratorQueue` initialized visible question lists from props using `useState(...)`; in production their realtime handlers only called `router.refresh()`, so fresh server props did not replace the copied client state.
- timestamp: "2026-06-06T02:15:00+08:00"
  observation: First prop-sync patch failed ESLint `react-hooks/set-state-in-effect`; final fix avoids synchronous setState-in-effect by deriving production lists from props and reserving local state for E2E fixture payloads and optimistic vote overlays.
- timestamp: "2026-06-06T02:17:00+08:00"
  observation: Audience Q&A tracked connection state invisibly; the existing realtime E2E expected visible connection feedback, so the participant list now renders `ConnectionStatus` like moderation/presenter surfaces.
- timestamp: "2026-06-06T02:19:00+08:00"
  observation: Production health check returned `HTTP 200` with `status:"ok"`, `environment:"production"`, and no missing configuration keys before deploying any code changes.

## Eliminated

- hypothesis: The live incident is a total Supabase Realtime connection outage.
  reason: The supplied screenshot and production health check show connected/healthy state; the stale UI matched client-state refresh handling instead.
- hypothesis: The focused Playwright failure after the fix indicated the audience UI was still stale.
  reason: Playwright's error snapshot showed the audience card had updated to `2 votes` and `Answered`; the failure was caused by a brittle text-node selector.

## Resolution

- root_cause: Production Q&A screens used `router.refresh()` as the realtime refresh trigger, but key client components rendered from stale local copies of server props instead of the refreshed props.
- fix: Render production question lists directly from current server props, keep fixture-mode updates in dedicated local state, keep participant optimistic vote counts as an overlay, and surface participant connection status.
- verification: `npm run test -- tests/qna/realtime.test.ts tests/qna/voting.test.ts tests/qna/moderation.test.ts`; `npx tsc --noEmit`; `npm run lint -- src/components/qna/AudienceQuestionList.tsx src/components/qna/PresenterView.tsx src/components/qna/ModeratorQueue.tsx tests/e2e/qna-realtime.spec.ts`; `npx playwright test tests/e2e/qna-realtime.spec.ts tests/e2e/qna-flow.spec.ts --project=chromium`; production `/api/health` HTTP 200 checked before deployment.
- files_changed: `src/components/qna/AudienceQuestionList.tsx`, `src/components/qna/PresenterView.tsx`, `src/components/qna/ModeratorQueue.tsx`, `tests/e2e/qna-realtime.spec.ts`
