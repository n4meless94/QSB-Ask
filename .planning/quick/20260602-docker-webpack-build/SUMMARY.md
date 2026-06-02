---
status: complete
date: 2026-06-02
slug: docker-webpack-build
---

# Docker Webpack Build Summary

## Changes

- Updated the Docker build stage to run `npm run build -- --webpack`.
- Added `public/.gitkeep` so the standalone image can copy `/app/public`.
- Added `curl` to the runtime image so Coolify Docker health checks can execute.
- Added a GitHub Actions workflow that publishes `ghcr.io/n4meless94/qsb-ask`.
- Ignored `.planning/**` changes for automatic image publishing.

## Verification

- VPS pulled `main` from `https://github.com/n4meless94/QSB-Ask.git`.
- VPS Docker build completed successfully for commit `153c4688dc00`.
- Direct VPS GHCR push was blocked by registry token scope.
- GitHub Actions run `26830166818` completed successfully for commit `3cf8a2085838d8e43e1d598426109bffeb743690`.
- GitHub Actions run `26830471429` completed successfully for commit `ddc20e2e86c125f128efa274d4fa36ab36d51e51`.
- VPS pulled `ghcr.io/n4meless94/qsb-ask:latest` successfully with digest `sha256:b06c908f15c80a8f4cd8dd0b165f9ec89dc67f466ec80290be0579d4d10dcf14`.
- Temporary VPS container smoke returned expected HTTP `503 configuration_missing` without production env vars.
- GitHub Actions run `26833875249` completed successfully for commit `6137db373bf29610d17400151f89eaa8a296451a`.
- Coolify project/app created for `QSB Ask`; app UUID `btstg1x4zzuqjc16yf4qluqv`, domain `https://ask.qsbportal.com.my`, image `ghcr.io/n4meless94/qsb-ask:latest`.
- Coolify runtime env vars were configured without recording secret values.
- VPS container `btstg1x4zzuqjc16yf4qluqv-163830306351` reached Docker `healthy`; forced-origin `/api/health` returned HTTP `200` with `ok=true`.

## Remaining Deployment Gate

Cloudflare still returns HTTP `526` because Traefik has only the default certificate for
`ask.qsbportal.com.my`. Traefik ACME logs show Let's Encrypt challenge requests are hitting
Cloudflare proxy addresses and returning `404`. Temporarily set the Cloudflare DNS record to
DNS-only until Traefik obtains the certificate, then retest public `/api/health`.
