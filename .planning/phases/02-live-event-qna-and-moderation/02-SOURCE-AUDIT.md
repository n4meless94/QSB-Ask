---
phase: 02-live-event-qna-and-moderation
status: covered
created: 2026-05-22
---

# Phase 2 Source Coverage Audit

SOURCE | ID | Feature/Requirement | Plan | Status | Notes
--- | --- | --- | --- | --- | ---
GOAL | - | Collect questions through a join link, moderate before public display, and show approved questions to participants and speakers | 02-03, 02-04, 02-05, 02-06, 02-07, 02-08 | COVERED | Vertical path from join to submit to moderate to audience/presenter realtime.
REQ | AUTH-05 | Organiser can invite and remove Moderator and Speaker access | 02-01 | COVERED | Pending member records only; no email-delivery claim.
REQ | AUTH-06 | Speaker can access Presenter View for assigned events only | 02-01, 02-07 | COVERED | Access helper plus presenter route gate.
REQ | AUTH-07 | Moderator can access moderation tools for assigned events only | 02-01, 02-05 | COVERED | Access helper plus moderation route/action gate.
REQ | EVNT-04 | Organiser can edit event settings from Event Workspace | 02-02 | COVERED | Settings action and UI.
REQ | EVNT-05 | Organiser can close/archive event while preserving records | 02-02 | COVERED | Status changes, no deletes.
REQ | EVNT-06 | Participant can join active event by code/link | 02-03 | COVERED | Join page/action/session cookie.
REQ | EVNT-07 | Identity mode supports anonymous, name, name+email | 02-03 | COVERED | Join validation per event identity mode.
REQ | QNA-01 | Participant can submit question to active event | 02-04 | COVERED | Session-validated submit path.
REQ | QNA-02 | Submitted questions enter Pending when moderation enabled | 02-04 | COVERED | Submission helper chooses status from event setting.
REQ | QNA-03 | Public/presenter views never show Pending/dismissed/Archived | 02-04, 02-07, 02-08 | COVERED | Public-status helpers and safe realtime refresh.
REQ | QNA-04 | Moderator approves Pending to Live | 02-05 | COVERED | First-action-wins moderation action.
REQ | QNA-05 | Moderator dismisses to Archived | 02-05 | COVERED | Audit action plus archived status.
REQ | QNA-06 | Moderator edits text with version history | 02-05 | COVERED | Version insert and edited marker.
REQ | QNA-07 | Moderator archives/restores to prior state | 02-05 | COVERED | previous_status restore.
REQ | QNA-08 | Moderator marks Live as Answered | 02-05 | COVERED | Moderation action.
REQ | QNA-09 | Moderator searches and sorts by recency, age, votes | 02-05 | COVERED | Queue data helper and UI controls.
REQ | QNA-10 | Participant upvotes approved Live question once per session | 02-06 | COVERED | Unique constraint plus server token validation.
REQ | QNA-11 | Participant sorts approved questions by Popular/Recent | 02-06 | COVERED | Audience list controls use public helper.
REQ | QNA-12 | Moderator can turn moderation off only after warning | 02-02 | COVERED | Existing warning pattern retained in settings.
REQ | QNA-13 | Rate-limit participant submissions | 02-04 | COVERED | Event setting enforced before insert.
REQ | QNA-14 | Duplicate question block | 02-04 | COVERED | Normalized per-session duplicate check.
REQ | QNA-15 | Moderation actions record actor/action/status/metadata/time | 02-05 | COVERED | moderation_actions writes.
REQ | LIVE-01 | Moderation pending count/state updates within 2 seconds | 02-08 | COVERED | Staff realtime hook and E2E timing test.
REQ | LIVE-02 | Audience approved questions/votes/answered update within 2 seconds | 02-08 | COVERED | Public realtime hook refetches safe list.
REQ | LIVE-03 | Presenter shows approved questions/votes/status without controls | 02-07 | COVERED | Presenter-only route and component.
REQ | LIVE-04 | Presenter approved questions/votes/status update within 2 seconds | 02-08 | COVERED | Presenter realtime hook and E2E timing test.
RESEARCH | R-01 | Reuse Next.js App Router, server actions/helpers, typed Supabase clients | 02-01 to 02-08 | COVERED | All plans extend existing files/patterns.
RESEARCH | R-02 | Implement role-specific server helpers instead of generic question helper | 02-01, 02-04, 02-05, 02-07 | COVERED | Separate access/public/moderation/presenter helpers.
RESEARCH | R-03 | Validate participant raw token; never trust session id alone | 02-03, 02-04, 02-06 | COVERED | Token hash helper and HTTP-only cookie.
RESEARCH | R-04 | Use transaction-safe path for submission, moderation, and voting | 02-04, 02-05, 02-06 | COVERED | Migration/RPC or atomic server path planned.
RESEARCH | R-05 | Add vote_count maintenance and realtime publication entries | 02-06, 02-08 | COVERED | Vote trigger/function and realtime migration.
RESEARCH | R-06 | Pending member records acceptable without email delivery | 02-01 | COVERED | UI copy says manual onboarding.
RESEARCH | R-07 | Reconnect failure hardening is out of scope | 02-08 | COVERED | Basic normal-condition states only.
CONTEXT | D-01 | Reuse Phase 1 architecture | 02-01 to 02-08 | COVERED | No new auth layer, router framework, shadcn, or backend.
CONTEXT | D-02 | Moderation visibility is core safety rule | 02-04, 02-05, 02-07, 02-08 | COVERED | Public/presenter live/answered only.
CONTEXT | D-03 | Role access rules and explicit helpers | 02-01, 02-05, 02-07 | COVERED | Required helper names included.
CONTEXT | D-04 | Participant join and identity with token hash | 02-03 | COVERED | Event-scoped secure session.
CONTEXT | D-05 | Question submission rules | 02-04 | COVERED | Active event, valid session, limits, duplicates, default status.
CONTEXT | D-06 | Moderation actions with audit and first-action-wins | 02-05 | COVERED | Compare-and-set actions and audit rows.
CONTEXT | D-07 | Audience voting/sorting | 02-06 | COVERED | Unique vote and public list sorting.
CONTEXT | D-08 | Presenter View approved-only | 02-07 | COVERED | No moderation controls or private statuses.
CONTEXT | D-09 | Normal-condition realtime without unsafe subscriptions | 02-08 | COVERED | Separate channels; sanitized refetch.

No deferred ideas from Phase 2 context are planned. Phase 3 survey/export and Phase 4 deployment/reconnect hardening are excluded.
