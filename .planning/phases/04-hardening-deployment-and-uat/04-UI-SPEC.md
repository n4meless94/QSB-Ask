---
phase: 4
slug: hardening-deployment-and-uat
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-30
---

# Phase 4 - UI Design Contract

Visual and interaction contract for QSB Ask Phase 4: prolonged reconnect states, refresh-required actions, deployment readiness copy, and UAT/accessibility smoke evidence.

Phase 4 must harden the existing operational UI. It must not introduce a landing page, marketing layout, new component library, decorative gradients, or redesigned navigation.

---

## Source Decisions

| Source | Decisions Used |
|--------|----------------|
| `.planning/phases/04-hardening-deployment-and-uat/04-CONTEXT.md` | Reconnect hardening, Coolify deployment readiness, DNS cutover, accessibility/mobile smoke, and UAT boundaries. |
| `.planning/phases/03-surveys-results-presentation-and-csv/03-UI-SPEC.md` | Survey/presentation chart UI, ConnectionStatus reuse, mobile and accessibility constraints, export/result state patterns. |
| `.planning/phases/02-live-event-qna-and-moderation/02-UI-SPEC.md` | Q&A live-view status copy, moderator queue density, presenter/audience safety posture, and public mobile rules. |
| `src/components/qna/ConnectionStatus.tsx` | Current live/reconnecting/refresh-needed indicator that Phase 4 extends. |
| `src/lib/qna/realtime.ts` and `src/lib/surveys/realtime.ts` | Existing Supabase refresh-trigger subscription model. |
| `tests/e2e/*.spec.ts` | Existing Playwright role, no-private-data, and 360px no-horizontal-overflow smoke style. |

No `components.json` exists. Continue with the internal Tailwind component system.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | Manual internal Tailwind component set |
| Component library | Existing internal components only |
| Font | `Inter`, fallback `Arial`, `sans-serif` |
| Radius | 6px for buttons, banners, badges, alerts, and panels |
| Elevation | Borders first; no new decorative shadow surfaces |
| Icons | None required; if added later, use `lucide-react` with accessible names |

Phase 4 may extend `ConnectionStatus` into a richer banner but should keep the same import path when practical so existing live surfaces do not churn.

---

## Reconnect States

| State | Visible Copy | Tone | Action |
|-------|--------------|------|--------|
| live | Connected | Teal border/text | None |
| reconnecting | Reconnecting. Live updates may be delayed. | Amber border/text | None |
| offline | You are offline. Live updates will resume when the connection returns. | Amber border/text | None |
| refresh-needed | Live updates are not reconnecting. Refresh this view to continue. | Red border/text | `Refresh view` button |

Rules:

- `aria-live="polite"` belongs on the visible status text region.
- Refresh-required banners must include a keyboard-operable button labelled `Refresh view`.
- Status copy must not announce every incoming data update; it announces connection state only.
- Offline and reconnect banners are non-modal and must not shift controls into overlapping layouts.
- Mutating moderator actions may be disabled when the browser is offline; realtime degradation alone should warn about stale data without blocking HTTP actions.

---

## Layout

| Surface | Placement |
|---------|-----------|
| Audience Q&A | Status banner immediately below `Approved questions` heading and before sorting controls on mobile. |
| Moderator queue | Status banner in the queue header area, before action-heavy rows. |
| Presenter View | Status banner at the top of the presenter header, visible from across the room. |
| Survey presentation | Status banner at the top of the survey presentation header, before chart content. |
| Participant-visible survey results | Use the same compact status banner only if realtime refresh is active on that surface. |

Spacing remains 4, 8, 16, 24, 32, 48, and 64px only. Mobile controls must remain at least 44px high/wide; desktop controls at least 40px.

---

## Accessibility

- Banners must meet WCAG 2.1 AA contrast.
- Color cannot be the only indicator; each state has explicit text.
- Refresh action must be reachable by keyboard and have a visible focus ring.
- At 360px viewport width, banners and buttons wrap without horizontal scrolling.
- Presenter and presentation views must remain readable on mobile and display screens.
- Public and presenter surfaces must never show organiser-only controls or raw/private identifiers.

---

## Copy

| Context | Copy |
|---------|------|
| Coolify health docs | Health checks use `/api/health` and must not expose secret values. |
| Missing production env | Required environment variables are missing; configure them in Coolify before routing traffic. |
| Domain readiness | Public URL target: `https://ask.qsbportal.com.my`. |
| Live UAT | Hosted Supabase Realtime latency must be validated with a real event session. |

Deployment and UAT copy belongs in operational documentation, not visible public screens, unless a future admin-only status page is explicitly planned.

---

## Out Of Scope

- Offline moderation queues and reconciliation.
- New analytics dashboards.
- Excel export.
- Public deployment marketing page.
- Replacing the internal component system.
