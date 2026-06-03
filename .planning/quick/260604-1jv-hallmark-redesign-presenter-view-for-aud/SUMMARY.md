---
status: complete
date: 2026-06-04
slug: hallmark-redesign-presenter-view-for-aud
---

# Hallmark Presenter Redesign Summary

## Changes

- Redesigned `PresenterView` into a full-screen audience-facing stage surface.
- Made event identity, realtime status, and the featured approved question room-readable.
- Added a secondary approved queue and audience-safe empty state.
- Preserved approved-only question display and existing presenter authorization checks.
- Kept prior dashboard/operator UI improvements in the same delivery set.
- Included the existing `RootLayout` runtime connection fix so deployed pages read runtime Supabase config instead of stale build-time values.

## Verification

- `npm run lint` passed.
- `npx tsc --noEmit` passed.
- `npm test` passed: 19 files, 98 tests.
- `npm run build` passed.
- `npx playwright test tests/e2e/presenter-view.spec.ts --project=chromium` passed.
- `npx playwright test tests/e2e/presenter-view.spec.ts tests/e2e/event-workspace.spec.ts tests/e2e/moderation.spec.ts --project=chromium` passed: 8 tests.
- Screenshot smoke captured:
  - `test-results/qsb-ask-presenter-redesign-desktop.png`
  - `test-results/qsb-ask-presenter-redesign-mobile.png`

## Deployment Notes

- Deployment path is GitHub Actions publishing `ghcr.io/n4meless94/qsb-ask:latest`; Coolify consumes that image.
- Production smoke should verify `https://ask.qsbportal.com.my/api/health` after image deployment.

