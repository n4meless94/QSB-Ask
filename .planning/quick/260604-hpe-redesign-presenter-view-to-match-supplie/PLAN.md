---
date: 2026-06-04
slug: redesign-presenter-view-to-match-supplie
status: complete
---

# Quick Task Plan

## Task

Redesign Presenter View to closely match the supplied executive briefing reference image.

## Scope

- Replace the current presenter dashboard/card layout with a full-screen briefing display.
- Preserve approved-only presenter data, realtime refresh behavior, and access boundaries.
- Keep the existing route and component ownership.
- Update focused Presenter View E2E assertions for the new visible layout.

## Acceptance Criteria

- Header resembles the reference: briefing title, event label, live Q&A status, settings/fullscreen controls.
- Active question dominates the left side with a compact speaker block.
- QR/join-code panel sits on the right with a framed visual QR area.
- Footer resembles the reference with connection, support links, and copyright text.
- No moderation controls are exposed.
- Responsive and mobile layouts have no horizontal overflow.
