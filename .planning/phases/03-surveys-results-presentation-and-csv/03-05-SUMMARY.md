---
phase: 03-surveys-results-presentation-and-csv
plan: 05
subsystem: csv-export
tags: [nextjs, route-handlers, supabase, csv, surveys, security]

requires:
  - phase: 03-surveys-results-presentation-and-csv
    plan: 01
    provides: Organiser-only Event Workspace tabs and survey authoring records.
  - phase: 03-surveys-results-presentation-and-csv
    plan: 03
    provides: Survey response records and organiser result boundaries.
provides:
  - Organiser-only CSV exports for questions plus versions, moderation history, and survey responses.
  - CSV serialization with formula-leading cell hardening and stable headers.
  - Safe participant labels for anonymous exports without raw tokens or token hashes.
  - Exports tab rows with counts, download links for nonempty exports, and empty states for zero records.
affects: [phase-04-uat, reporting, event-records]

tech-stack:
  added: []
  patterns:
    - Event-scoped App Router CSV route handlers return text/csv attachments only for nonempty exports.
    - Export helpers assert organiser role before querying or serializing event records.
    - Export UI uses server-loaded counts and disables empty downloads.

key-files:
  created:
    - src/lib/surveys/export.ts
    - src/app/(app)/events/[eventId]/export/[kind]/route.ts
    - src/components/surveys/ExportPanel.tsx
    - tests/surveys/export.test.ts
    - tests/e2e/csv-exports.spec.ts
  modified:
    - src/app/(app)/events/[eventId]/page.tsx

key-decisions:
  - "Empty exports return 204 without Content-Disposition so the UI does not trigger blank CSV downloads."
  - "Anonymous participants are labelled as Anonymous with a stable session audit prefix, while raw tokens and token hashes are omitted."
  - "The Exports tab renders Download CSV links only when organiser-loaded counts are nonzero."

patterns-established:
  - "Approved export kinds are centrally enumerated as questions, moderation, and survey-responses."
  - "CSV headers are fixed per export kind and covered by focused tests."
  - "Spreadsheet formula injection is reduced by prefixing cells that start with =, +, -, or @."

requirements-completed: [EXPT-01, EXPT-02, EXPT-03, EXPT-04, EXPT-05]

duration: 10min
completed: 2026-05-30
---

# Phase 03 Plan 05: Organiser CSV Exports Summary

**Organiser-only CSV exports with stable headers, formula hardening, safe anonymous labels, and empty export states**

## Performance

- **Duration:** 10 min
- **Started:** 2026-05-30T04:10:54Z
- **Completed:** 2026-05-30T04:20:06Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Added CSV export helpers for questions plus versions, moderation actions, and flattened survey response answers.
- Added an event-scoped route handler for the three approved export kinds with signed-in organiser access and non-download empty responses.
- Added organiser-only Exports tab UI with counts, `Download CSV` links for nonempty exports, and clear empty states.
- Added Vitest and Playwright coverage for stable headers, safe anonymous labels, formula hardening, empty states, and role visibility.

## Task Commits

Each task was committed atomically:

1. **Task 1: Prove CSV export safety and empty-state behavior** - `cd3987a` (test)
2. **Task 2: Implement organiser-only CSV helpers and route handler** - `b1b0fdf` (feat)
3. **Task 3: Build organiser export panel in Event Workspace** - `40cf2d1` (feat)

## Files Created/Modified

- `src/lib/surveys/export.ts` - CSV serializers, approved export-kind dispatch, export row loaders, safe participant labels, and organiser-loaded counts.
- `src/app/(app)/events/[eventId]/export/[kind]/route.ts` - Signed-in event-scoped CSV route with 204 empty responses and attachment headers for nonempty exports.
- `src/components/surveys/ExportPanel.tsx` - Organiser export rows with counts, download links, and empty-state alerts.
- `src/app/(app)/events/[eventId]/page.tsx` - Loads organiser export counts and wires the Exports tab while denying moderator/speaker controls.
- `tests/surveys/export.test.ts` - Focused coverage for CSV headers, escaping, hardening, labels, route empty handling, and organiser gating order.
- `tests/e2e/csv-exports.spec.ts` - Playwright coverage for organiser Exports tab rows, empty states, mobile overflow, and non-organiser visibility.

## Decisions Made

- Empty exports use HTTP 204 with no attachment header. This keeps route behavior aligned with EXPT-05 even if a user opens an empty export URL directly.
- Anonymous audit labels use a stable prefix from the participant session id instead of token material. This gives staff an audit handle without exposing raw session secrets.
- Export counts are loaded only for organiser access and the UI never renders export download links for moderator or speaker roles.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed empty-response assertion for 204 route responses**
- **Found during:** Task 2 (Implement organiser-only CSV helpers and route handler)
- **Issue:** The RED test asserted that a 204 response's missing `Content-Type` header did not contain `text/csv`, but the assertion operated on `null`.
- **Fix:** Normalized the header lookup to an empty string before the assertion.
- **Files modified:** `tests/surveys/export.test.ts`
- **Verification:** `npm test -- tests/surveys/export.test.ts`
- **Committed in:** `b1b0fdf`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The fix corrected test behavior only. Product scope remained exactly the approved CSV export slice.

## Issues Encountered

- `npm run lint` initially passed with one warning after replacing the Exports placeholder. The unused placeholder function was removed before the Task 3 commit, and the final lint run passed cleanly.
- Playwright surfaced the existing Next warning that the `middleware` file convention is deprecated in favor of `proxy`; this is pre-existing and out of scope for Plan 03-05.

## Known Stubs

None.

## Verification

- `npm test -- tests/surveys/export.test.ts` - passed, 5 tests.
- `npm run test:e2e -- tests/e2e/csv-exports.spec.ts` - passed, 3 tests.
- `npm run lint` - passed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 3 now has all five planned slices complete. Phase 4 can use these exports during UAT and deployment readiness checks.

## Self-Check: PASSED

- Created/modified files exist.
- Task commits found: `cd3987a`, `b1b0fdf`, `40cf2d1`.
- Stub scan found no TODO, FIXME, placeholder, coming soon, or not available strings in files touched by this plan.

---
*Phase: 03-surveys-results-presentation-and-csv*
*Completed: 2026-05-30*
