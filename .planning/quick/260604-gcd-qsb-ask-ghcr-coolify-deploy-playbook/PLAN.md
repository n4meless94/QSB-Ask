---
status: complete
created: "2026-06-04"
task: "Document QSB Ask GHCR-to-Coolify deployment playbook"
---

# Quick Task: QSB Ask GHCR-To-Coolify Deploy Playbook

## Goal

Create a concrete repo-local playbook for the deployment path used by QSB Ask after the event dashboard UI polish deploy.

## Scope

- Add a day-2 deploy playbook under `.planning/deployment/`.
- Link it from `README.md`.
- Link it from the existing Coolify setup runbook.
- Update `.planning/STATE.md` quick-task history.

## Acceptance Criteria

- The playbook documents the `main` branch GHCR trigger.
- The playbook documents the Coolify app UUID and image.
- The playbook documents the DNS-origin host check before SSH.
- The playbook documents the Coolify deployment queue step and revision-label verification.
- The playbook avoids secrets and avoids unmanaged Docker replacement.

## Verification

- Run text search for the new playbook path and key operational identifiers.
- Run `git diff --check` on touched documentation files.
