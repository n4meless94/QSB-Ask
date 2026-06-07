---
slug: redesign-presenter-view-corporate-townhall
quick_id: 260607-p7q
status: complete
created: 2026-06-07
completed: 2026-06-07
commit: 89dc63e
---

# Summary — Redesign Presenter View for Corporate Townhall

Redesigned `src/components/qna/PresenterView.tsx` into a premium, minimal, executive
corporate live-Q&A presenter display. The current question is now the visual hero
(~70%) and the QR/join panel is secondary (~30%).

## What changed

- **Question hero**: soft anchored panel with a left teal accent rule, a
  "Now answering" / "Just answered" eyebrow with a `motion-safe` live pulse dot, very
  large fluid question text.
- **Metadata**: natural live-event copy `Live now · N votes · Queue #k` (status pill +
  muted detail). Removed the technical "Q&A Status" pill and the "Asked at …" timestamp.
- **Join panel**: smaller secondary QR card. Heading "Ask a question", support
  "Scan the QR code or enter this code", join code grouped into blocks of four
  (`groupedJoinCode`, e.g. `QSB2-X9ZA`) with a screen-reader `aria-label` that spells it out.
- **Footer**: audience-facing "Live Q&A active" (subtle) + moderator queue indicator
  (`queueCopy`: "No / 1 / N questions waiting"). Kept the refresh-needed escalation.
- **Empty state**: keeps the 70/30 balance with the join panel always visible so the
  audience can submit before the first approved question.
- Preserved realtime subscription, fixture mode, fullscreen logic, and the recently-fixed
  height-aware responsive sizing. Fully prop-driven — no hardcoded event/question values.
- Updated `tests/e2e/presenter-view.spec.ts` assertions to the new copy.

## Verification

- `npx eslint` (changed files) — clean
- `npx tsc --noEmit` — pass
- `npx playwright test tests/e2e/presenter-view.spec.ts` — 4/5 pass; the 1 failure
  (`moderation queue updates …`) is a **pre-existing** flake on `goto("/events/event-1")`
  (heavy moderator dashboard route, cold dev-server compile) — confirmed it fails
  identically on the original stashed code, unrelated to this change.
- `npm run build` — pass
- Visual sweep at 1920×1080, 1536×864, 1366×768 — no overflow; QR + join code render;
  hero/secondary balance correct.

## Files

- `src/components/qna/PresenterView.tsx` (redesign)
- `tests/e2e/presenter-view.spec.ts` (copy assertions)
