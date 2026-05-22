# QSB Ask - Product Requirements Document

Version: 1.1
Date: 22 May 2026
Status: Approved
Source: Approved URS v1.0
Changes from v1.0: Promoted Presenter View, Survey result sharing toggle, and Basic access roles from P1 to P0 to match SPEC v0.2. Added related user stories. Updated milestones.

## 1. Overview & Goals

QSB Ask is a live Q&A and survey product for professional events, meetings, briefings, training sessions, and stakeholder engagements.

The product will provide the essential audience interaction features of tools like Slido, with a stronger focus on moderation, governance, and controlled participation. The first version will prioritise live Q&A, human moderation, simple surveys, visual survey results, and exportable records.

### Product Goals

- Enable organisers to run live Q&A sessions with moderation enabled by default.
- Allow participants to submit questions and respond to surveys with minimal friction.
- Ensure public question visibility is controlled by a moderator.
- Provide speakers with a clean view of approved and relevant questions.
- Provide survey chart and data views that can be shown during or after an event.
- Preserve useful records for reporting, accountability, and follow-up.

### Product Principles

- Moderation is a core feature, not a premium add-on.
- Audience participation should be simple and mobile-friendly.
- Organiser and moderator workflows should be fast enough for live sessions.
- The product should feel professional, controlled, and suitable for corporate use.
- The first version should focus on the highest-value workflows rather than copying every feature from existing tools.

## 2. Target Personas

### Event Organiser

Creates and manages events. Needs confidence that audience participation will remain relevant, professional, and controlled.

### Moderator

Reviews questions during a live session. Needs to approve, dismiss, edit, archive, and mark questions as answered quickly.

### Presenter or Speaker

Answers questions during the session. Needs a clean list of approved questions without seeing unreviewed submissions.

### Audience Participant

Joins an event through a simple code or link. Needs to submit questions, vote on questions, and answer surveys easily from mobile or desktop.

### Administrator

Oversees use of the product. Needs access control, reliable records, and exportable information.

## 3. User Stories

### Event Setup

- As an event organiser, I want to create an event so that participants can join a dedicated Q&A and survey space.
- As an event organiser, I want to share a short event code or link so that participants can join easily.
- As an event organiser, I want moderation to be enabled by default so that questions are reviewed before becoming public.

### Audience Q&A

- As an audience participant, I want to submit a question so that it can be considered during the session.
- As an audience participant, I want to submit anonymously by default so that I can ask questions comfortably.
- As an audience participant, I want to upvote approved questions so that important questions can rise in priority.
- As an audience participant, I want to see approved questions sorted by popular or recent so that I can follow the discussion.

### Moderation

- As a moderator, I want incoming questions to appear in a pending queue so that I can review them before public display.
- As a moderator, I want to approve a question so that it becomes visible to the audience and speaker.
- As a moderator, I want to dismiss a question so that unsuitable content does not appear publicly.
- As a moderator, I want to edit a question so that minor wording issues can be corrected before approval.
- As a moderator, I want to archive a question so that it is removed from the active discussion without losing the record.
- As a moderator, I want to restore an archived question so that mistakes can be corrected.
- As a moderator, I want to mark a question as answered so that the session can move forward clearly.
- As a moderator, I want to search and filter questions so that I can manage a busy session.

### Speaker View

- As a speaker, I want a dedicated screen showing approved questions only so that I can focus on suitable questions without seeing moderation tools.
- As a speaker, I want to see question status and vote count so that I can prioritise what to answer.
- As a speaker, I want the approved question list to update live so that I see new questions and vote changes during the session.

### Access And Roles

- As an organiser, I want to invite people to my event as Moderator or Speaker so that the right people have the right access.
- As an organiser, I want to remove a person's access so that I can correct mistakes or revoke access when someone leaves the team.

### Surveys

- As an event organiser, I want to create a survey with multiple questions so that I can collect structured feedback.
- As an event organiser, I want to use multiple choice, multiple select, rating, and open text questions so that I can collect different types of responses.
- As an audience participant, I want to answer surveys easily on mobile so that I can respond during the session.
- As an event organiser, I want to show survey results as charts or data views so that the audience and stakeholders can understand the results quickly.
- As an event organiser, I want to choose whether participants see survey results so that sensitive feedback stays controlled.
- As an event organiser, I want to export survey results so that they can be used for reporting and follow-up.

### Records And Accountability

- As an administrator, I want records of questions, survey responses, and moderation decisions so that event activity can be reviewed later.
- As an organiser, I want to export event data so that I can prepare summaries, reports, or follow-up actions.

## 4. Functional Requirements

### P0 - Must Have For Version 1

| ID | Requirement | Description |
|---|---|---|
| P0-01 | Event creation | Organisers can create an event with a name, date, and join access. |
| P0-02 | Join code or link | Participants can join an event using a simple code or shared link. |
| P0-03 | Audience question submission | Participants can submit questions during an active event. |
| P0-04 | Anonymous by default | Questions are anonymous by default unless the organiser chooses otherwise. |
| P0-05 | Moderation enabled by default | Submitted questions enter a pending queue before public visibility. |
| P0-06 | Pending queue | Moderators can view incoming questions awaiting review. |
| P0-07 | Approve question | Moderators can approve a pending question and make it public. |
| P0-08 | Dismiss question | Moderators can dismiss unsuitable questions so they do not appear publicly. |
| P0-09 | Edit question | Moderators can edit question wording before or after approval. |
| P0-10 | Archive and restore | Moderators can archive questions and restore them when needed. |
| P0-11 | Mark answered | Moderators can mark approved questions as answered. |
| P0-12 | Public question list | Participants can see approved questions only. |
| P0-13 | Upvotes | Participants can upvote approved questions. |
| P0-14 | Sort questions | Participants and moderators can sort questions by popular or recent. |
| P0-15 | Search questions | Moderators can search questions. |
| P0-16 | Survey creation | Organisers can create surveys with multiple questions. |
| P0-17 | Survey question types | Surveys support multiple choice, multiple select, rating, and open text questions. |
| P0-18 | Survey response collection | Participants can respond to active surveys. |
| P0-19 | Survey chart view | Organisers can show survey results through clear charts or data views. |
| P0-20 | Survey response count | Organisers can see response counts for each survey and question. |
| P0-21 | Export results | Organisers can export questions, moderation records, and survey responses as CSV. |
| P0-22 | Basic event records | The product keeps records of questions, survey responses, and moderation decisions. |
| P0-23 | Presenter view | Speakers have a dedicated screen showing approved questions, votes, and status. No moderation controls. |
| P0-24 | Survey result visibility toggle | Organisers can choose per survey whether participants see results. Hidden from participants by default. |
| P0-25 | Basic access roles | Events distinguish Organiser, Moderator, and Speaker access. Organisers can invite and remove people. |
| P0-26 | Live updates | Audience, moderator, presenter, and presentation screens update within 2 seconds of any change. |
| P0-27 | Moderation toggle with warning | Moderation is on by default. Organisers can turn it off after confirming a warning. |
| P0-28 | Event settings workspace | Organisers can edit event details, manage access, set question rules, and close events from one place. |

### P1 - Should Have After Version 1

| ID | Requirement | Description |
|---|---|---|
| P1-01 | Question labels | Moderators can categorise questions using labels. |
| P1-02 | Downvotes | Organisers can allow participants to downvote questions. |
| P1-03 | Highlight question for audience | Moderators can highlight the question currently being answered, visible to the audience. |
| P1-04 | Required survey questions | Organisers can mark survey questions as required. |
| P1-05 | Excel export format | Add .xlsx export alongside CSV. |
| P1-06 | Administrator role | Add a cross-event Administrator role distinct from per-event Organiser. |
| P1-07 | Offline moderation queue | Moderator actions taken offline are queued and reconciled on reconnect. |

### P2 - Could Have Later

| ID | Requirement | Description |
|---|---|---|
| P2-01 | Automated profanity warning | The product can flag possibly inappropriate questions for human review. |
| P2-02 | Advanced branding | Organisers can customise event branding and visual presentation. |
| P2-03 | Advanced analytics | Organisers can view trends across events and compare engagement over time. |
| P2-04 | Templates | Organisers can reuse survey and event templates. |
| P2-05 | AI-assisted survey creation | Organisers can generate draft survey questions from an objective. |

## 5. Non-Functional Requirements

- The audience experience must work well on mobile devices.
- The moderator experience must be fast enough for live use.
- Approved and pending questions must be clearly separated.
- Public views must never show unapproved questions.
- Survey chart views must be clear enough to present during a live session.
- The product must retain event records for later review.
- The product must be suitable for professional and corporate use.
- The product must avoid unnecessary complexity in the first version.

## 6. Out Of Scope

The following are out of scope for Version 1:

- Full Slido feature parity.
- Quizzes.
- Word clouds.
- Idea boards.
- AI-generated interaction creation.
- Gamification.
- Complex event branding or theme builders.
- Advanced cross-event analytics.
- Fully automated moderation as the only safeguard.
- Payment plans or subscription management.

## 7. Success Metrics

### Product Adoption

- Number of events created.
- Number of active events run successfully.
- Number of participants per event.
- Number of questions submitted per event.
- Number of survey responses collected per event.

### Moderation Effectiveness

- Percentage of submitted questions reviewed.
- Average time from question submission to moderator decision.
- Number of dismissed or archived questions.
- Number of unapproved questions shown publicly: target is zero.

### Survey Usefulness

- Survey completion rate.
- Number of survey results viewed through chart or data views.
- Number of exports generated after events.

### User Experience

- Participant completion without support.
- Moderator ability to manage live questions without disrupting the session.
- Organiser satisfaction after event completion.

## 8. Risks & Assumptions

### Risks

- Moderators may be overwhelmed if too many questions arrive at once.
- Participants may expect questions to appear immediately even when moderation is enabled.
- Anonymous questions may increase unsuitable submissions if controls are weak.
- Survey chart views may become hard to read if results are too dense.
- Organisers may request broad Slido-like features before the core product is stable.

### Assumptions

- The primary audience is QSB internal users and invited participants.
- Moderation is required by default for professional and governance reasons.
- Anonymous questions are acceptable by default, with optional identification for selected events.
- Version 1 focuses on live Q&A, surveys, chart/data result views, moderation, and export.
- Human moderation is the main safeguard in Version 1.
- The initial product does not need full external commercial SaaS features.

## 9. Roadmap / Milestones

The roadmap assumes AI-assisted development with Codex. Timeline should be managed by verified completion of each milestone, not by a traditional multi-person delivery schedule.

### Milestone 1 - Product Definition

- Approve URS.
- Approve PRD.
- Define screen-by-screen behaviour in the SPEC.
- Define the technical stack and system requirements in the SRS.

Target: 1 focused planning session after PRD approval.

### Milestone 2 - Core Event And Q&A

- Email/password authentication with account lockout and password reset.
- Create and manage events.
- Event settings workspace (details, access roles, question rules, close event).
- Invite Moderators and Speakers to an event.
- Join event using code or link.
- Submit audience questions with character limit and rate limit.
- Review questions in moderation queue with live updates.
- Approve, dismiss, edit (with version history), archive, restore, and mark as answered.
- Show approved questions to participants and to speakers via the Presenter View.
- Live updates across audience, moderator, and presenter screens within 2 seconds.

Target: 2-3 focused Codex build sessions after SPEC and SRS approval.

### Milestone 3 - Surveys And Results

- Create surveys with supported question types.
- Collect survey responses.
- Show response counts and chart/data result views.
- Survey result visibility toggle (per survey).
- Presentation View for projecting survey charts.
- Export survey results as CSV.

Target: 1-2 focused Codex build sessions after core Q&A is verified.

### Milestone 4 - Records, Polish, And UAT

- Export questions, moderation history, and survey responses as CSV.
- Review moderation records and edit history.
- Accessibility checks against WCAG 2.1 AA.
- Improve live-session usability.
- Complete user acceptance testing.

Target: 1 focused Codex verification and polish session, plus user-run UAT.

## Resolved Decisions

The following items were open in v1.0 and have been resolved through SPEC v0.2:

- Participant identity options are Anonymous, Name only, and Name + email (configurable per event).
- Survey result visibility is configurable per survey, hidden from participants by default.
- Export format for V1 is CSV only. Excel (.xlsx) moves to P1.
- Moderation is on by default but can be turned off with a confirmation warning.
- Login uses email/password in V1. SSO is deferred.

## Open Items

The following items still need confirmation:

1. Who are the final named stakeholders for approval and sign-off?
2. Should Version 1 be delivered as the fastest verified MVP, with scope reduced if needed to keep the build moving?
