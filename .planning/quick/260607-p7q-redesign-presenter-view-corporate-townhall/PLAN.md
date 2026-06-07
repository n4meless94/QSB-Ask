---
slug: redesign-presenter-view-corporate-townhall
quick_id: 260607-p7q
created: 2026-06-07
mode: quick
---

# Redesign Presenter View for Corporate Townhall

Redesign `src/components/qna/PresenterView.tsx` into a premium, minimal, executive
corporate live-Q&A presenter display for the Qhazanah Sabah Group Strategic Townhall 2026.
The current question must be the visual hero (~70%); the QR/join panel stays visible but
secondary (~30%). All content stays prop-driven — no hardcoded event/question/status values.

## Problems being fixed

- Screen feels empty / horizontally unbalanced and reads like a waiting screen.
- QR card visually dominates the actual question.
- Metadata copy is too technical ("Q&A Status · Now Showing · Queue #1 · 3 votes · Asked at 3:21 am").
- Bottom "Connection: Connected" is too technical for an audience display.

## Changes

1. **Question hero (left, ~70%)** — soft anchored panel with a left teal accent rule,
   eyebrow label "Now answering" / "Just answered" with a live pulse, very large fluid
   question text, and natural-language metadata: `Live now · 3 votes · Queue #1`.
2. **Join panel (right, ~30%)** — smaller, secondary QR card. Heading "Ask a question",
   support "Scan the QR code or enter this code", join code grouped `8HP3-WQ6C`.
3. **Footer** — audience-facing "Live Q&A active" (subtle) + moderator queue indicator
   ("5 questions waiting" / "1 question waiting" / "No questions waiting").
4. **Empty state** — keeps the 70/30 balance; join panel always visible so the audience
   can submit even before the first approved question.
5. Preserve the recently-fixed height-aware responsive sizing, realtime subscription,
   fixture mode, and fullscreen logic. Add `motion-safe` to the live pulse.
6. Update `tests/e2e/presenter-view.spec.ts` to the new copy.

## Verification

- `npm run lint` (focused), `npx tsc --noEmit`
- `npx playwright test tests/e2e/presenter-view.spec.ts`
- `npm run build`
