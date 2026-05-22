# Roadmap: QSB Ask

**Created:** 2026-05-22  
**Mode:** Vertical MVP  
**Source:** `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, approved URS/PRD/SPEC/SRS

## Overview

QSB Ask will be delivered in four vertical MVP phases. Each phase leaves the product in a more usable state while preserving the approved scope: moderated Q&A first, then surveys/results/export, then deployment and launch readiness.

| Phase | Name | Goal | Requirements |
|-------|------|------|--------------|
| 1 | Foundation, Auth, And Data | Establish the app shell, local development, authentication baseline, event dashboard, and Supabase data/security foundation. | AUTH-01 to AUTH-04, EVNT-01 to EVNT-03, DEPL-01, DEPL-05 |
| 2 | Live Event Q&A And Moderation | Deliver the core moderated Q&A experience across organiser, moderator, audience, and presenter views. | AUTH-05 to AUTH-07, EVNT-04 to EVNT-07, QNA-01 to QNA-15, LIVE-01 to LIVE-04 |
| 3 | Surveys, Results, Presentation, And CSV | Deliver survey creation, participant responses, chart/data analytics UI, presentation view, and CSV exports. | LIVE-05, SURV-01 to SURV-13, EXPT-01 to EXPT-05 |
| 4 | Hardening, Deployment, And UAT | Prepare production deployment through Coolify, verify live behaviour, handle reconnect states, and complete UAT readiness. | LIVE-06, DEPL-02 to DEPL-04 |

## Phase Details

### Phase 1: Foundation, Auth, And Data

**Goal:** Create the working Next.js/Supabase foundation that supports authenticated organiser workflows and the initial event dashboard.
**Mode:** mvp

**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, EVNT-01, EVNT-02, EVNT-03, DEPL-01, DEPL-05

**Success Criteria:**
1. A developer can run the app locally with documented environment variables.
2. A signed-in user can log in, reset password, and reach the Event Dashboard.
3. Account lockout and inactivity timeout behaviour are implemented or explicitly guarded.
4. An organiser can create an event and see it in the dashboard with join code/link.
5. Supabase schema and Row Level Security foundations exist for users, events, memberships, participant sessions, questions, surveys, and audit records.

**UI hint:** yes

### Phase 2: Live Event Q&A And Moderation

**Goal:** Deliver the main product value: moderated live Q&A where only approved questions are visible to participants and speakers.
**Mode:** mvp

**Requirements:** AUTH-05, AUTH-06, AUTH-07, EVNT-04, EVNT-05, EVNT-06, EVNT-07, QNA-01, QNA-02, QNA-03, QNA-04, QNA-05, QNA-06, QNA-07, QNA-08, QNA-09, QNA-10, QNA-11, QNA-12, QNA-13, QNA-14, QNA-15, LIVE-01, LIVE-02, LIVE-03, LIVE-04

**Success Criteria:**
1. Participants can join an active event by code/link and submit questions according to identity rules.
2. Pending questions never appear in audience or presenter views before approval.
3. Moderators can approve, dismiss, edit with version history, archive, restore, mark answered, search, and sort.
4. Participants can view, sort, and upvote approved live questions once per session.
5. Presenter View shows approved questions only, with votes and status, and no moderation controls.
6. Q&A state, vote counts, and presenter view updates appear within 2 seconds in normal conditions.

**UI hint:** yes

### Phase 3: Surveys, Results, Presentation, And CSV

**Goal:** Add the survey workflow and reporting surfaces needed for live feedback collection, chart presentation, and CSV export.
**Mode:** mvp

**Requirements:** LIVE-05, SURV-01, SURV-02, SURV-03, SURV-04, SURV-05, SURV-06, SURV-07, SURV-08, SURV-09, SURV-10, SURV-11, SURV-12, SURV-13, EXPT-01, EXPT-02, EXPT-03, EXPT-04, EXPT-05

**Success Criteria:**
1. Organisers can create, publish, close, and configure result visibility for surveys.
2. Participants can submit one response per survey session.
3. Organisers can view response counts, chart results, and open text data views.
4. Presentation View shows survey charts without admin controls and updates within 2 seconds.
5. CSV exports are available for questions, moderation history, and survey responses.
6. Empty export and zero-response chart states are handled clearly.

**UI hint:** yes

### Phase 4: Hardening, Deployment, And UAT

**Goal:** Prepare QSB Ask for controlled pilot use through Coolify deployment, health checks, reconnect handling, accessibility checks, and UAT readiness.
**Mode:** mvp

**Requirements:** LIVE-06, DEPL-02, DEPL-03, DEPL-04

**Success Criteria:**
1. Live views show reconnect state and prompt refresh after prolonged reconnection failure.
2. The app exposes a health route suitable for Coolify verification.
3. The app is configured for Coolify-managed deployment on QSB VPS.
4. The production domain plan for `https://ask.qsbportal.com.my` is ready for DNS/Coolify cutover.
5. Core flows pass accessibility, mobile, and live-session smoke checks.
6. UAT scenarios can be generated from PRD/SPEC and run by the user.

**UI hint:** yes

## Coverage

- v1 requirements: 59 total
- Requirements mapped: 59
- Unmapped requirements: 0

## Next Step

Run `$gsd-discuss-phase 1 --auto` or `$gsd-plan-phase 1` to begin implementation planning.

---
*Roadmap created: 2026-05-22*
