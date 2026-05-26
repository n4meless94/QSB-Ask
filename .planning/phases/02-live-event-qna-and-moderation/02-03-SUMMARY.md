---
phase: 02-live-event-qna-and-moderation
plan: 03
subsystem: participant-join
tags: [nextjs, supabase, participant-session, cookies, crypto, playwright, vitest]

requires:
  - phase: 02-live-event-qna-and-moderation
    plan: 02
    provides: Editable event identity mode and question rule settings.
provides:
  - Public `/join` and `/join/{code}` routes outside the authenticated app shell.
  - Participant session creation with high-entropy raw token, hashed database storage, and HTTP-only event-scoped cookie.
  - Identity-mode-aware participant join form.
affects: [phase-02-question-submission, phase-02-voting, phase-02-public-reads]

key-files:
  created:
    - src/lib/participants/validation.ts
    - src/lib/participants/session.ts
    - src/app/join/actions.ts
    - src/app/join/[[...joinCode]]/page.tsx
    - src/components/participants/ParticipantJoinForm.tsx
  modified:
    - tests/qna/participant-session.test.ts
    - tests/e2e/participant-join.spec.ts

key-decisions:
  - "Participant proof uses raw token possession; only SHA-256 token hashes are stored in participant_sessions."
  - "Participant cookies are HTTP-only, SameSite=Lax, and scoped to /events/{eventId}."
  - "Public join routes return only participant-safe event name, join code, and identity-mode-driven fields."

requirements-completed: [EVNT-06, EVNT-07]

duration: 26min
completed: 2026-05-26
---

# Phase 02 Plan 03: Participant Join And Session Summary

**Public join flow with secure event-scoped participant sessions**

## Accomplishments

- Added participant identity validation for anonymous, name-required, and name-email-required event modes.
- Added participant session helper that resolves join codes case-insensitively, rejects inactive events, creates high-entropy raw tokens, and stores only token hashes.
- Added participant session validation for later question submission and voting actions.
- Added join server action that sets an HTTP-only SameSite=Lax cookie scoped to the joined event path.
- Added public join route and mobile-first join form outside the authenticated organiser shell.

## Task Commits

1. **Task 1: Prove join and participant token behavior** - `ca5faab` (test)
2. **Task 2/3: Implement participant session helpers, action, and join screen** - `66bd1f6` (feat)

## Verification

- `npm run test -- tests/qna/participant-session.test.ts` - passed, 4 tests.
- `npm run test:e2e -- tests/e2e/participant-join.spec.ts` - passed, 4 tests.
- `npm run lint` - passed.

## Deviations from Plan

None beyond normal TDD implementation. The E2E route uses deterministic fixture data only under the existing E2E environment so browser tests can verify public join behavior without a live Supabase project.

## Scope Boundaries

- Successful join redirects to `/events/{eventId}/qna`; that route is owned by Plan 02-04.
- Question submission, approved-only public reads, voting, moderation queue, and realtime behavior remain in later Phase 2 plans.

## User Setup Required

None.

## Next Phase Readiness

Plan 02-04 can now use `validateParticipantSession(eventId, rawToken)` and `getParticipantCookieName(eventId)` to gate participant question submission and public Q&A actions.

---
*Phase: 02-live-event-qna-and-moderation*
*Completed: 2026-05-26*
