---
quick_id: 260606-4np
slug: update-qsb-ask-deployment-playbook-after
status: complete
created_at: "2026-06-06T03:21:15+08:00"
---

# Update Deployment Playbook After Branch Cleanup

## Goal

Make the QSB Ask deployment playbook match the branch cleanup: `main` is the only local and remote deployment branch, and `master` is no longer used.

## Plan

1. Remove stale `master` branch fallback/sync instructions from the GHCR-to-Coolify playbook.
2. Update the push command to use normal `git push origin main`.
3. Record the quick-task completion in `.planning/STATE.md`.

