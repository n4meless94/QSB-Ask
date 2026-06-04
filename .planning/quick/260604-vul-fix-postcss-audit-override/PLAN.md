---
status: complete
created: "2026-06-04"
task: "Fix npm audit PostCSS finding"
---

# Quick Task: Fix npm audit PostCSS Finding

## Goal

Resolve the two moderate npm audit findings introduced by Next's nested vulnerable PostCSS dependency without downgrading Next or moving to a canary release.

## Scope

- Inspect `npm audit`.
- Confirm vulnerable path.
- Add a minimal package override for patched PostCSS.
- Refresh `package-lock.json`.
- Re-run audit and package verification.

## Acceptance Criteria

- `npm audit` reports zero vulnerabilities.
- `npm ls postcss` shows Next using a patched PostCSS version.
- Lint, typecheck, unit tests, build, and focused QR E2E still pass.
