---
phase: 02-live-event-qna-and-moderation
status: approved
created: 2026-05-22
mode: auto
source:
  - .planning/PROJECT.md
  - .planning/REQUIREMENTS.md
  - .planning/ROADMAP.md
  - .planning/phases/01-foundation-auth-and-data/VERIFICATION.md
  - PRD.md
  - SPEC.md
  - SRS.md
---

# Phase 2 Context - Live Event Q&A And Moderation

## Phase Goal

As a QSB event organiser or moderator, I want to collect questions through a join link, review them before they appear publicly, and show approved questions to participants and speakers, so that live event Q&A stays controlled and useful.

## Requirements In Scope

AUTH-05, AUTH-06, AUTH-07, EVNT-04, EVNT-05, EVNT-06, EVNT-07, QNA-01, QNA-02, QNA-03, QNA-04, QNA-05, QNA-06, QNA-07, QNA-08, QNA-09, QNA-10, QNA-11, QNA-12, QNA-13, QNA-14, QNA-15, LIVE-01, LIVE-02, LIVE-03, LIVE-04.

## Locked Decisions

### Reuse Phase 1 Architecture

Phase 2 must extend the existing Next.js App Router structure, protected `(app)` shell, server-action/data-helper pattern, typed Supabase clients, internal Tailwind UI primitives, and Supabase schema. Do not introduce a second auth/session layer, a separate router structure, shadcn, or a new backend framework.

Key Phase 1 contracts to reuse:

- `src/app/(app)/layout.tsx` for authenticated organiser/moderator/speaker shell.
- `src/lib/supabase/server.ts`, `client.ts`, and `admin.ts` for typed Supabase access.
- `src/lib/supabase/rls.ts` role and public question visibility constants.
- `src/lib/events/events.ts` and `src/app/(app)/events/actions.ts` as the event access/action pattern.
- `src/app/(app)/events/[eventId]/page.tsx` as the Phase 2 event workspace entry point.
- `supabase/migrations/202605220101_foundation_schema.sql` as the existing data/RLS foundation.

### Moderation Visibility Is The Core Safety Rule

Pending, dismissed, and archived questions must never appear in participant-facing or presenter-facing views. Public and presenter surfaces may show only `live` and `answered` questions. Staff moderation surfaces may show pending/dismissed/archived questions only to users whose active event role permits moderation.

Implementation guidance:

- Use server-side role checks before rendering organiser, moderator, and speaker routes.
- Use role-specific data helpers instead of a single generic `select questions` helper.
- Presenter View must query only public statuses even though speakers are event members.
- Participant UI must query only public statuses and must never receive pending question payloads through Realtime.
- Keep the existing moderation-off warning pattern when allowing organisers to disable moderation.

### Role Access Rules

Organisers can manage event settings, member access, and moderation controls. Moderators can use moderation tools for assigned events only. Speakers can access Presenter View for assigned events only and must not receive moderation controls or private moderation data.

Phase 2 should add explicit helpers for:

- `assertEventRole(userId, eventId, allowedRoles)`.
- `listEventMembersForOrganiser(eventId)`.
- `inviteEventMember(eventId, email, role)`.
- `removeEventMember(eventId, memberId)`.
- `getPresenterEventAccess(userId, eventId)`.
- `getModeratorEventAccess(userId, eventId)`.

If invite email delivery is not yet available, Phase 2 may create pending member records and document manual account onboarding, but it must not imply that external email invitations are delivered unless implemented and tested.

### Participant Join And Identity

Participants join by code or shared link for active events only. Join must create an event-scoped participant session using `participant_sessions`. Identity rules must follow the event's `identity_mode`:

- `anonymous`: no name or email required.
- `name_required`: display name required.
- `name_email_required`: display name and email required.

Do not trust a client-supplied participant session id by itself. Use a generated session token, store only a hash server-side, and validate the token before accepting question submissions or votes. The browser may keep a participant token in an HTTP-only same-site cookie scoped to the event/join flow.

### Question Submission Rules

When moderation is enabled, submitted questions enter `pending`. When moderation is disabled, submitted questions may become `live` after rate-limit and duplicate checks.

Submission must enforce:

- Active event only.
- Valid participant session for the event.
- Event character limit.
- Event rate limit in seconds.
- Duplicate block when enabled.
- Required identity mode.

Every accepted question should preserve original text. Moderation edits must create `question_versions` rows.

### Moderation Actions

Moderation actions must be server-side operations with actor, action, prior/new status, metadata, and timestamp recorded in `moderation_actions`.

Required actions:

- Approve pending question to live.
- Dismiss question to archived.
- Edit question text while preserving versions.
- Archive question.
- Restore archived question to correct prior state.
- Mark live question answered.
- Search and sort moderation queue by recency, age, and votes.
- Toggle moderation off only after warning confirmation.

Use first-action-wins semantics for moderation state changes. If a question has changed since the moderator loaded it, return a clear stale-state error rather than overwriting silently.

### Audience Q&A And Voting

Participants can see approved live and answered questions only. Participants can sort by Popular or Recent. Participants can upvote a live approved question once per participant session. Use the existing unique vote constraint as the source of truth, and update cached `vote_count` atomically through a database function, trigger, or transaction-safe server path.

### Presenter View

Presenter View is a staff-facing route for organisers, moderators, and speakers. It shows approved questions only, vote counts, and answered status. It must not show moderation controls, edit controls, submit controls, participant identity management, or private pending/dismissed/archived data.

### Realtime

Supabase Realtime may be used for normal-condition updates within 2 seconds. Current Supabase docs indicate Postgres Changes subscriptions check RLS policies for subscribed users. Still, Phase 2 must design subscriptions so unsafe payloads are not subscribed to in the first place:

- Moderator channels may subscribe to moderation-safe event question changes after role verification.
- Participant and presenter channels must subscribe only to public `live`/`answered` rows or to sanitized server-provided payloads.
- Do not rely on client-side filtering to hide pending questions.
- Reconnect failure hardening is Phase 4; Phase 2 only needs normal-condition live updates and basic loading/offline states.

## UX Direction

Use the existing quiet operational UI style. Phase 2 screens are work surfaces, not marketing pages.

Expected screens/routes:

- Event workspace for organisers with tabs or segmented navigation for Q&A, access/settings, and presenter link.
- Event access management for organiser-invited moderator and speaker roles.
- Participant join page and participant Q&A page optimized for mobile 360px width.
- Moderator queue with pending/live/archived/answered filters, search, sort, and clear action buttons.
- Audience Q&A list with submit form, sort, vote, and answered states.
- Presenter View full-screen or near full-screen reading surface without admin chrome.

## Suggested Planning Waves

1. Event workspace, event edit/close/archive, and event member role access.
2. Participant join/session identity and active event access by code/link.
3. Question submission with moderation defaults, rate limiting, duplicate blocking, and visibility-safe public reads.
4. Moderator queue/actions/edit history/moderation audit.
5. Audience Q&A voting/sorting and Presenter View.
6. Normal-condition Realtime subscriptions and integration verification across staff, participant, and presenter surfaces.

## Known Risks

- Current `questions_select_for_event_members` policy allows any active event member to select event questions. Phase 2 must avoid using that broad policy for speaker Presenter View data; server helpers must restrict selected statuses, and a migration may be needed for more granular RLS.
- `participant_sessions` has a session token hash model but no app helper yet. Token generation and cookie scoping are security-critical.
- `vote_count` exists but no trigger/RPC currently maintains it. Phase 2 planning must include atomic vote count maintenance.
- Supabase Realtime filtered subscriptions can still leak if staff-only channels are reused for public views. Plan separate hooks/data helpers by audience.
- Real email invitation delivery is not guaranteed in Phase 2 unless a tested provider/Supabase invite flow is implemented. Pending member records are acceptable if clearly represented in UI.

## Out Of Scope

- Survey creation, results charts, analytics UI, and CSV export are Phase 3.
- Reconnect hardening after prolonged failure is Phase 4.
- Production Coolify deployment and DNS cutover are Phase 4.
- AI features, gamification, downvotes, labels, Excel export, and broad Slido parity extras remain out of v1.
