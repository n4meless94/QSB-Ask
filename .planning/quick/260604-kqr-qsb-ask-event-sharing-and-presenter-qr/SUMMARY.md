---
status: complete
completed: "2026-06-04"
task: "Add event sharing QR and presenter QR display"
---

# Summary

Implemented QR slices 1 and 2 for QSB Ask.

## Changed

- Added shared `EventJoinQrCard` using `qrcode.react`.
- Added an Event Workspace QR sharing card with join code, join link, and PNG download.
- Added a Presenter View QR display with larger scan copy and fallback join code/link.
- Passed join code/link into Presenter View from both fixture and real presenter loaders.
- Updated focused E2E specs for Event Workspace and Presenter View QR UI.

## Verification

- `npm run lint` passed.
- `npx tsc --noEmit` passed.
- `npm test` passed: 19 files, 98 tests.
- `npm run test:e2e -- tests/e2e/event-workspace.spec.ts tests/e2e/presenter-view.spec.ts --project=chromium` passed: 6 tests.
- `npm run build` passed.
- One-off Playwright DOM check passed on `http://127.0.0.1:3000`: Event Workspace and Presenter View each rendered one QR canvas with no desktop overflow.
