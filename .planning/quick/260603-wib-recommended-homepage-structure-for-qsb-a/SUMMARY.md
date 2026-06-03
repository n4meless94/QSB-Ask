---
quick_id: 260603-wib
slug: recommended-homepage-structure-for-qsb-a
status: complete
completed_at: "2026-06-03T16:10:00Z"
---

# Summary

Implemented a participant-first QSB Ask homepage and moved setup diagnostics out of the public root route.

## Completed Work

- Replaced `/` setup-console content with a Slido-like landing page:
  - event-code join box,
  - organiser secondary CTA,
  - Live Q&A and Live Poll product preview,
  - QSB-specific feature and use-case sections,
  - governance section with "Nothing unapproved reaches a public screen."
- Added `/admin/setup` for runtime setup diagnostics and missing environment keys.
- Added `/admin/health` as an admin-path JSON health alias while preserving `/api/health`.
- Migrated Next.js `src/middleware.ts` to `src/proxy.ts` for the Next 16 proxy convention.
- Updated focused Playwright coverage for the homepage and admin diagnostics split.
- Updated `.planning/STATE.md` and `.hallmark/log.json`.

## Verification

- `npm run lint` passed.
- `npm run build` passed.
- `npx playwright test tests/e2e/foundation.spec.ts` passed, 6/6 tests.
- Playwright screenshots were captured at:
  - `test-results/homepage-desktop.png`
  - `test-results/homepage-mobile.png`

## Residual Notes

- An already-running `next dev` process on `http://127.0.0.1:3000` still displayed the stale dev "1 issue" badge in screenshots after the proxy migration. Build output no longer reports the middleware deprecation warning. Restarting that existing dev server should clear the stale badge.
- Starting a separate `next dev` instance on port 3001 is blocked by Next.js because another dev server is already running for this app.
