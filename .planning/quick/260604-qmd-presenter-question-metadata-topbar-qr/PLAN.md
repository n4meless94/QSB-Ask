---
created: 2026-06-04
status: in_progress
---

# Presenter Question Metadata, Topbar, And Q&A QR

## Goal

Polish the redesigned Presenter View by replacing fake speaker identity with safe question metadata, making the topbar controls functional, and sending presenter QR scans directly to the participant Q&A section.

## Scope

- Use approved-question metadata in the Presenter View identity block.
- Make presenter settings open the event settings tab.
- Make fullscreen toggle the browser fullscreen API.
- Point Presenter View QR to `/join/{joinCode}/qna`.
- Remove noisy live-update polling copy from participant Q&A.
- Clarify in moderation UI that approving a question puts it into Presenter View rotation.

## Verification

- `npm run lint`
- `npx tsc --noEmit`
- focused unit/e2e tests for presenter/Q&A
- responsive screenshot or overflow sweep if frontend changes need it
