---
quick_id: 260606-4cc
slug: fix-q-a-moderation-queue-presenter-focus
status: complete
created_at: "2026-06-06T03:07:37+08:00"
---

# Fix Q&A Moderation Queue Presenter Focus

## Goal

Selecting a queue item from the moderation queue should update the already-open Presenter View instead of opening a new presenter popup/window. The visible Presenter View change should have a light transition.

## Plan

1. Replace the queue focus link in `ModeratorQueue` with an in-place control button.
2. Publish the selected question through a browser-scoped presenter-control channel.
3. Subscribe `PresenterView` to that channel and use it to update the focused question.
4. Add a short question-swap animation with reduced-motion support.
5. Cover the two-window moderator-to-presenter behavior with focused E2E tests.

