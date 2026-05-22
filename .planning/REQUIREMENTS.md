# Requirements: QSB Ask

**Defined:** 2026-05-22  
**Core Value:** No unapproved, sensitive, inappropriate, or confidential question should appear publicly before the organiser or moderator has control over it.

## v1 Requirements

### Authentication And Access

- [x] **AUTH-01**: Signed-in user can log in with email and password.
- [x] **AUTH-02**: Signed-in user can request and complete password reset by email link.
- [x] **AUTH-03**: Signed-in user session expires after 8 hours of inactivity.
- [x] **AUTH-04**: System locks an account for 30 minutes after five failed sign-in attempts within 15 minutes.
- [ ] **AUTH-05**: Organiser can invite and remove Moderator and Speaker access for an event.
- [ ] **AUTH-06**: Speaker can access Presenter View for assigned events only.
- [ ] **AUTH-07**: Moderator can access moderation tools for assigned events only.

### Events

- [x] **EVNT-01**: Organiser can create an event with name, date, time zone, status, participant identity mode, and moderation setting.
- [x] **EVNT-02**: Organiser can open an Event Dashboard listing accessible events with name, date, status, and join code.
- [x] **EVNT-03**: Organiser can copy a join code or link for an event.
- [ ] **EVNT-04**: Organiser can edit event settings from the Event Workspace.
- [ ] **EVNT-05**: Organiser can close and archive an event while preserving records.
- [ ] **EVNT-06**: Participant can join an active event by code or shared link.
- [ ] **EVNT-07**: Participant identity mode supports Anonymous, Name required, and Name plus email required.

### Moderated Q&A

- [ ] **QNA-01**: Participant can submit a question to an active event.
- [ ] **QNA-02**: Submitted questions enter Pending when moderation is enabled.
- [ ] **QNA-03**: Participant-visible and speaker-visible views never show Pending, dismissed, or Archived questions.
- [ ] **QNA-04**: Moderator can approve a Pending question and move it to Live.
- [ ] **QNA-05**: Moderator can dismiss a question and move it to Archived.
- [ ] **QNA-06**: Moderator can edit question text while preserving original and edited versions.
- [ ] **QNA-07**: Moderator can archive and restore questions to the correct prior state.
- [ ] **QNA-08**: Moderator can mark a Live question as Answered.
- [ ] **QNA-09**: Moderator can search question text and sort questions by recency, age, or votes.
- [ ] **QNA-10**: Participant can upvote an approved Live question once per session.
- [ ] **QNA-11**: Participant can sort approved questions by Popular or Recent.
- [ ] **QNA-12**: Moderator can turn moderation off only after confirming a warning.
- [ ] **QNA-13**: System rate-limits participant question submissions according to event settings.
- [ ] **QNA-14**: System blocks duplicate participant question submissions when duplicate block is enabled.
- [ ] **QNA-15**: System records moderation actions with actor, action, status change, metadata, and timestamp.

### Live Views

- [ ] **LIVE-01**: Q&A Moderation updates Pending count and question state changes within 2 seconds.
- [ ] **LIVE-02**: Audience Q&A updates approved questions, vote counts, and answered status within 2 seconds.
- [ ] **LIVE-03**: Presenter View shows approved questions, vote counts, and status without moderation controls.
- [ ] **LIVE-04**: Presenter View updates approved questions, vote changes, and status changes within 2 seconds.
- [ ] **LIVE-05**: Presentation View shows survey charts without admin controls and updates results within 2 seconds.
- [ ] **LIVE-06**: Live views show reconnect state and prompt refresh after prolonged reconnection failure.

### Surveys And Results

- [ ] **SURV-01**: Organiser can create a survey with a title and draft/published/closed status.
- [ ] **SURV-02**: Organiser can add multiple choice survey questions with at least two options.
- [ ] **SURV-03**: Organiser can add multiple select survey questions with at least two options.
- [ ] **SURV-04**: Organiser can add rating survey questions with 1-5 or 1-10 scale.
- [ ] **SURV-05**: Organiser can add open text survey questions.
- [ ] **SURV-06**: Organiser can publish and close a valid survey.
- [ ] **SURV-07**: Organiser can set survey result visibility per survey, hidden from participants by default.
- [ ] **SURV-08**: Participant can submit one response per survey session.
- [ ] **SURV-09**: Participant sees survey results only when organiser enabled participant visibility.
- [ ] **SURV-10**: Organiser can view response counts for each survey and question.
- [ ] **SURV-11**: Organiser can view chart results for choice and rating questions.
- [ ] **SURV-12**: Organiser can view open text responses in a readable data view.
- [ ] **SURV-13**: Charts include readable labels, values, and accessible data table alternatives.

### Export And Records

- [ ] **EXPT-01**: Organiser can export questions and question versions as CSV.
- [ ] **EXPT-02**: Organiser can export moderation action history as CSV.
- [ ] **EXPT-03**: Organiser can export survey responses as CSV.
- [ ] **EXPT-04**: Exports include anonymous participants as Anonymous with a per-session audit identifier.
- [ ] **EXPT-05**: Export with no records shows an empty-state message instead of downloading an empty file.

### Deployment And Operations

- [x] **DEPL-01**: Application runs locally with documented environment variables.
- [ ] **DEPL-02**: Application exposes a health route suitable for Coolify verification.
- [ ] **DEPL-03**: Application deploys as a Coolify-managed Next.js resource on QSB VPS.
- [ ] **DEPL-04**: Production public URL is prepared for `https://ask.qsbportal.com.my`.
- [x] **DEPL-05**: Supabase Row Level Security policies enforce role and visibility rules at the database layer.

## v2 Requirements

### Q&A Enhancements

- **QNA2-01**: Moderator can categorise questions with labels.
- **QNA2-02**: Organiser can enable participant downvotes.
- **QNA2-03**: Moderator can highlight the currently answered question for the audience.

### Survey And Export Enhancements

- **SURV2-01**: Organiser can mark survey questions as required.
- **EXPT2-01**: Organiser can export Excel `.xlsx` files.

### Administration And Resilience

- **AUTH2-01**: Administrator role can manage settings across events.
- **LIVE2-01**: Moderator actions taken offline are queued and reconciled on reconnect.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full Slido feature parity | v1 focuses on controlled Q&A and surveys. |
| Quizzes | Not central to the approved v1 scope. |
| Word clouds | Engagement extra, not required for moderated Q&A. |
| Idea boards | Different collaboration model and broader scope. |
| AI-generated interactions | Useful later but not needed for v1. |
| Gamification | Not aligned with professional corporate first release. |
| Payment plans or subscription management | Internal QSB product. |
| Advanced cross-event analytics | Defer until event-level workflows are validated. |
| Fully automated moderation | Human moderation remains the v1 safeguard. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| AUTH-05 | Phase 2 | Pending |
| AUTH-06 | Phase 2 | Pending |
| AUTH-07 | Phase 2 | Pending |
| EVNT-01 | Phase 1 | Complete |
| EVNT-02 | Phase 1 | Complete |
| EVNT-03 | Phase 1 | Complete |
| EVNT-04 | Phase 2 | Pending |
| EVNT-05 | Phase 2 | Pending |
| EVNT-06 | Phase 2 | Pending |
| EVNT-07 | Phase 2 | Pending |
| QNA-01 | Phase 2 | Pending |
| QNA-02 | Phase 2 | Pending |
| QNA-03 | Phase 2 | Pending |
| QNA-04 | Phase 2 | Pending |
| QNA-05 | Phase 2 | Pending |
| QNA-06 | Phase 2 | Pending |
| QNA-07 | Phase 2 | Pending |
| QNA-08 | Phase 2 | Pending |
| QNA-09 | Phase 2 | Pending |
| QNA-10 | Phase 2 | Pending |
| QNA-11 | Phase 2 | Pending |
| QNA-12 | Phase 2 | Pending |
| QNA-13 | Phase 2 | Pending |
| QNA-14 | Phase 2 | Pending |
| QNA-15 | Phase 2 | Pending |
| LIVE-01 | Phase 2 | Pending |
| LIVE-02 | Phase 2 | Pending |
| LIVE-03 | Phase 2 | Pending |
| LIVE-04 | Phase 2 | Pending |
| LIVE-05 | Phase 3 | Pending |
| LIVE-06 | Phase 4 | Pending |
| SURV-01 | Phase 3 | Pending |
| SURV-02 | Phase 3 | Pending |
| SURV-03 | Phase 3 | Pending |
| SURV-04 | Phase 3 | Pending |
| SURV-05 | Phase 3 | Pending |
| SURV-06 | Phase 3 | Pending |
| SURV-07 | Phase 3 | Pending |
| SURV-08 | Phase 3 | Pending |
| SURV-09 | Phase 3 | Pending |
| SURV-10 | Phase 3 | Pending |
| SURV-11 | Phase 3 | Pending |
| SURV-12 | Phase 3 | Pending |
| SURV-13 | Phase 3 | Pending |
| EXPT-01 | Phase 3 | Pending |
| EXPT-02 | Phase 3 | Pending |
| EXPT-03 | Phase 3 | Pending |
| EXPT-04 | Phase 3 | Pending |
| EXPT-05 | Phase 3 | Pending |
| DEPL-01 | Phase 1 | Complete |
| DEPL-02 | Phase 4 | Pending |
| DEPL-03 | Phase 4 | Pending |
| DEPL-04 | Phase 4 | Pending |
| DEPL-05 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 59 total
- Mapped to phases: 59
- Unmapped: 0

---
*Requirements defined: 2026-05-22*
*Last updated: 2026-05-22 after roadmap creation*
