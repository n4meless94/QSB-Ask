---
date: 2026-06-04
slug: hallmark-redesign-presenter-view-for-aud
status: complete
---

# Quick Task Plan

## Task

Hallmark redesign presenter view for audience display, then verify, commit, and deploy.

## Scope

- Redesign the presenter surface as a public, room-readable stage display.
- Preserve authenticated presenter access and approved-only question data boundaries.
- Keep the existing Next.js route and component ownership.
- Include the earlier event workspace UI polish and runtime layout fix already present in the worktree.

## Acceptance Criteria

- Presenter view does not visually expose organiser dashboard chrome when projected.
- Featured approved question is the primary visual focus.
- Remaining approved questions are secondary and safe.
- Empty state is audience-safe.
- Mobile and projector-width layouts have no horizontal overflow.
- Local lint, typecheck, unit tests, build, and focused E2E pass before commit/deploy.

