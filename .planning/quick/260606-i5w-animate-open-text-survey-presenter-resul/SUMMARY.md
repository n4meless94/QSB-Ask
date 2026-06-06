---
status: complete
quick_id: 260606-i5w
date: 2026-06-06
---

# Animated Open Text Survey Word Cloud

## Summary

Implemented presenter-safe open-text survey presentation as an animated keyword cloud. Presenter results now receive derived keyword counts while raw open-text responses remain organiser-only.

## Changed

- Added open-text keyword aggregation to survey result DTOs.
- Rendered open-text presentation questions as a smooth animated word cloud with larger words for higher mention counts.
- Preserved chart/table accessibility alternatives and reduced-motion behavior.
- Updated fixture data and E2E/unit coverage for the cloud and privacy boundary.

## Verification

- `npm run test -- tests/surveys/results.test.ts`
- `npm run lint`
- `npm run test:e2e -- tests/e2e/survey-presentation.spec.ts`
- `npm run build`
