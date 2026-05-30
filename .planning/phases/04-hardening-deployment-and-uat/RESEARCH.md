# Phase 4 Research - Hardening, Deployment, And UAT

**Date:** 2026-05-30
**Status:** Ready for planning

## Summary

Phase 4 should be implemented as three vertical slices:

1. Reconnect hardening for live Q&A and survey presentation surfaces.
2. Coolify deployment readiness, including health checks, production runtime configuration, and self-hosted Next.js settings.
3. UAT/accessibility evidence, including practical operator runbooks and repeatable smoke verification.

The application already has a non-secret `/api/health` route, broad Playwright coverage, and basic `live` / `reconnecting` / `refresh-needed` state names. The main gaps are an explicit offline/prolonged reconnect experience, a keyboard-operable refresh action, production-readiness behavior for health checks, and a QSB Ask-specific Coolify/domain/UAT checklist.

## Verified Local Evidence

| Area | Evidence |
|------|----------|
| Health route | `src/app/api/health/route.ts` returns service, status, environment, configuration status, missing key names, and timestamp. |
| Env contract | `src/lib/env.ts` defines required Supabase, site URL, join URL, and idle timeout variables. |
| Q&A realtime | `src/lib/qna/realtime.ts` uses Supabase browser channels and calls `router.refresh()` through callbacks. |
| Survey realtime | `src/lib/surveys/realtime.ts` refreshes safe survey aggregate views through metadata callbacks and interval polling. |
| Status UI | `src/components/qna/ConnectionStatus.tsx` currently displays a small badge for `Connected`, `Reconnecting`, and `Refresh needed`. |
| E2E smoke | `tests/e2e/` has 17 specs covering foundation, auth, event workspace, participant join, Q&A, moderation, presenter view, surveys, presentation, and CSV exports. |

## Official Documentation Notes

| Topic | Source | Planning Use |
|-------|--------|--------------|
| Next.js standalone output | Context7 `/vercel/next.js/v16.2.2`; official Next.js output docs | Set `output: "standalone"` when using Docker-style self-hosted deployment and run generated `server.js`. Copy `.next/static` and `public` into the runtime image. |
| Next.js self-hosting | Official Next.js self-hosting docs | Run behind a reverse proxy such as Coolify/Traefik; the Next.js app should listen on `0.0.0.0` and the configured port. |
| Coolify Next.js app deployment | Coolify NextJS docs | Coolify supports Nixpacks or Dockerfile; for Dockerfile deployments expose port `3000` and set Build Pack to Dockerfile. |
| Coolify environment variables | Coolify environment variable docs | Build/runtime variables are configured in Coolify; runtime secrets should be available at container start and not printed. |
| Coolify health checks | Coolify health check docs | Health checks can be configured in the UI or Dockerfile; Traefik routes only to healthy resources when health checks are enabled. |

## Requirements Mapping

| Requirement | Research Finding |
|-------------|------------------|
| LIVE-06 | Existing states exist but need offline detection, prolonged reconnect escalation, refresh CTA, and tests. |
| DEPL-02 | `/api/health` exists but should distinguish liveness from production readiness without exposing secret values. |
| DEPL-03 | Project needs Coolify-compatible build/runtime configuration and a runbook that keeps deployment inside Coolify. |
| DEPL-04 | Project needs a DNS/Coolify cutover checklist for `https://ask.qsbportal.com.my`. |

## Recommended Plan Slices

| Plan | Purpose | Primary Files |
|------|---------|---------------|
| 04-01 | Harden live reconnect/offline/refresh-needed behavior. | `src/lib/qna/realtime.ts`, `src/lib/surveys/realtime.ts`, `src/components/qna/ConnectionStatus.tsx`, live-view components, realtime tests, E2E smoke. |
| 04-02 | Make deployment health/configuration Coolify-ready. | `next.config.ts`, `Dockerfile`, `.dockerignore`, `src/app/api/health/route.ts`, `README.md`, deployment docs, health tests. |
| 04-03 | Produce UAT, accessibility, mobile, and live-session readiness evidence. | `.planning/uat/`, `.planning/deployment/`, `tests/e2e/`, phase verification docs. |

## Risks And Mitigations

| Risk | Mitigation |
|------|------------|
| Local fixture tests overclaim hosted realtime latency. | Keep hosted two-second checks as UAT scenarios, not automated proof. |
| Health route exposes configuration details. | Return missing key names only; never return values. |
| Health route blocks local development when env is incomplete. | Preserve a liveness-friendly response in development/test, but fail readiness in production when required env is missing. |
| Docker/Coolify config drifts from Next.js guidance. | Use standalone output and a minimal runtime image based on official Next.js Docker guidance. |
| Deployment bypasses QSB VPS governance. | Runbook explicitly requires a Coolify application resource and excludes unmanaged long-lived services. |

## Verification Commands

- `npm test -- tests/qna/realtime.test.ts tests/surveys/realtime.test.ts tests/e2e/foundation.spec.ts`
- `npm run test:e2e -- tests/e2e/qna-realtime.spec.ts tests/e2e/audience-qna.spec.ts tests/e2e/moderation.spec.ts tests/e2e/presenter-view.spec.ts tests/e2e/survey-presentation.spec.ts`
- `npm run build`
- `npm run lint`
- `npx tsc --noEmit`

Hosted UAT after deployment:

- `curl -i https://ask.qsbportal.com.my/api/health`
- Run one live moderated Q&A update and one survey presentation update from separate browsers and record observed latency.
