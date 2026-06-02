---
status: complete
date: 2026-06-02
slug: docker-webpack-build
---

# Docker Webpack Build Summary

## Changes

- Updated the Docker build stage to run `npm run build -- --webpack`.
- Added `public/.gitkeep` so the standalone image can copy `/app/public`.
- Added a GitHub Actions workflow that publishes `ghcr.io/n4meless94/qsb-ask`.
- Ignored `.planning/**` changes for automatic image publishing.

## Verification

- VPS pulled `main` from `https://github.com/n4meless94/QSB-Ask.git`.
- VPS Docker build completed successfully for commit `153c4688dc00`.
- Direct VPS GHCR push was blocked by registry token scope.
- GitHub Actions run `26830166818` completed successfully for commit `3cf8a2085838d8e43e1d598426109bffeb743690`.
- VPS pulled `ghcr.io/n4meless94/qsb-ask:latest` successfully with digest `sha256:c2f183010e8950676b1f940d5efa49f87a341dbf61b87ea6064d3df3b2be1e54`.

## Remaining Deployment Gate

Coolify still needs production runtime environment variables before `/api/health` can pass:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`NEXT_PUBLIC_SITE_URL`, `APP_JOIN_URL_BASE`, and `APP_SESSION_IDLE_TIMEOUT_SECONDS`.
