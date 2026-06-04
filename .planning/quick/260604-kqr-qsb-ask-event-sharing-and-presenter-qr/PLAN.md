---
status: complete
created: "2026-06-04"
task: "Add event sharing QR and presenter QR display"
---

# Quick Task: QSB Ask Event Sharing And Presenter QR

## Goal

Add the first two QR slices for QSB Ask:

- Slice 1: Event Workspace QR sharing card for organisers/staff.
- Slice 2: Presenter View QR display for room scanning.

## Scope

- Add a reusable QR component that encodes the public event join link only.
- Render the QR in the Event Workspace join panel with PNG download.
- Render the QR in Presenter View with large join code/link fallback text.
- Preserve existing copy join details behavior.
- Update E2E coverage for both surfaces.

## Acceptance Criteria

- QR source is `event.joinLink`.
- Join code remains visible as fallback text.
- Event Workspace has a `Download QR PNG` action.
- Presenter View shows a room-readable "Scan to ask a question" QR area.
- Public/presenter surfaces do not expose organiser-only IDs or tokens.
- Mobile overflow checks continue to pass.

## Verification

- `npm run lint`
- `npx tsc --noEmit`
- `npm test`
- focused Playwright E2E for event workspace and presenter view
