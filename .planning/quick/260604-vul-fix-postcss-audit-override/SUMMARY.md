---
status: complete
completed: "2026-06-04"
task: "Fix npm audit PostCSS finding"
---

# Summary

Added a root npm override for `postcss@8.5.15` so Next's nested PostCSS dependency resolves to the patched version instead of `8.4.31`.

## Verification

- `npm audit` passed with 0 vulnerabilities.
- `npm ls postcss` shows `next@16.2.6` resolving to `postcss@8.5.15`.
- `npm run lint` passed.
- `npx tsc --noEmit` passed.
- `npm test` passed: 19 files, 98 tests.
- `npm run build` passed.
- `npm run test:e2e -- tests/e2e/event-workspace.spec.ts tests/e2e/presenter-view.spec.ts --project=chromium` passed: 6 tests.
