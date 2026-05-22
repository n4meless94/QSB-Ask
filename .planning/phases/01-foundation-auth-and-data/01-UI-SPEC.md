---
phase: 1
slug: foundation-auth-and-data
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-22
---

# Phase 1 - UI Design Contract

Visual and interaction contract for QSB Ask Phase 1: Login, password reset/request, Event Dashboard, Create Event, basic shell/navigation, and local development/health-visible states where applicable.

Phase 1 must feel like a controlled internal operations tool for QSB events. It must not use a marketing landing-page treatment, oversized hero sections, decorative illustrations, or promotional copy.

---

## Source Decisions

| Source | Decisions Used |
|--------|----------------|
| `.planning/PROJECT.md` | Internal Slido-style Q&A/survey tool; professional corporate use; moderation and access control are core; WCAG 2.1 AA target; mobile-aware audience UX. |
| `.planning/REQUIREMENTS.md` | AUTH-01 to AUTH-04, EVNT-01 to EVNT-03, DEPL-01, DEPL-05 define Phase 1 behavior and required states. |
| `.planning/ROADMAP.md` | Phase 1 scope is foundation, auth, data, Event Dashboard, Create Event, local development, and RLS foundation. |
| `01-CONTEXT.md` | Quiet, dense, operational UI; Next.js App Router; TypeScript; Tailwind; Supabase Auth; Event Dashboard is first signed-in destination; Create Event uses Phase 1 fields only. |
| `SPEC.md` | Login, Event Dashboard, Create/Edit Event elements, interactions, states, account lockout, inactivity timeout, event defaults, accessibility rules. |
| `SRS.md` | Tailwind with a small internal component set; Supabase Auth email/password; RLS is mandatory; local and Coolify-compatible operational expectations. |

No `RESEARCH.md`, `components.json`, Tailwind config, app source, or existing UI components are present at the time of writing.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | Manual internal component set |
| Preset | Not applicable |
| Component library | None in Phase 1; build small Tailwind components only when app code is created |
| Icon library | None required; if icons are introduced, use `lucide-react` and keep visible text labels on primary actions |
| Font | `Inter`, fallback `Arial`, `sans-serif` |
| Styling | Tailwind CSS tokens matching this contract |
| Radius | 6px for inputs, buttons, alerts, tables, dialogs, and event cards |
| Elevation | Use borders first; one subtle shadow max for dialogs and active popovers |

Design-system rule: use primitive, reusable components only where they reduce duplication across Phase 1 screens: Button, TextField, PasswordField, Select, Toggle, Badge, Alert, EmptyState, Dialog, Toast, Shell, EventListItem, CopyButton.

shadcn is not initialized because the approved stack specifies Tailwind with a small internal component set and the user requested no code implementation.

---

## Spacing Scale

Declared values, all multiples of 4:

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, badge padding, input helper spacing |
| sm | 8px | Compact stack gaps, table cell inner gaps |
| md | 16px | Default form spacing, card padding on mobile |
| lg | 24px | Desktop card padding, page section spacing |
| xl | 32px | Major layout gaps, form group breaks |
| 2xl | 48px | Auth panel top/bottom breathing room, empty states |
| 3xl | 64px | Desktop page-level max vertical spacing only |

Exceptions:

- Mobile interactive targets must be at least 44px high.
- Desktop buttons and inputs must be at least 40px high.
- Icon-only copy buttons, if used, must be 40px desktop and 44px mobile with an accessible name and tooltip.
- Focus rings may extend 2px outside the component box.

---

## Typography

Use exactly these four sizes and two weights in Phase 1.

| Role | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Label | 14px | 400 or 600 | 1.4 | Field labels, helper text, metadata, table text, badges |
| Body | 16px | 400 | 1.5 | Default body copy, input text, button text |
| Heading | 20px | 600 | 1.25 | Auth form title, section headers, dashboard headings |
| Page Title | 28px | 600 | 1.2 | Event Dashboard title, Create Event title |

Rules:

- Do not use viewport-scaled type.
- Letter spacing must be `0`.
- Error text uses 14px/1.4 with text plus an icon or border cue, never color alone.
- Form labels are always visible; placeholders are examples only, not labels.

---

## Color

Use a restrained corporate palette with neutral surfaces, a teal action accent, and explicit destructive red.

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#F8FAFC` | Page background, auth background, dashboard canvas |
| Secondary (30%) | `#FFFFFF` | Forms, table/list surfaces, dialogs, shell header/sidebar |
| Border | `#CBD5E1` | Inputs, cards, table separators, inactive controls |
| Text Primary | `#0F172A` | Headings, labels, main content |
| Text Secondary | `#475569` | Metadata, helper copy, timestamps |
| Accent (10%) | `#0F766E` | Primary CTA, active nav item, focus ring, selected toggle state, copied-success state |
| Accent Hover | `#115E59` | Primary CTA hover/pressed |
| Warning | `#B54708` | Lockout warnings, moderation-off warning, local-dev missing configuration notice |
| Destructive | `#B42318` | Destructive actions only |

Accent reserved for:

- Sign in / Save Event / Create Event primary buttons.
- Active navigation indicator.
- Keyboard focus ring.
- Successful copy confirmation.
- Selected segmented/toggle state.

Do not use accent for all links, every icon, decorative backgrounds, or informational badges. Links inside body copy use Text Primary with underline on hover/focus.

---

## Layout Contract

### App Shell

- Signed-in screens use a utilitarian shell with a 64px top bar on desktop.
- Desktop layout: optional 240px left navigation when more than Dashboard exists; Phase 1 may use top navigation only if there are fewer than three destinations.
- Mobile layout: top bar remains 56px high; navigation collapses behind a menu button only when needed.
- Shell content max width is 1120px for dashboard and 760px for create/edit forms.
- User identity and Sign out belong in the top-right account area, not in page content.
- The shell must expose current location through heading text and active navigation state.

### Login And Password Reset

- Center a single auth panel with max width 420px.
- Keep QSB Ask as the page title and include short operational copy: "Sign in to manage event Q&A and surveys."
- Do not use a hero layout, full-bleed image, illustration, gradient orb, or product marketing section.
- On mobile, auth panel uses full-width layout with 16px page padding and no floating card shadow.

### Event Dashboard

- Desktop structure: title row, Create Event primary action, search/filter row, event list.
- Event list uses a dense table or list with columns/fields: event name, date/time, status, join code, copy action.
- Mobile structure: event rows become compact list items with stacked metadata and explicit copy button.
- Search must be directly above the event list and filter live by event name and join code.
- Empty state must use clear action copy and place Create Event in the empty state.

### Create Event

- Single-column form, max width 760px.
- Group fields into:
  - Event details: name, date/time, time zone, status.
  - Participant access: identity mode.
  - Question controls: moderation enabled, default question limit/rate/duplicate settings if exposed.
- Moderation enabled is on by default and visually recommended.
- Save/Cancel actions are sticky at the bottom only on mobile if form length exceeds one viewport.

### Local Development / Health Visible States

- Do not add a public marketing or diagnostics page.
- If local env variables are missing, show a development-only alert in the signed-in shell or local setup screen: "Local configuration is incomplete. Add the missing environment variables and restart the app."
- Health route output should be machine-readable. If a visible health page is added for development, it must be plain, access-controlled or development-only, and must not expose secrets.

---

## Component Contracts

| Component | Contract |
|-----------|----------|
| Button | 40px desktop minimum, 44px mobile minimum; primary, secondary, destructive, ghost variants; loading state preserves width. |
| TextField | Visible label, helper/error slot, 40px desktop minimum, 44px mobile minimum, border `#CBD5E1`, focus ring `#0F766E`. |
| PasswordField | Same as TextField; optional show/hide control must be text-labeled or icon plus accessible name. |
| Select | Native select or accessible custom select; visible selected value; keyboard operable. |
| Toggle | Use for moderation enabled only; includes label, helper text, and state text On/Off. |
| Badge | Status badges use text plus shape; draft, active, ended, archived must not rely on color alone. |
| Alert | Uses title plus body text; warning/destructive/informational variants; never dismiss critical auth errors automatically. |
| Dialog | Used for moderation-off confirmation and unsaved changes; max width 480px; focus trapped; Escape and Cancel close non-destructive dialogs. |
| Toast | Used for copy success/failure and save success; 4 second default; errors must also appear inline if tied to a form field. |
| EventListItem | Shows name, date, status, join code, copy action; entire row may open event but copy action must not also trigger row navigation. |
| CopyButton | Announces copied state to assistive tech; failure state explains clipboard fallback if browser blocks access. |

---

## Screen Contracts

### Login

Required elements:

- QSB Ask product name.
- Email field.
- Password field.
- Sign in action.
- Forgot password link.
- Inline error area.

States:

- Empty: both fields blank, Sign in enabled only when fields pass basic presence checks.
- Loading: Sign in shows "Signing in..." and prevents duplicate submit.
- Invalid credentials: "We could not sign you in. Check your email and password, then try again."
- Locked account: "This account is temporarily locked after repeated failed attempts. Try again in 30 minutes or reset your password."
- Server unavailable: "Sign in is unavailable right now. Check your connection and try again."
- Session expired: "Your session expired after inactivity. Sign in again to continue."

Interactions:

- Successful sign-in routes to Event Dashboard.
- Failed sign-in keeps entered email, clears password, moves focus to the error summary.
- Five failed attempts within 15 minutes triggers the lockout state.
- Inactivity timeout signs the user out after 8 hours of inactivity and returns to Login with session-expired copy.

### Password Reset Request

Required elements:

- Email field.
- Send reset link action.
- Back to sign in link.
- Confirmation state.

States:

- Empty.
- Sending.
- Confirmation.
- Rate limited or server error.

Copy:

- Primary CTA: "Send reset link".
- Confirmation: "If an account exists for that email, a reset link has been sent."
- Error: "We could not send the reset link. Check the email address and try again."

Security rule: the confirmation copy must not reveal whether an email address is registered.

### Password Reset Confirm

Required elements:

- New password field.
- Confirm password field.
- Save new password action.
- Password requirements helper.

States:

- Empty.
- Token expired/invalid.
- Validation error.
- Saving.
- Success.

Copy:

- Password helper: "Use at least 12 characters with uppercase, lowercase, a number, and a symbol."
- Expired link: "This reset link is invalid or expired. Request a new reset link."
- Success: "Password updated. Sign in with your new password."

### Event Dashboard

Required elements:

- Page title: "Event Dashboard".
- Create Event primary action.
- Search field.
- Event list with name, date/time, status, join code, copy join details action.
- Sign out in shell account area.

States:

- Loading: skeleton rows matching final event row dimensions.
- No events: clear empty state with Create Event action.
- Events available: dense list/table.
- Search no results: "No events match your search."
- Error loading events: "Events could not be loaded. Refresh the page or try again."
- Copy success: "Join details copied."
- Copy failure: "Join details could not be copied. Select the code and copy it manually."

Interactions:

- Search filters visible events live by event name and join code, case-insensitive.
- Selecting an event row opens the event workspace or Phase 1 event detail placeholder if workspace is not yet implemented.
- Copy action copies the join code or join link without opening the event.
- Create Event opens the Create Event screen.

### Create Event

Required fields:

- Event name.
- Event date/time.
- Time zone.
- Status: draft, active, ended.
- Participant identity mode: Anonymous, Name required, Name and email required.
- Moderation enabled toggle, default on.
- Save Event action.
- Cancel action.

Optional Phase 1 foundation fields, if implemented with the data model:

- Question character limit, default 280.
- Duplicate submission block, default on.
- Question rate limit, default 30 seconds.

States:

- New event.
- Saving.
- Validation errors.
- Save success.
- Save failure.
- Unsaved changes.
- Moderation-off warning shown.

Validation:

- Event name is required.
- Event date/time is required and cannot be in the past.
- Time zone defaults to organiser local time zone and remains editable.
- Identity mode is required.
- Moderation setting is required and defaults to enabled.

Moderation-off confirmation:

- Trigger only when the organiser turns moderation off.
- Dialog title: "Turn moderation off?"
- Dialog body: "Audience questions may appear publicly without review. Keep moderation on unless this event is intentionally unmoderated."
- Confirm action: "Turn off moderation".
- Cancel action: "Keep moderation on".

### Basic Shell / Navigation

Required elements:

- QSB Ask name in top bar.
- Current signed-in user email or display name.
- Sign out action.
- Active destination indicator.
- Main content landmark.

States:

- Authenticated.
- Loading user session.
- Session expired.
- Sign-out pending.

Interaction:

- Sign out ends the session and returns to Login.
- Keyboard tab order starts with skip link, then shell navigation, then page heading, then primary content.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | "Create event" on dashboard; "Save event" on Create Event; "Sign in" on Login |
| Empty state heading | "No events yet" |
| Empty state body | "Create an event to generate a join code and prepare the audience access settings." |
| Dashboard error state | "Events could not be loaded. Refresh the page or try again." |
| Auth error state | "We could not sign you in. Check your email and password, then try again." |
| Password reset confirmation | "If an account exists for that email, a reset link has been sent." |
| Copy success | "Join details copied." |
| Local configuration warning | "Local configuration is incomplete. Add the missing environment variables and restart the app." |
| Destructive confirmation | "Turn moderation off? Audience questions may appear publicly without review. Keep moderation on unless this event is intentionally unmoderated." |

Copy rules:

- Use direct verbs: Create event, Save event, Send reset link, Copy join link.
- Avoid marketing language such as "engage your audience" or "transform your event".
- Avoid implying that unreviewed public questions are safe.
- Error messages must state the problem and the next action.

---

## Interaction And State Rules

- All form submissions must have loading, success, validation error, and server error states.
- Buttons must prevent duplicate submissions while loading.
- Validation errors appear beside the relevant field and in a form-level summary when there is more than one error.
- Copy-to-clipboard feedback must be visible and announced through an ARIA live region.
- Unsaved Create Event changes must warn before leaving the page.
- Row click and row action controls must be independent; copy buttons must not trigger navigation.
- Account lockout must be visible as a specific state, not a generic invalid-credentials error.
- Password reset request must avoid account enumeration.
- Session expiration must explain that inactivity caused the sign-out.
- RLS/access-denied failures must show "You do not have access to this event." rather than a raw database or policy error.

---

## Accessibility Contract

- Target WCAG 2.1 AA for all Phase 1 screens.
- Every page has one `h1`.
- Use semantic `form`, `label`, `button`, `nav`, `main`, `table` or list markup as appropriate.
- Provide a skip link to main content on signed-in screens.
- All controls must be keyboard operable with visible focus.
- Focus moves to the first meaningful error summary after failed submit.
- Error, warning, and status are conveyed through text and structure, not color alone.
- Status badges include visible text: Draft, Active, Ended, Archived.
- Dialogs trap focus, restore focus to the triggering control on close, and support Escape unless the action is destructive confirmation in progress.
- Minimum contrast: 4.5:1 for normal text, 3:1 for large text and graphical UI boundaries.
- Mobile screens must work at 360px width without horizontal scrolling.
- Touch targets on mobile must be at least 44px.

---

## Visual Quality Criteria

- No hero section, no decorative gradient/orb background, no split marketing layout.
- No nested cards.
- Use one primary action per screen.
- Keep dashboard density high enough for repeated organiser use: event rows should fit at least 6 events above the fold on a typical desktop viewport.
- Use borders and spacing to separate groups before adding shadows.
- Keep form groups scannable with 20px headings and 14px helper text.
- Loading skeletons must preserve layout size and prevent content shift.
- Empty states must be compact and action-oriented, not illustrative.
- Mobile layouts must stack predictably, with primary actions reachable without horizontal scrolling.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable |
| third-party registries | none | not applicable |

No registry blocks are approved for Phase 1.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

Approval: pending
