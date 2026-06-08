---
quick_id: 260609-17x
slug: show-all-published-participant-surveys-i
status: in_progress
created_at: 2026-06-08T16:52:43.053Z
---

# Context

Participants currently see only one survey on `/join/[joinCode]/surveys` even when an organiser has multiple published surveys.

Root cause from read-only inspection:
- `src/lib/surveys/participant.ts` orders surveys by `updated_at desc` and uses `limit(1).maybeSingle()` when no `surveyId` is supplied.
- `src/app/join/[joinCode]/surveys/page.tsx` renders a single `ParticipantSurveyPageState`.

Desired outcome:
- Participants can discover and answer all published surveys for an event.
- Closed and draft surveys remain hidden from the normal participant survey list.
- Each survey keeps its own completed/results-visible state.
- Regression coverage proves multiple published surveys render.
