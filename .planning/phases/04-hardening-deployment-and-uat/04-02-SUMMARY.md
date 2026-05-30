---
phase: "04-hardening-deployment-and-uat"
plan: "02"
status: complete
completed: 2026-05-30
commits:
  - pending
requirements:
  - DEPL-02
  - DEPL-03
  - DEPL-04
---

# Plan 04-02 Summary - Coolify Health And Deployment Readiness

## What Changed

- Added `src/lib/health.ts` so `/api/health` has a testable, secret-safe response builder.
- Updated `src/app/api/health/route.ts` to return HTTP 503 in production when required runtime configuration is missing, while keeping local development health reachable.
- Added a Coolify Dockerfile path using Next.js standalone output for Docker/Coolify builds.
- Added `.dockerignore` to keep secrets, build output, dependencies, test artifacts, and planning files out of the Docker build context.
- Updated `README.md` with production health behavior and the Coolify deployment pointer.
- Added `.planning/deployment/coolify-runbook.md` with environment variable names, health path, port, DNS/domain cutover, smoke checks, and rollback notes.

## Decisions

- Standalone output is enabled by `QSB_ASK_STANDALONE_OUTPUT=1` for Docker/Coolify builds. Local `npm run build` remains a normal Next.js build because this OneDrive-backed Windows checkout fails during the final `.next/standalone` copy step even after compile/typecheck/static generation succeeds.
- Health responses include missing environment key names only and never include secret values.
- The deployment runbook keeps v1 deployment inside Coolify and managed Supabase, matching QSB VPS governance.

## Verification

- `npm test -- tests/health.test.ts` - passed, 3 tests.
- `npx tsc --noEmit` - passed.
- `npm run lint` - passed when run without Playwright in parallel.
- `npm run build` - passed for the local non-standalone verification build.
- `npm run test:e2e -- tests/e2e/foundation.spec.ts` - passed, 3 tests.

## Notes

- `QSB_ASK_STANDALONE_OUTPUT=1 npm run build` reached compile, TypeScript, static generation, and final optimization, then failed while copying a Next internal file into `.next/standalone` on the OneDrive path. The runbook documents using Docker/Coolify or a non-synced checkout for standalone packaging verification if that Windows/OneDrive copy failure appears.
