# Phase 5: PDF Deck Upload And Storage - Context

**Gathered:** 2026-06-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 5 starts milestone v1.1 Integrated Slide Presenter. It owns event-scoped PDF deck upload, validation, storage metadata, replacement/removal, and presenter-safe deck loading. It must not implement slide navigation, QR overlay editing, question overlay controls, realtime overlay sync, or PowerPoint/Canva conversion.

</domain>

<decisions>
## Implementation Decisions

### PDF-First Scope
- Accept uploaded PDF decks only.
- Treat PowerPoint and Canva as source tools that presenters export to PDF before using QSB Ask.
- Defer `.pptx` conversion, direct Canva import, slide animations, embedded video, and presenter notes until the PDF workflow is validated.

### Storage And Access
- Store deck metadata event-scoped and require organiser role for upload, replacement, and removal.
- Let organiser, moderator, and speaker roles with presenter access load the deck for presentation.
- Keep participant routes unable to access deck management or private event metadata.
- Avoid printing file contents, signed URLs, or storage credentials in logs or UI.

### UI Direction
- Add deck management inside the existing Event Workspace rather than creating a separate admin shell.
- Keep the upload UI quiet, operational, and consistent with existing Button, Field, Badge, and Alert primitives.
- Use clear empty/error states for no deck, invalid file, failed upload, and removed deck.

### the agent's Discretion
Implementation details may be chosen conservatively to match the existing Next.js App Router, Supabase, Tailwind, Playwright, and internal component patterns.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/(app)/events/[eventId]/page.tsx` loads event workspace panels with role-aware access.
- `src/components/events/EventWorkspace.tsx` owns workspace tabs and event-level actions.
- `src/lib/events/access.ts` provides organiser, moderator, and speaker role assertions.
- `src/lib/supabase/server.ts` and `src/lib/supabase/admin.ts` provide server-side Supabase clients.
- Existing survey and Q&A modules show the preferred split between server-only domain helpers, server actions, and client UI components.

### Established Patterns
- Mutations should be server actions that call server-only helpers and revalidate the event route.
- Access checks must happen server-side, not only through hidden UI.
- Presenter surfaces should load safe DTOs and avoid organiser controls.
- Tests use focused Vitest helper coverage plus Playwright fixture routes for visible workflows.

### Integration Points
- Phase 5 will likely touch Supabase migrations/types, event workspace loading, a new deck domain module, new deck server actions, an upload panel component, and tests.
- Future Phase 6 will consume the presenter-safe deck DTO from this phase.

</code_context>

<specifics>
## Specific Ideas

- Limit each event to one active deck for v1.1.
- Choose explicit upload limits in the plan before implementation, such as max file size and max page count.
- Use a stable storage path that includes the event id and deck id, without deriving trust from the browser-provided filename.
- Persist original filename only for display and audit context.

</specifics>

<deferred>
## Deferred Ideas

- Browser slide navigation, fullscreen mode, and QR overlay are Phase 6.
- Moderator show-on-screen question state and question overlay UI are Phase 7.
- Overlay realtime, reconnect state, and presenter-room UAT are Phase 8.
- PowerPoint conversion, direct Canva import, slide animations, embedded video, and presenter notes remain outside v1.1.

</deferred>
