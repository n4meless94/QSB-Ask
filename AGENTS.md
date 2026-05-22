<!-- GSD:project-start source:PROJECT.md -->
## Project

**QSB Ask**

QSB Ask is a Slido-style live Q&A and survey web application for QSB internal events, briefings, training sessions, and invited stakeholder sessions. It helps organisers collect questions and survey responses while keeping public participation controlled, moderated, and suitable for corporate use.

Version 1 focuses on moderated live Q&A, presenter view, practical surveys, live survey chart/data views, CSV export, access roles, and hybrid deployment through QSB VPS/Coolify with managed Supabase backend services.

**Core Value:** No unapproved, sensitive, inappropriate, or confidential question should appear publicly before the organiser or moderator has control over it.

### Constraints

- **Documentation**: Build from approved URS, PRD, SPEC, and SRS only - avoids scope drift.
- **Deployment**: Next.js application must be a Coolify-managed resource on QSB VPS - aligns with VPS governance.
- **Backend**: Managed Supabase is approved for v1 Auth, Postgres, Realtime, and data storage - keeps MVP speed high.
- **Live updates**: Core live views must update within 2 seconds - required by SPEC and PRD.
- **Moderation**: Public views must never show pending, dismissed, or archived questions - primary safety requirement.
- **Export**: v1 export format is CSV only - keeps reporting practical without slowing MVP.
- **Accessibility**: Target WCAG 2.1 AA for core flows - required by SPEC.
- **Audience UX**: Audience screens must be mobile-friendly - participants are expected to use phones.
- **Capacity**: v1 target is 300 participants per active event - approved SRS target.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
- Next.js 16.x App Router with React and TypeScript.
- Tailwind CSS with a small internal component set.
- Managed Supabase for Auth, Postgres, Row Level Security, Realtime, and database APIs.
- Recharts 3.x for survey result charts.
- Coolify on QSB VPS for Next.js app deployment.
- CSV export generated server-side.
## Why This Stack Fits
## Notes
- Supabase custom domains are paid-plan add-ons, so v1 should keep the default Supabase project URL in configuration.
- Users should only see `ask.qsbportal.com.my`.
- Backend can move fully onto QSB VPS later only if data governance requires it.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
