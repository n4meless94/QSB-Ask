---
quick_id: 260603-wib
slug: recommended-homepage-structure-for-qsb-a
status: complete
created_at: "2026-06-03T15:24:23.763Z"
---

# Recommended Homepage Structure for QSB Ask

## Goal

Replace the public root setup console with a participant-first, Slido-like QSB Ask homepage while moving setup diagnostics to admin routes.

## Acceptance Criteria

- `/` presents QSB Ask as a corporate SaaS event platform with immediate event-code joining.
- Public homepage includes a product preview for Live Q&A and Live Polls.
- Homepage includes QSB-specific features, use cases, and the governance line "Nothing unapproved reaches a public screen."
- Setup diagnostics and missing environment keys are removed from `/` and available at `/admin/setup`.
- Non-secret health JSON remains available at `/api/health` and is also exposed at `/admin/health`.
- Focused E2E coverage verifies the new public/admin split and mobile no-overflow behavior.

## Scope

- Edit `src/app/page.tsx`.
- Add `src/app/admin/setup/page.tsx`.
- Add `src/app/admin/health/route.ts`.
- Extend token-based homepage CSS in `src/app/globals.css`.
- Update focused foundation E2E expectations in `tests/e2e/foundation.spec.ts`.
- Update `.planning/STATE.md` and Hallmark run log.

## Verification

- `npm run lint`
- `npm run build`
- `npx playwright test tests/e2e/foundation.spec.ts`
