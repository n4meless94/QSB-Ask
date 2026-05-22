# Project State: QSB Ask

**Last updated:** 2026-05-22  
**Current phase:** Phase 1 - Foundation, Auth, And Data  
**Workflow mode:** yolo / auto  
**Project mode:** mvp

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-05-22)

**Core value:** No unapproved, sensitive, inappropriate, or confidential question should appear publicly before the organiser or moderator has control over it.

## Current Focus

Phase 1 prepares the technical and product foundation:

- Next.js/TypeScript/Tailwind app shell.
- Supabase client/server setup.
- Database schema and RLS foundation.
- Email/password login and password reset.
- Event dashboard and create event flow.
- Local development environment documentation.

## Roadmap Status

| Phase | Status | Requirements | Notes |
|-------|--------|--------------|-------|
| 1 | Pending | 9 | Foundation, auth, event dashboard, data security. |
| 2 | Pending | 27 | Live Q&A, moderation, audience, presenter. |
| 3 | Pending | 19 | Surveys, results, presentation, CSV export. |
| 4 | Pending | 4 | Deployment, reconnect handling, UAT readiness. |

## Active Constraints

- Build only against approved URS/PRD/SPEC/SRS and `.planning/` artifacts.
- Keep v1 focused on moderated Q&A, surveys, chart/data results, CSV export, roles, and deployment.
- Do not add Slido parity extras unless requirements are updated.
- Deploy long-lived app services through Coolify on QSB VPS, not ad hoc Docker.
- Use managed Supabase for v1 backend services.

## Recent Activity

- 2026-05-22: GSD project initialized.
- 2026-05-22: PROJECT.md, research files, REQUIREMENTS.md, ROADMAP.md, and STATE.md created from approved docs.

## Next Recommended Command

`$gsd-discuss-phase 1 --auto`
