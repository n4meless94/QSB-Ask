---
status: in_progress
created: 2026-06-04
quick_id: 260604-egr
---

# Quick Task 260604-egr: Fix Event Dashboard UI Review Findings

## Goal

Turn the screenshot UI review into focused improvements across the QSB Ask event dashboard without changing core data behavior.

## Scope

- Compress the repeated event header so live operational content appears sooner.
- Strengthen workspace navigation and status language for live-event use.
- Clarify survey lifecycle, participant result visibility, and survey list density.
- Improve survey results hierarchy, chart readability, and export confidence.
- Make protected access and destructive settings actions harder to misunderstand.
- Reinforce moderation safety, realtime status, queue scanning, and audit history priority.

## Tasks

1. Update dashboard shell and navigation.
   - Files: `src/components/events/EventWorkspace.tsx`
   - Verify: event header remains accessible, join details remain available, tabs still switch panels.

2. Update survey authoring and survey list UI.
   - Files: `src/components/surveys/SurveyEditor.tsx`, `src/components/surveys/SurveyList.tsx`
   - Verify: draft/save/publish/close actions remain wired; visibility copy is clearer.

3. Update results and exports UI.
   - Files: `src/components/surveys/SurveyResultsPanel.tsx`, `src/components/surveys/SurveyBarChart.tsx`, `src/components/surveys/ExportPanel.tsx`
   - Verify: charts render, accessible export names are distinct, CSV links are unchanged.

4. Update access, settings, and Q&A moderation UI.
   - Files: `src/components/events/EventAccessPanel.tsx`, `src/components/events/EventSettingsPanel.tsx`, `src/components/qna/ModeratorQueue.tsx`, `src/components/qna/ConnectionStatus.tsx`, `src/components/qna/ModerationHistoryPanel.tsx`
   - Verify: risky actions remain guarded; moderation queue still filters, searches, sorts, and shows connection state.

## Verification

- Run lint.
- Run tests.
- Build if feasible.
- Use local browser screenshot/inspection if the app can run with available environment.
