---
status: investigating
trigger: "join this event again before voting. step to reproduce im using mobile phone. scan qr join. then click vote"
created: 2026-06-06
updated: 2026-06-06
---

# Debug Session: join-event-again-before-voting

## Symptoms

- expected_behavior: "After scanning the event QR code and joining on a mobile phone, tapping Vote on a question should record the participant vote."
- actual_behavior: "The app tells the participant to join this event again before voting."
- error_messages: "\"Join this event again before voting.\""
- timeline: "Unknown from report."
- reproduction: "On a mobile phone, scan the event QR code, join the event, then tap Vote."

## Current Focus

- hypothesis: "The participant session established by the QR/join route is not available to the Q&A vote server action."
- test: "Inspect join/session/vote implementation and reproduce the mobile participant flow with browser/mobile emulation."
- expecting: "The join flow should set a participant session cookie or durable session identifier that voteQuestion can validate for the same joinCode."
- next_action: "run lint and typecheck"
- reasoning_checkpoint:
- tdd_checkpoint:

## Evidence

- 2026-06-06: `src/app/join/actions.ts` set the participant session cookie with `path: /join/{joinCode}` while the vote server action reads the cookie from the Q&A route. A case-sensitive or route-context variation from QR/mobile join could make the cookie invisible even though the participant just joined.
- 2026-06-06: `src/app/join/[joinCode]/qna/vote-actions.ts` returns exactly `"Join this event again before voting."` when `cookies().get(getParticipantCookieName(eventId))` is missing.
- 2026-06-06: Focused regression passed with `npm test -- tests/qna/participant-session.test.ts tests/qna/voting.test.ts` (2 files, 10 tests).
## Eliminated

## Resolution

- root_cause: "Participant session cookie was scoped too narrowly to one join-code path, so mobile QR/join route variations could leave the Q&A vote action without the session cookie."
- fix: "Scope participant session cookies to `/join`, keeping them limited to audience join pages while allowing Q&A and survey subroutes to share the session reliably."
- verification: "Focused participant-session and voting tests passed."
- files_changed: "src/app/join/actions.ts; tests/qna/participant-session.test.ts"
