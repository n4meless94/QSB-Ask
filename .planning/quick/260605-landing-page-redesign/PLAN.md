---
quick_id: 260605-lpr
slug: landing-page-redesign
status: complete
created_at: "2026-06-05T00:00:00+08:00"
---

# Landing Page Redesign

## Goal

Fully redesign the public QSB Ask landing page around a modern join/host event hero while removing the event listing sections.

## Acceptance Criteria

- Header shows QSB Ask without the round icon.
- Header links include My Events and Knowledge Base, with no Support link.
- Header CTA shows Sign in for signed-out users and Dashboard for signed-in users.
- Hero presents modern Join an Event and Host an Event panels.
- Active/upcoming event and recent event sections are omitted from `/`.
- Footer copyright reads `© 2026 Qhazanah Sabah Berhad.`
- Focused E2E homepage expectations are updated.

## Scope

- Edit `src/app/page.tsx`.
- Edit `src/app/globals.css`.
- Edit `tests/e2e/foundation.spec.ts`.
- Update `.hallmark/log.json` and `.planning/STATE.md`.

## Verification

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
