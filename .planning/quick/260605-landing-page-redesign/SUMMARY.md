---
quick_id: 260605-lpr
slug: landing-page-redesign
status: complete
completed_at: "2026-06-05T00:00:00+08:00"
---

# Summary

Redesigned the QSB Ask public landing page into a modern event portal hero with focused join and host panels.

## Completed Work

- Removed the QSB Ask round icon from the header and footer brand.
- Kept `My Events` and `Knowledge Base`; removed `Support`.
- Changed the signed-out header CTA to `Sign in`; signed-in users still see `Dashboard`.
- Replaced the old centered hero and two plain cards with a split command-portal layout.
- Removed active/upcoming and recent event sections from the root page.
- Updated the footer copyright to `© 2026 Qhazanah Sabah Berhad.`
- Updated focused Playwright homepage expectations and Hallmark run metadata.

## Verification

- `npm run lint` passed.
- `npx tsc --noEmit` passed.
- `npx playwright test tests/e2e/foundation.spec.ts` passed, 6/6 tests.
- `npm run build` passed.
- Desktop, tablet, and mobile Playwright screenshot sweep passed with no horizontal overflow:
  - `test-results/landing-desktop.png`
  - `test-results/landing-tablet.png`
  - `test-results/landing-mobile.png`
