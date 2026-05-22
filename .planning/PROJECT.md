# QSB Ask

## What This Is

QSB Ask is a Slido-style live Q&A and survey web application for QSB internal events, briefings, training sessions, and invited stakeholder sessions. It helps organisers collect questions and survey responses while keeping public participation controlled, moderated, and suitable for corporate use.

Version 1 focuses on moderated live Q&A, presenter view, practical surveys, live survey chart/data views, CSV export, access roles, and hybrid deployment through QSB VPS/Coolify with managed Supabase backend services.

## Core Value

No unapproved, sensitive, inappropriate, or confidential question should appear publicly before the organiser or moderator has control over it.

## Requirements

### Validated

(None yet - ship to validate)

### Active

- [ ] Organisers can sign in, create events, and manage event settings.
- [ ] Participants can join an event by code or link without creating an account.
- [ ] Participants can submit questions with event-level identity rules.
- [ ] Questions enter moderation by default and only approved questions appear publicly.
- [ ] Moderators can approve, dismiss, edit, archive, restore, and mark questions as answered.
- [ ] Audience, moderator, presenter, presentation, and results views update live within 2 seconds.
- [ ] Participants can upvote approved live questions once per session.
- [ ] Speakers can use a presenter view that shows approved questions only.
- [ ] Organisers can create surveys with multiple choice, multiple select, rating, and open text questions.
- [ ] Organisers can control whether participants see survey results.
- [ ] Organisers can show survey results through chart and data views.
- [ ] Organisers can export questions, moderation history, and survey responses as CSV.
- [ ] Events support organiser, moderator, and speaker roles.
- [ ] The app deploys as a Coolify-managed Next.js application on QSB VPS with managed Supabase Auth/Postgres/Realtime.

### Out of Scope

- Full Slido feature parity - v1 focuses on Q&A, moderation, surveys, results, and export.
- Quizzes - not required for the core controlled Q&A/survey workflow.
- Word clouds - engagement feature, not central to moderated Q&A.
- Idea boards - separate collaboration pattern that would broaden scope.
- AI-generated interactions - useful later, but not needed for v1.
- Gamification - not suitable for the professional corporate first release.
- Payment plans or subscription management - this is an internal product.
- Advanced cross-event analytics - defer until event-level workflows are validated.
- Excel export - PRD v1.1 defers XLSX to P1; v1 uses CSV.
- Fully automated moderation as the only safeguard - human moderation is the v1 control mechanism.

## Context

The approved documentation set is the source of truth:

- `URS.md` v1.0 approved
- `PRD.md` v1.1 approved
- `SPEC.md` v1.0 approved
- `SRS.md` v1.0 approved

The product was shaped after reviewing Slido's logged-in Q&A and survey surfaces. Slido locks moderation and survey interactions behind paid plan features, so QSB Ask treats moderation and surveys as core capabilities.

The user approved a hybrid deployment model:

- Next.js app hosted through Coolify on QSB VPS.
- Public domain target: `ask.qsbportal.com.my`.
- Managed Supabase for v1 Auth, Postgres, Realtime, and data storage.
- CSV export only for v1.

The QSB VPS operating model requires new long-lived public services to be Coolify-managed and visible in the Coolify dashboard, not deployed through ad hoc Docker Compose folders.

## Constraints

- **Documentation**: Build from approved URS, PRD, SPEC, and SRS only - avoids scope drift.
- **Deployment**: Next.js application must be a Coolify-managed resource on QSB VPS - aligns with VPS governance.
- **Backend**: Managed Supabase is approved for v1 Auth, Postgres, Realtime, and data storage - keeps MVP speed high.
- **Live updates**: Core live views must update within 2 seconds - required by SPEC and PRD.
- **Moderation**: Public views must never show pending, dismissed, or archived questions - primary safety requirement.
- **Export**: v1 export format is CSV only - keeps reporting practical without slowing MVP.
- **Accessibility**: Target WCAG 2.1 AA for core flows - required by SPEC.
- **Audience UX**: Audience screens must be mobile-friendly - participants are expected to use phones.
- **Capacity**: v1 target is 300 participants per active event - approved SRS target.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Moderation is core v1 scope | This is the strongest differentiator versus free Slido usage and the key governance need. | Pending |
| Surveys and chart/data results are v1 scope | Organisers need to show feedback visually during or after events. | Pending |
| Presenter View is v1 scope | Speakers need an approved-question-only screen without moderation controls. | Pending |
| CSV is the only v1 export format | Keeps export simple and testable; Excel moves to P1. | Pending |
| Hybrid deployment through Coolify plus managed Supabase | Matches QSB VPS deployment rules while keeping backend delivery fast. | Pending |
| Supabase custom domain is not required for v1 | Users see the QSB app domain; Supabase default URL stays in configuration. | Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition**:
1. Requirements invalidated? Move to Out of Scope with reason.
2. Requirements validated? Move to Validated with phase reference.
3. New requirements emerged? Add to Active.
4. Decisions to log? Add to Key Decisions.
5. "What This Is" still accurate? Update if drifted.

**After each milestone**:
1. Full review of all sections.
2. Core Value check: still the right priority?
3. Audit Out of Scope: reasons still valid?
4. Update Context with current state.

---
*Last updated: 2026-05-22 after initialization*
