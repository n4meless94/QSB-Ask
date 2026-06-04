---
status: complete
completed: "2026-06-04"
task: "Document QSB Ask GHCR-to-Coolify deployment playbook"
---

# Summary

Added a repo-local deployment playbook for QSB Ask's current GHCR-to-Coolify production path.

## Changed

- Added `.planning/deployment/ghcr-coolify-deploy-playbook.md`.
- Linked the new playbook from `README.md`.
- Linked the new playbook from `.planning/deployment/coolify-runbook.md`.
- Recorded the quick task in `.planning/STATE.md`.

## Key Captured Details

- `main` is the deploy branch for GHCR publish.
- Coolify uses `ghcr.io/n4meless94/qsb-ask:latest`.
- Coolify application UUID is `btstg1x4zzuqjc16yf4qluqv`.
- DNS for `ask.qsbportal.com.my` must be resolved before SSH because `ssh qsb` may point to a different QSB VPS host.
- Production verification must compare the running container's `org.opencontainers.image.revision` label with `git rev-parse HEAD`.

## Verification

- `rg` link/identifier check passed.
- `git diff --check` passed on touched docs and planning artifacts.
