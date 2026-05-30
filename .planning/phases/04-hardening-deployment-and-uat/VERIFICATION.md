---
phase: "04-hardening-deployment-and-uat"
status: human_needed
score: "6 PASS, 1 HUMAN_NEEDED"
verified_at: 2026-05-30
requirements:
  - LIVE-06
  - DEPL-02
  - DEPL-03
  - DEPL-04
human_verification:
  - id: LIVE-UAT-01
    finding: "Hosted Supabase Realtime latency needs a real deployed event session."
    why_human: "Local fixture tests prove UI behavior and refresh plumbing, but not real network latency through managed Supabase, Coolify, browser clients, and QSB network conditions."
---

# Phase 4 Verification - Hardening, Deployment, And UAT

## Verdict

**Status:** Human-needed, no code blockers.

Phase 4 satisfies the implemented hardening and deployment-readiness requirements in code, config, docs, and automated tests. The remaining validation is hosted UAT for real live-session latency and Coolify production cutover.

## Success Criteria

| Criterion | Result | Evidence | Remaining Work |
|-----------|--------|----------|----------------|
| Live views show reconnect state and prompt refresh after prolonged reconnection failure. | PASS | `src/lib/qna/realtime.ts`, `src/lib/surveys/realtime.ts`, `src/components/qna/ConnectionStatus.tsx`, `04-01-SUMMARY.md`; focused reconnect unit/E2E tests passed. | Hosted live interruption smoke. |
| App exposes a health route suitable for Coolify verification. | PASS | `src/app/api/health/route.ts`, `src/lib/health.ts`, `tests/health.test.ts`, `tests/e2e/foundation.spec.ts`. | Verify deployed `/api/health` after Coolify env is configured. |
| App is configured for Coolify-managed deployment on QSB VPS. | PASS | `Dockerfile`, `.dockerignore`, `next.config.ts`, `.planning/deployment/coolify-runbook.md`. | Create/update actual Coolify resource. |
| Production domain plan for `https://ask.qsbportal.com.my` is ready. | PASS | `.planning/deployment/coolify-runbook.md`, `README.md`. | DNS/Coolify cutover by operator. |
| Core flows pass accessibility, mobile, and live-session smoke checks. | PASS + HUMAN_NEEDED | Existing and Phase 4 Playwright specs cover 360px/no-control/refresh UI; `.planning/uat/v1-smoke-checklist.md` lists hosted checks. | Run full hosted smoke after deployment. |
| UAT scenarios can be generated from PRD/SPEC and run by the user. | PASS | `.planning/uat/v1-uat-scenarios.md`. | User/operator execution. |

## Requirement Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| LIVE-06 | PASS + HUMAN_NEEDED | Reconnect/offline/refresh-needed states implemented and tested; hosted latency/interruption UAT remains. |
| DEPL-02 | PASS | Health route returns secret-safe operational JSON and production readiness failure when config is missing. |
| DEPL-03 | PASS | Dockerfile/Coolify runbook keep deployment as a Coolify-managed Next.js resource. |
| DEPL-04 | PASS | Runbook and README prepare `https://ask.qsbportal.com.my` cutover checks. |

## Automated Verification Evidence

Completed during Phase 4:

- `npm test -- tests/qna/realtime.test.ts tests/surveys/realtime.test.ts` - passed, 9 tests.
- `npm run test:e2e -- tests/e2e/qna-realtime.spec.ts tests/e2e/survey-presentation.spec.ts` - passed, 6 tests.
- `npm test -- tests/health.test.ts` - passed, 3 tests.
- `npm test` - passed, 19 files and 95 tests.
- `npx tsc --noEmit` - passed.
- `npm run lint` - passed.
- `npm run build` - passed for local verification build.
- `npm run test:e2e -- tests/e2e/foundation.spec.ts` - passed, 3 tests.
- `npm run test:e2e -- --workers=1` - passed, 53 tests.

## Human Verification

Run after Coolify deployment:

1. `curl -i https://ask.qsbportal.com.my/api/health`
2. Confirm HTTP 200, `"ok": true`, and no secret values.
3. Run a moderated Q&A update from separate organiser/moderator/participant/presenter browsers.
4. Run a survey presentation update from separate organiser/participant/presentation browsers.
5. Record observed update timings and network conditions.

## Known Environment Note

`QSB_ASK_STANDALONE_OUTPUT=1 npm run build` reached compile, TypeScript, static generation, and final optimization, then failed during the final `.next/standalone` file copy in this Windows OneDrive checkout. The Dockerfile enables standalone output for Coolify/Linux builds; local non-standalone `npm run build` passed. Use Docker/Coolify or a non-synced local checkout to verify standalone packaging if Windows/OneDrive repeats the copyfile error.
