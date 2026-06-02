# QSB Ask

## What This Is

QSB Ask is a Slido-style live Q&A and survey web application for QSB internal events, briefings, training sessions, and invited stakeholder sessions. It helps organisers collect questions and survey responses while keeping public participation controlled, moderated, and suitable for corporate use.

Version 1 focuses on moderated live Q&A, presenter view, practical surveys, live survey chart/data views, CSV export, access roles, and hybrid deployment through QSB VPS/Coolify with managed Supabase backend services. Version 1.1 adds an integrated PDF-first slide presenter so organisers can present uploaded decks from QSB Ask with floating QR and moderator-controlled approved-question overlays.

## Core Value

No unapproved, sensitive, inappropriate, or confidential question should appear publicly before the organiser or moderator has control over it.

## Current Milestone: v1.1 Integrated Slide Presenter

**Goal:** Let QSB presenters run static PDF slide decks directly inside QSB Ask while showing a floating join QR and selected approved questions over the slides.

**Target features:**
- PDF deck upload and event-scoped slide storage.
- Browser-based fullscreen slide presenter with keyboard navigation.
- Draggable/resizable QR overlay with saved layout.
- Moderator-controlled "Show on screen" question overlay, separate from normal approval.
- Presenter-safe overlay display that never exposes pending or archived questions.

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
- [ ] Organisers can upload a PDF slide deck for an event and present it from QSB Ask.
- [ ] Presenters can navigate slides in fullscreen while a configurable QR overlay floats above the deck.
- [ ] Moderators can choose which already-approved question is shown on screen, hide it, and mark it answered.
- [ ] Question overlays are presentation-safe: pending, archived, and unapproved questions never appear on slides.

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
- Native PowerPoint, Canva, or PDF-app overlays - v1.1 presents uploaded PDF decks inside QSB Ask instead of drawing over external apps.
- Direct Canva import or live Canva editing - presenters should export Canva decks to PDF for this milestone.
- PowerPoint `.pptx` conversion - defer until the PDF-first workflow is validated because server conversion can introduce font and layout risk.
- Slide animations, embedded video, and presenter notes - static PDF slides are the first reliable milestone scope.

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

The user chose the integrated web presenter approach for v1.1 instead of an Electron/Tauri desktop overlay. The milestone is PDF-first: PowerPoint and Canva decks should be exported to PDF before upload, then presented from QSB Ask so QR and question overlays can be rendered with normal web UI.

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
- **Slide format**: v1.1 accepts PDF decks only - avoids unreliable native PowerPoint/Canva conversion in the first presenter milestone.
- **Presentation control**: Showing a question on the slide is a separate moderator action from approving it - prevents surprise interruptions during formal briefings.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Moderation is core v1 scope | This is the strongest differentiator versus free Slido usage and the key governance need. | Pending |
| Surveys and chart/data results are v1 scope | Organisers need to show feedback visually during or after events. | Pending |
| Presenter View is v1 scope | Speakers need an approved-question-only screen without moderation controls. | Pending |
| CSV is the only v1 export format | Keeps export simple and testable; Excel moves to P1. | Pending |
| Hybrid deployment through Coolify plus managed Supabase | Matches QSB VPS deployment rules while keeping backend delivery fast. | Pending |
| Supabase custom domain is not required for v1 | Users see the QSB app domain; Supabase default URL stays in configuration. | Pending |
| v1.1 uses an integrated PDF presenter instead of desktop overlay | Web-native overlays are simpler to deploy and test than always-on-top OS windows. | Pending |
| PDF is the only accepted deck format for v1.1 | PowerPoint and Canva can export PDF; direct `.pptx`/Canva support adds conversion and layout risk. | Pending |
| Approved and shown-on-screen are separate states | Moderators need public approval without forcing every approved question onto the slide. | Pending |

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
*Last updated: 2026-06-02 after starting milestone v1.1 Integrated Slide Presenter*
