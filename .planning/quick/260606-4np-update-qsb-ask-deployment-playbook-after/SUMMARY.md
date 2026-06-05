---
quick_id: 260606-4np
slug: update-qsb-ask-deployment-playbook-after
status: complete
completed_at: "2026-06-06T03:25:00+08:00"
---

# Summary

Updated the deployment playbook after branch cleanup so `main` is documented as the only local and remote deployment branch. Removed the old secondary `origin/master` sync step.

## Verification

- Confirmed GitHub default branch is `main`.
- Confirmed `.github/workflows/publish-ghcr.yml` triggers on `main`.
- Confirmed only `origin/main` remains after deleting `origin/master`.
- `git diff --check`

