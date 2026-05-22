---
phase: 2
slug: live-event-qna-and-moderation
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-22
---

# Phase 2 - UI Design Contract

Visual and interaction contract for QSB Ask Phase 2: Event Workspace, access/member management, participant join, participant Q&A submit/list/vote, moderator queue/actions/edit/history/search/sort, Audience Q&A, Presenter View, and normal-condition live/realtime states.

Phase 2 must continue the Phase 1 operational corporate UI. It must not use shadcn, marketing hero sections, decorative gradients/orbs, nested cards, or broad visual redesign.

---

## Source Decisions

| Source | Decisions Used |
|--------|----------------|
| `.planning/phases/02-live-event-qna-and-moderation/02-CONTEXT.md` | Phase 2 scope, locked architecture, role access, participant sessions, moderation actions, public visibility safety, realtime constraints, and UX direction. |
| `.planning/phases/01-foundation-auth-and-data/01-UI-SPEC.md` | Manual Tailwind design system, 6px radius, typography, spacing, color palette, copy tone, component contracts, and visual quality rules. |
| `.planning/phases/01-foundation-auth-and-data/VERIFICATION.md` | Phase 1 UI and shell implementation passed; Event Dashboard, Create Event, shell, copy action, and mobile overflow were verified. |
| `.planning/REQUIREMENTS.md` | AUTH-05 to AUTH-07, EVNT-04 to EVNT-07, QNA-01 to QNA-15, LIVE-01 to LIVE-04 define Phase 2 success states. |
| `URS.md` | Moderation is the core product need; professional corporate use; speakers see approved questions only; audience use must be simple. |
| `PRD.md` | P0 requirements for event workspace, access roles, moderated Q&A, presenter view, upvotes, search, sort, and live updates. |
| `SPEC.md` | Screen inventory, required elements, interactions, edge cases, realtime behavior, accessibility, and exact Q&A state rules. |
| `SRS.md` | Next.js App Router, Tailwind internal components, Supabase Realtime, mobile audience target, 300 participant target, RLS and security constraints. |
| `src/components/ui`, `src/components/shell`, `src/components/events` | Existing primitives: Button, Field, Badge, Alert, AppShell, CopyJoinLinkButton, EventDashboard, EventForm, EventListItem. |

No `RESEARCH.md` or `components.json` exists for Phase 2. `components.json` is absent and shadcn is not initialized. This is intentional because the project stack and user constraint require a small internal Tailwind component set.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | Manual internal Tailwind component set |
| Preset | Not applicable |
| Component library | None; extend existing internal components only |
| Icon library | `lucide-react` only if a clear icon improves scanning; visible text labels remain required for primary and destructive actions |
| Font | `Inter`, fallback `Arial`, `sans-serif` |
| Styling | Tailwind CSS v4 utility classes matching Phase 1 patterns |
| Radius | 6px for all buttons, inputs, badges, alerts, segmented controls, dialogs, list rows, and panels |
| Elevation | Borders first; one subtle `shadow-sm` only for dialogs/popovers |

Existing primitives must be reused or extended before creating new components:

| Component | Phase 2 Use |
|-----------|-------------|
| `Button` | Primary, secondary, destructive, ghost, loading-preserving action controls. |
| `Field` | Join code, email, display name, search, numeric rules, and invite inputs. |
| `Badge` | Event status, member role, question status, edited indicator, connection state. |
| `Alert` | Access denied, moderation-off warning, stale-state conflict, event closed, realtime reconnect notice. |
| `AppShell` | Authenticated organiser/moderator workspace shell. Presenter View may use a simplified no-admin shell. |
| `CopyJoinLinkButton` | Event workspace join link copy; preserve ARIA live feedback. |
| `EventDashboard`, `EventForm`, `EventListItem` | Maintain visual continuity when Phase 2 links dashboard rows into Event Workspace. |

New internal components allowed for Phase 2:

| Component | Contract |
|-----------|----------|
| `SegmentedTabs` | 44px mobile / 40px desktop target; active state uses teal border/text; tabs are links or ARIA tabs with keyboard support. |
| `QuestionItem` | Dense bordered row/card with status, text, votes, time, identity, edited marker, and role-specific actions. |
| `VoteButton` | 44px mobile target; disabled/pressed state visible with text and `aria-pressed`; cannot appear on answered or archived questions. |
| `StatusFilter` | Pending, Live, Answered, Archived counts for moderator queue; never used in participant/presenter surfaces. |
| `SortControl` | Native select or segmented control with visible label; moderator options: Most recent, Oldest, Most votes; participant options: Popular, Recent; presenter options: Most votes, Most recent. |
| `MemberRow` | Email/name, role badge, invite status, remove action, and protected owner state. |
| `ConfirmDialog` | Focus trapped, max width 480px, destructive action uses red button, Cancel restores focus. |
| `ConnectionStatus` | Compact text badge: Live, Reconnecting, Refresh needed; no animated decorative treatment. |

---

## Spacing Scale

Declared values, all multiples of 4:

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, badge inner gaps, helper spacing |
| sm | 8px | Compact row gaps, metadata stacks, question action gaps |
| md | 16px | Default field, list, and panel spacing |
| lg | 24px | Desktop panel padding, workspace section spacing |
| xl | 32px | Major layout gaps between workspace regions |
| 2xl | 48px | Empty states and presenter view edge padding |
| 3xl | 64px | Maximum desktop vertical page spacing only |

Exceptions:

- Mobile touch targets must be at least 44px high and 44px wide.
- Desktop buttons, inputs, selects, and segmented controls must be at least 40px high.
- Presenter View may use 48px spacing between large question rows for readability.
- Focus rings may extend 2px outside the component box.
- Moderator queue row density may use 12px vertical padding when all controls still meet target size.

---

## Typography

Use exactly these four sizes and two weights across Phase 2.

| Role | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Label | 14px | 400 or 600 | 1.4 | Field labels, helper text, metadata, badges, timestamps, counters |
| Body | 16px | 400 | 1.5 | Default body text, participant question text, input text, button text |
| Heading | 20px | 600 | 1.25 | Section headings, panel headings, dialog headings, moderator queue group headings |
| Display | 28px | 600 | 1.2 | Workspace page title, participant event title, Presenter View event title |

Presenter View display rule:

- Approved question text uses 28px/1.2 at desktop widths 1024px and wider.
- Presenter metadata and vote counts use 20px/1.25.
- At widths below 768px, Presenter View falls back to 20px question text to prevent wrapping overload.

Rules:

- Do not use viewport-scaled type.
- Letter spacing is `0`.
- Do not introduce additional font sizes for counters, pills, or icons.
- Error text uses 14px/1.4 with text plus a border or icon cue, never color alone.
- Form labels are always visible; placeholders are examples only.

---

## Color

Use the Phase 1 restrained corporate palette.

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#F8FAFC` | Page background, participant background, presenter canvas |
| Secondary (30%) | `#FFFFFF` | Workspace panels, list surfaces, dialogs, header/sidebar, question rows |
| Border | `#CBD5E1` | Inputs, panels, list separators, inactive controls |
| Text Primary | `#0F172A` | Main content, headings, labels |
| Text Secondary | `#475569` | Metadata, helper text, timestamps |
| Accent (10%) | `#0F766E` | Primary action, active tab, focus ring, selected sort/filter, live connection state, successful copy/submission state |
| Accent Hover | `#115E59` | Primary action hover/pressed |
| Warning | `#B54708` | Moderation-off warning, event closed, realtime reconnecting, stale state notice |
| Destructive | `#B42318` | Dismiss, archive, remove access, confirm close/archive, failed/destructive states only |

Accent reserved for:

- Primary CTA on each screen.
- Active workspace tab or segmented option.
- Keyboard focus ring.
- Selected sort/filter state.
- Approved/live positive status when paired with text.
- Copy success and submission accepted confirmation.
- Live connection indicator.

Do not use accent for all links, every icon, decorative fills, or non-action badges. Public and presenter visibility safety is conveyed through role-specific content and text, not color.

Status badge tones:

| Status | Visual Contract |
|--------|-----------------|
| Pending | White surface, amber border/text, label "Pending". Staff surfaces only. |
| Live | White surface, teal border/text, label "Live". Public/presenter allowed. |
| Answered | Slate-100 surface, slate border/text, label "Answered". Public/presenter allowed. |
| Archived | Slate-100 surface, slate border/text, label "Archived". Staff surfaces only. |
| Dismissed | Represent as Archived with moderation action text "Dismissed". Staff surfaces only. |

---

## Layout Contract

### Authenticated Event Workspace

- Use the existing `AppShell` with `max-w-6xl`, slate page background, white header, and top-right account area.
- Event Workspace content uses a single page title row: event name, status badge, join code/link copy, Presenter View action.
- Workspace navigation is a horizontal tab/segmented row directly below the title row.
- Phase 2 tabs: `Q&A`, `Access`, `Settings`, `Presenter`.
- Do not surface Phase 3 tabs (`Surveys`, `Results`, `Exports`) as active destinations in Phase 2 unless they are disabled text-only placeholders.
- Desktop Q&A layout: left control column or header row for tabs/search/sort, main list, optional compact stats strip. No nested cards.
- Mobile workspace: stack event metadata, copy action, tabs, search, sort, and question list. No horizontal scrolling.
- Content max width remains 1120px. Settings/forms max width is 760px.

### Participant Public Area

- Public participant screens do not use the authenticated admin shell.
- Mobile-first max width is 640px with 16px side padding at 360px viewport width.
- Join screen is a compact single-column form, not a hero page.
- Audience Q&A screen places event name, sort, submission form, then approved question list.
- The question input and submit action remain reachable without horizontal scrolling at 360px.
- If surveys are not implemented in Phase 2, do not show a Survey tab.

### Moderator Queue

- Queue is a dense work UI optimized for repeated live actions.
- Desktop row/card structure:
  - Header: status badge, submitted time, vote count.
  - Body: question text.
  - Footer: identity, edited marker, action buttons.
- Pending tab actions: Approve, Edit, Dismiss, Archive.
- Live tab actions: Mark answered, Edit, Archive.
- Answered tab actions: Restore, Archive.
- Archived tab actions: Restore only, plus moderation history visibility.
- Primary action per row is status-specific: Approve for Pending, Mark answered for Live, Restore for Archived.
- Destructive actions are secondary in position and use destructive styling only when the action is immediately destructive.

### Presenter View

- Presenter View uses a no-admin display shell.
- Required content: event name, connection state, sort control, approved question list, vote count, Live/Answered status.
- No admin shell account area, no moderation controls, no edit controls, no submit form, no access/member controls.
- Presenter View must show only `live` and `answered` questions. It must never receive or render pending, dismissed, or archived payloads.
- Desktop layout should be readable on a second monitor: generous row spacing, 28px question text, high contrast, no dense admin chrome.
- Mobile/tablet fallback remains usable but display focus takes priority over management density.

---

## Component Contracts

| Component | Contract |
|-----------|----------|
| Button | Use existing variants. Loading state preserves width. Primary action per screen only. |
| Field | Visible label, helper/error slot, 44px mobile, 40px desktop, teal focus ring. |
| Select | Native select preferred for sort, role, status, identity, and numeric rules; visible selected value. |
| SegmentedTabs | Active state uses teal border/text and text label; keyboard operable; no icon-only tabs. |
| Badge | Text always visible. Do not rely on color alone for status or role. |
| Alert | Title plus body text; warning/destructive/info variants; critical safety errors are not auto-dismissed. |
| Dialog | Max width 480px; focus trap; Cancel and Escape close unless destructive action is in progress. |
| Toast/LiveMessage | Use for copy success, submit accepted, moderation action success; errors tied to forms also appear inline. |
| QuestionItem | Stable dimensions; row actions do not shift text; long questions wrap within container. |
| VoteButton | Shows count and state; upvoted state uses `aria-pressed`; disabled state explains why if answered/event closed. |
| MemberRow | Role badge, email/name, invite status, remove action; original organiser removal disabled with helper text. |
| HistoryPanel | Staff-only, collapsible details for moderation/edit history; uses table/list markup and 14px metadata. |
| ConnectionStatus | ARIA live polite text. Shows "Live", "Reconnecting", or "Refresh needed". |

---

## Screen Contracts

### Event Workspace

Required elements:

- Event name as `h1`.
- Event status badge.
- Join code and Copy join link action.
- Workspace tabs: Q&A, Access, Settings, Presenter.
- Presenter View action opens the display route in a new tab/window.
- Connection status when live subscriptions are active.

States:

- Loading workspace: skeleton rows matching final dimensions.
- Event not active: show warning that participants cannot submit yet.
- Event active: normal Q&A controls enabled.
- Event ended/closed: submissions disabled; staff records remain visible.
- Access denied: "You do not have access to this event. Return to the dashboard and choose an event from your accessible list."
- Error loading event: "Event details could not be loaded. Refresh the page or return to the dashboard."

Interactions:

- Copy join link preserves Phase 1 copy feedback.
- Workspace tabs update content without losing event context.
- Presenter View action is available to organisers, moderators, and speakers with assigned access.

### Access Management

Required elements:

- Members list with name/email, role, invite status, and remove action.
- Invite email field.
- Role select: Moderator or Speaker. Organiser role is not offered for simple invite unless implemented with explicit organiser permission.
- Invite person primary action.
- Pending invite explanation when email delivery is not implemented.

States:

- No additional members.
- Members available.
- Invite pending.
- Invite created.
- Invite failed.
- Remove confirmation.
- Remove failed.

Copy:

- Primary CTA: "Invite member".
- Empty state heading: "No moderators or speakers yet".
- Empty state body: "Invite a moderator to review questions or a speaker to use Presenter View."
- Manual onboarding notice: "Invite email delivery is not active yet. This member record is ready for manual account onboarding."
- Remove confirmation: "Remove access? This person will no longer be able to open this event."

Interaction rules:

- Removing access requires confirmation.
- The original organiser cannot be removed; show disabled state with helper text.
- Access changes show an inline success message and update the list without full page layout shift.

### Event Settings

Required elements:

- Event details fields from Phase 1.
- Identity mode select.
- Moderation enabled checkbox/toggle, default on.
- Question character limit numeric field.
- Duplicate submission block checkbox/toggle.
- Question rate limit numeric field.
- Close event action.
- Archive event action.

States:

- Saving.
- Save success.
- Save failure.
- Validation errors.
- Moderation-off confirmation.
- Close confirmation.
- Archive confirmation.

Copy:

- Primary CTA: "Save settings".
- Moderation-off dialog title: "Turn moderation off?"
- Moderation-off body: "Audience questions may appear publicly without review. Keep moderation on unless this event is intentionally unmoderated."
- Close confirmation: "Close event? Participants will no longer be able to submit questions, but records will remain available."
- Archive confirmation: "Archive event? This event will move out of the active dashboard list, but records will be preserved."

Interaction rules:

- Only organisers can edit settings.
- Turning moderation off requires the existing warning confirmation.
- Closing and archiving require destructive confirmation.
- Validation errors appear beside fields and in a form-level summary when multiple fields fail.

### Participant Join

Required elements:

- Product name: QSB Ask.
- Event code field when arriving without a resolved shared link.
- Event name after a valid link/code resolves.
- Identity fields based on event identity mode:
  - Anonymous: no identity fields.
  - Name required: display name.
  - Name and email required: display name and email.
- Join event action.
- Error area.

States:

- Empty.
- Joining.
- Invalid code.
- Event not active.
- Event closed.
- Identity required.
- Joined.
- Server/network error.

Copy:

- Primary CTA: "Join event".
- Invalid code: "This event code was not found. Check the code and try again."
- Event not active: "This event is not active yet. Ask the organiser when it will open."
- Event closed: "This event is closed. New questions are no longer being accepted."
- Identity required: "Enter the details required by the organiser to join this event."

Interaction rules:

- At 360px width, code input and CTA stack full width.
- Shared links prefill/resolve the code and move focus to any required identity field.
- Do not expose organiser controls, event member data, or private event settings.

### Participant Q&A

Required elements:

- Event name.
- Connection status.
- Question input with visible character count.
- Submit question action.
- Approved question list.
- Sort control: Popular, Recent.
- Vote action per live question.
- Answered label for answered questions.

States:

- No approved questions.
- Approved questions available.
- Submitted and waiting for review.
- Submitted and live when moderation is off.
- Submission validation error.
- Rate-limited with countdown.
- Duplicate blocked.
- Event closed.
- Reconnecting.

Copy:

- Primary CTA: "Submit question".
- Empty state heading: "No approved questions yet".
- Empty state body: "Approved questions will appear here during the event."
- Waiting confirmation: "Question submitted for review. It will appear after a moderator approves it."
- Live confirmation: "Question submitted."
- Rate limit: "Please wait {seconds}s before submitting another question."
- Duplicate blocked: "This looks like a question you already submitted. Reword it or wait for moderator review."
- Submission error: "Your question could not be submitted. Check your connection and try again."

Interaction rules:

- Participant Q&A must query and subscribe only to `live` and `answered` questions.
- Pending, dismissed, and archived questions must never be rendered, cached in client state, or received through public realtime payloads.
- Participants can upvote only Live questions once per participant session.
- Answered questions show vote count and status but no active vote action.
- Submitted text is preserved on network failure.
- Character count turns warning color near the configured limit and destructive color over the limit.

### Moderator Queue

Required elements:

- Status tabs: Pending, Live, Answered, Archived.
- Pending count indicator.
- Search field, searching question text only, case-insensitive.
- Sort control: Most recent, Oldest, Most votes.
- Question items with text, identity/Anonymous, submitted time, vote count, status, edited marker, and actions.
- Staff-only moderation history/edit versions affordance.

States:

- Pending queue.
- Live list.
- Answered list.
- Archived list.
- Empty tab.
- Searching no results.
- Editing question.
- Action pending.
- Action success.
- Action failure.
- Concurrent edit detected.
- Reconnecting.

Copy:

- Primary CTA by status: "Approve question", "Mark answered", "Restore question".
- Empty pending heading: "No pending questions".
- Empty pending body: "New audience questions will appear here for review."
- Empty live heading: "No live questions".
- Empty live body: "Approve pending questions to show them to participants and speakers."
- No search results: "No questions match your search."
- Stale state: "This question was updated by another moderator. Review the latest version before taking action."
- Action failure: "This moderation action could not be saved. Refresh the question and try again."

Interaction rules:

- First-action-wins conflicts show the stale state alert and refresh the item.
- Approve moves Pending to Live.
- Dismiss moves the item to Archived and records a dismiss action.
- Archive moves the item to Archived without losing prior state.
- Restore returns Archived to its correct prior state.
- Edit opens a text area with Save edit and Cancel. Save creates a version record.
- Mark answered moves Live to Answered.
- Moderator actions are disabled while realtime connection is unavailable; show "Reconnect to continue."

### Audience Q&A

Audience Q&A is the participant-facing approved question list inside the public participant route.

Required elements:

- Approved question list only.
- Popular/Recent sort.
- Vote count.
- Answered status.
- Optional submitted-by label only when identity mode allows display; anonymous remains "Anonymous".

Rules:

- Shows only Live and Answered.
- Does not show pending count, moderation status tabs, edit history, participant emails, member roles, or admin controls.
- Dismissed/Archived questions disappear from the list on the next live update.

### Presenter View

Required elements:

- Event name.
- Connection status.
- Sort control: Most votes, Most recent.
- Approved question list.
- Vote count.
- Status label: Live or Answered.
- Empty state.

States:

- No approved questions.
- Approved questions available.
- Reconnecting.
- Refresh needed.
- Access denied.

Copy:

- Empty state heading: "No approved questions yet".
- Empty state body: "Approved questions will appear here as moderators review them."
- Access denied: "You do not have access to Presenter View for this event."
- Refresh needed: "Live updates are not reconnecting. Refresh this view to continue."

Interaction rules:

- No admin controls.
- No moderation controls.
- No question submission.
- No participant identity management.
- No pending, dismissed, or archived data.
- Presenter View may auto-refresh list state through realtime, but user scroll position must not jump when new questions arrive unless the user is already near the top.

### Normal Realtime States

Required elements:

- Compact connection indicator on Moderator Queue, Participant Q&A, and Presenter View.
- ARIA live region for list/status updates that are not visually obvious.

States:

- Live: "Live".
- Reconnecting: "Reconnecting".
- Refresh needed: "Refresh needed".

Rules:

- Normal-condition updates must appear within 2 seconds.
- Phase 2 only needs basic loading/offline states; prolonged reconnect hardening is Phase 4.
- Do not rely on client-side filtering to hide private questions. Public and presenter channels must never subscribe to unsafe payloads.
- Moderator channels may show staff-safe statuses only after role verification.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Workspace primary CTA | "Copy join link" or "Save settings" depending on active tab |
| Access primary CTA | "Invite member" |
| Participant join CTA | "Join event" |
| Participant Q&A CTA | "Submit question" |
| Moderator pending CTA | "Approve question" |
| Moderator live CTA | "Mark answered" |
| Moderator archive CTA | "Restore question" |
| Participant empty heading | "No approved questions yet" |
| Participant empty body | "Approved questions will appear here during the event." |
| Moderator empty heading | "No pending questions" |
| Moderator empty body | "New audience questions will appear here for review." |
| Presenter empty heading | "No approved questions yet" |
| Presenter empty body | "Approved questions will appear here as moderators review them." |
| Generic loading | "Loading event workspace." |
| Generic error | "This view could not be loaded. Refresh the page or return to the dashboard." |
| Access denied | "You do not have access to this event." |
| Reconnect error | "Live updates are reconnecting. Reconnect to continue." |
| Stale action error | "This question was updated by another moderator. Review the latest version before taking action." |
| Submission pending | "Question submitted for review. It will appear after a moderator approves it." |
| Moderation-off warning | "Audience questions may appear publicly without review. Keep moderation on unless this event is intentionally unmoderated." |

Destructive confirmations:

| Action | Confirmation Copy |
|--------|-------------------|
| Dismiss question | "Dismiss question? It will not appear to participants or speakers, but the record will be preserved." |
| Archive question | "Archive question? It will be removed from active Q&A lists, but the record will be preserved." |
| Remove member | "Remove access? This person will no longer be able to open this event." |
| Close event | "Close event? Participants will no longer be able to submit questions, but records will remain available." |
| Archive event | "Archive event? This event will move out of the active dashboard list, but records will be preserved." |
| Turn moderation off | "Audience questions may appear publicly without review. Keep moderation on unless this event is intentionally unmoderated." |

Copy rules:

- Use direct verbs: Join event, Submit question, Approve question, Mark answered, Invite member.
- Avoid promotional language.
- Never imply pending questions are public or visible.
- Errors must state the problem and next action.
- Public screens use participant-safe language and never mention internal moderation records.

---

## Interaction And State Rules

- All mutations have loading, success, validation error, server error, and access-denied states.
- Buttons prevent duplicate submissions while loading.
- Public/presenter surfaces show only Live and Answered questions.
- Pending, dismissed, and archived questions must never appear in participant-facing or presenter-facing markup, realtime payloads, loading fallbacks, or optimistic cache.
- Optimistic UI is allowed for vote button pressed state only after the server accepts the vote or returns an idempotent already-voted state.
- Moderator queue may optimistically disable acted-on rows while the action is pending, but final state comes from the server.
- Search filters visible moderator questions live by question text only.
- Sort controls preserve the active tab and search query.
- Moderator edit preserves original text and shows an edited marker after save.
- Row click and row action controls are independent.
- Dialogs restore focus to the triggering control on close.
- Realtime updates must not steal focus from forms, dialogs, or active edit textareas.
- Public participant text input must preserve draft text across submission error and reconnect state.

---

## Accessibility Contract

- Target WCAG 2.1 AA for all Phase 2 screens.
- Every route has one `h1`.
- Use semantic `form`, `label`, `button`, `nav`, `main`, `section`, `table` or list markup as appropriate.
- Authenticated screens retain the skip link from `AppShell`.
- Public participant screens include a skip link when navigation or repeated list content appears before the form.
- All controls are keyboard operable with visible teal focus rings.
- Focus moves to the first meaningful error summary after failed submit.
- Status, warning, and error states are conveyed through text and structure, not color alone.
- Status badges include visible text.
- Dialogs trap focus, restore focus, and support Escape unless a destructive action is currently saving.
- Minimum contrast: 4.5:1 for normal text and 3:1 for large text and graphical UI boundaries.
- Mobile participant join and Q&A must work at 360px width without horizontal scrolling.
- Touch targets on mobile must be at least 44px.
- Realtime announcements use polite ARIA live regions; do not announce every vote count change if it would overwhelm screen reader users.
- Presenter View text must remain readable from a second monitor distance with high contrast and no low-contrast metadata.

---

## Visual Quality Criteria

- No hero section, decorative gradient/orb background, split marketing layout, illustrations, or oversized product promotion.
- No nested cards. Use panels, sections, tables/lists, and row separators instead.
- One primary action per screen or tab.
- Moderator queue must be dense enough for live work: at least 5 pending questions visible above the fold on a typical desktop viewport.
- Participant Q&A must be calm and simple: submit form, sort, approved list.
- Presenter View must be readable and display-focused, with no admin chrome.
- Loading skeletons preserve layout size and prevent content shift.
- Empty states are compact and action-oriented, not illustrative.
- Text must wrap inside containers and never overlap controls at 360px mobile width.
- Use borders and spacing before shadows.
- Do not use color as the sole distinction between question states.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable - shadcn not initialized |
| third-party registries | none | not applicable - no third-party blocks approved |

No registry blocks are approved for Phase 2.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

Approval: pending
