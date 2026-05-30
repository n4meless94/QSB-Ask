# QSB Ask

QSB Ask is a QSB internal live Q&A and survey application. Version 1 starts with a Next.js App Router foundation, Supabase configuration, a quiet operational shell, and a machine-readable health route.

## Local Setup

Install dependencies:

```bash
npm install
```

Create local environment variables from the example:

```bash
cp .env.example .env.local
```

Configure these values in `.env.local`:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Managed Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase anon key for browser-safe client access. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase service role key. Never expose this in UI or client code. |
| `NEXT_PUBLIC_SITE_URL` | Local or deployed app URL. Use `http://localhost:3000` for local development. |
| `APP_JOIN_URL_BASE` | Base URL used later for audience join links. |
| `APP_SESSION_IDLE_TIMEOUT_SECONDS` | Organiser inactivity timeout. Phase 1 uses `28800` for 8 hours. |

Start the local app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Health Check

The foundation exposes a non-secret health route for local checks and future deployment verification:

```bash
curl http://localhost:3000/api/health
```

The response includes service name, status, runtime environment, configuration status, and timestamp. It reports missing environment variable names only; it does not return secret values.

In production, `/api/health` returns a non-OK HTTP status when required runtime configuration is missing so Coolify health checks do not route traffic to an incomplete deployment.

## Coolify Deployment

QSB Ask v1 is intended to run as a Coolify-managed Next.js application on QSB VPS, with managed Supabase retained for Auth, Postgres, Realtime, and data storage.

Deployment readiness lives in `.planning/deployment/coolify-runbook.md`. The production public URL target is:

```text
https://ask.qsbportal.com.my
```

The repository includes a Dockerfile for Coolify Dockerfile build mode. The Docker build enables Next.js standalone output with `QSB_ASK_STANDALONE_OUTPUT=1`, exposes port `3000`, and starts the generated `server.js` with `HOSTNAME=0.0.0.0`.

## Verification

Run the local checks:

```bash
npm run lint
npm run test
npx tsc --noEmit
npm run build
npm run test:e2e -- tests/e2e/foundation.spec.ts
```

The Playwright smoke test starts the Next.js dev server automatically.
