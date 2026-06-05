---
status: resolved
trigger: "cannot archive event"
created: "2026-06-05T13:49:00+08:00"
updated: "2026-06-05T13:55:00+08:00"
---

## Symptoms

- expected_behavior: Confirming "Archive event" should archive the event, refresh the event page, and show a clear success or failure message.
- actual_behavior: The archive confirmation is visible, but archive does not complete from the user's report.
- error_messages: Browser console screenshot only shows a favicon 404; no visible archive-specific client error.
- timeline: Reported on 2026-06-05 from mobile-sized browser/devtools screenshot.
- reproduction: Open an organiser event, go to Settings, click "Archive event", then confirm "Archive event" in the dialog.

## Current Focus

- hypothesis: Lifecycle form actions discard server action results, so archive failures are invisible; E2E fixture auth can also render an organiser page while the archive action still fails real Supabase auth.
- test: Inspect lifecycle action wiring and E2E auth path; add regression coverage for returned lifecycle form results and fixture-auth archive.
- expecting: Archive/close form actions return actionable state, UI displays it, and E2E fixture auth resolves to the organiser fixture user.
- next_action: Patch lifecycle actions/UI and run focused unit/E2E verification.

## Evidence

- timestamp: "2026-06-05T13:49:00+08:00"
  observation: `archiveEventAction` returns `{ ok, message }`, but `archiveEventFormAction` returns `void`, discarding both success and failure results.
- timestamp: "2026-06-05T13:49:00+08:00"
  observation: `EventSettingsPanel` uses plain `<form action={archiveAction}>` for lifecycle dialogs, so it has no action state to show the returned archive error.
- timestamp: "2026-06-05T13:49:00+08:00"
  observation: Event pages can render organiser fixture access through `qsb_ask_e2e_auth`, but `signedInUserId()` always calls Supabase Auth and does not honour that fixture path.
- timestamp: "2026-06-05T13:54:00+08:00"
  observation: Focused Vitest, TypeScript, ESLint, and Playwright event-settings checks pass after lifecycle action state and fixture-auth fixes.
- timestamp: "2026-06-05T14:00:00+08:00"
  observation: Full Vitest suite passes with 20 test files and 106 tests.
- timestamp: "2026-06-05T14:07:00+08:00"
  observation: Production build passes with Next.js 16.2.6.
- timestamp: "2026-06-05T13:58:00+08:00"
  observation: In-app browser could open the local app, but its read-only page evaluation and available capabilities did not allow setting the E2E auth cookie; it redirected to `/login`.

## Eliminated

- hypothesis: The browser reported a JavaScript client error while opening the archive dialog.
  reason: The supplied console screenshot only shows `/favicon.ico` 404, not an archive-specific browser exception.

## Resolution

- root_cause: Event lifecycle dialog submissions discarded server action results, hiding archive failures from the organiser; E2E fixture-auth pages also rendered organiser UI without giving lifecycle actions a matching fixture update path.
- fix: Return lifecycle form action results to `useActionState`, render lifecycle success/error feedback, hide dialogs only after successful action state, and allow fixture-auth lifecycle actions to return success without hitting a missing local Supabase row.
- verification: `npm run test -- tests/events/event-settings.test.ts`; `npm test`; `npx tsc --noEmit`; `npm run lint`; `npx playwright test tests/e2e/event-settings.spec.ts --project=chromium`; `npm run build`.
- files_changed: `src/app/(app)/events/[eventId]/settings-actions.ts`, `src/components/events/EventSettingsPanel.tsx`, `tests/events/event-settings.test.ts`, `tests/e2e/event-settings.spec.ts`
