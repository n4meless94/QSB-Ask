# QSB Ask v1 UAT Scenarios

**Status:** Ready for controlled pilot testing
**Target URL:** `https://ask.qsbportal.com.my`
**Evidence owner:** QSB pilot organiser or assigned tester

Do not record passwords, Supabase keys, raw participant session tokens, or service role keys in UAT evidence.

## Scenario 1: Organiser Sign-In And Event Setup

**Actor:** Organiser
**Setup:** Organiser test account exists.

**Steps:**
1. Open the production URL.
2. Sign in with the organiser test account.
3. Create a new event with moderation enabled.
4. Copy the join link.

**Expected:**
- Organiser reaches the dashboard.
- New event appears with a join code/link.
- Join link uses `https://ask.qsbportal.com.my/join`.

**Evidence:** Screenshot of event dashboard with event name and redacted join code if needed.

## Scenario 2: Staff Access And Presenter View

**Actor:** Organiser, moderator, speaker
**Setup:** Event exists.

**Steps:**
1. Add a moderator and speaker in the Access panel.
2. Sign in as the speaker.
3. Open Presenter View.

**Expected:**
- Moderator and speaker access records are visible to organiser.
- Speaker sees approved/presenter content only.
- Speaker does not see organiser management controls.

**Evidence:** Screenshot of Access panel and Presenter View.

## Scenario 3: Participant Join And Moderated Q&A

**Actor:** Participant, moderator
**Setup:** Active event with join link.

**Steps:**
1. Open the join link on a phone-width browser or mobile device.
2. Complete identity fields if required.
3. Submit a question.
4. Confirm it does not appear publicly while pending.
5. Moderator approves the question.
6. Participant and presenter views refresh.

**Expected:**
- Pending question is hidden from public and presenter views.
- Approved question appears after moderation.
- Participant page has no organiser controls.

**Evidence:** Before/after screenshots and observed refresh timing.

## Scenario 4: Voting And Answered State

**Actor:** Participant, moderator/presenter
**Setup:** Approved question exists.

**Steps:**
1. Participant votes for an approved question.
2. Try voting again with the same participant session.
3. Mark the question answered.

**Expected:**
- Vote count increments once.
- Same participant cannot vote twice.
- Answered question remains visible but is no longer votable.

**Evidence:** Screenshot of vote count and answered state.

## Scenario 5: Survey Authoring And Publish

**Actor:** Organiser
**Setup:** Event exists.

**Steps:**
1. Create a survey with one multiple choice question, one rating question, and one open text question.
2. Attempt to publish an invalid question if practical.
3. Publish the valid survey.

**Expected:**
- Invalid publish attempts show validation.
- Valid survey publishes.
- Result visibility remains organiser-controlled.

**Evidence:** Screenshot of published survey and validation if tested.

## Scenario 6: Participant Survey Submission

**Actor:** Participant
**Setup:** Published survey exists.

**Steps:**
1. Open the event join link.
2. Complete and submit the survey.
3. Reload and try to submit again.

**Expected:**
- Participant can submit once.
- Duplicate submission is blocked for the same session.
- Results are hidden unless organiser enabled participant visibility.

**Evidence:** Completion screenshot and duplicate-state screenshot.

## Scenario 7: Organiser Results And Survey Presentation

**Actor:** Organiser or presenter
**Setup:** Survey has at least one response.

**Steps:**
1. Open organiser Results tab.
2. Open survey Presentation View.
3. Submit a new response from another browser.
4. Record time until presentation chart updates.

**Expected:**
- Results show response counts, charts, tables, and open text data.
- Presentation view has no admin controls.
- Hosted live update target is within 2 seconds under normal network conditions.

**Evidence:** Timing note with start/end timestamps and screenshots.

## Scenario 8: Reconnect And Refresh Needed

**Actor:** Participant, moderator, presenter
**Setup:** Live Q&A or survey presentation open.

**Steps:**
1. Disconnect the test browser/network or use browser dev tools offline mode.
2. Observe live status.
3. Restore network.
4. If refresh-needed appears, activate `Refresh view`.

**Expected:**
- Offline/reconnecting states are visible with clear copy.
- Refresh-needed state includes a keyboard-operable refresh action.
- No raw realtime data appears in the UI.

**Evidence:** Screenshot of each state tested.

## Scenario 9: CSV Export

**Actor:** Organiser
**Setup:** Event has questions, moderation actions, and survey responses.

**Steps:**
1. Open Exports tab.
2. Download questions/version CSV.
3. Download moderation history CSV.
4. Download survey responses CSV.
5. Open files in a spreadsheet viewer.

**Expected:**
- CSV files download only for nonempty export categories.
- Empty categories show a clear empty state.
- Anonymous labels do not expose raw tokens or token hashes.

**Evidence:** File names and redacted screenshots of headers.

## Scenario 10: Deployment Health And Domain

**Actor:** Operator
**Setup:** Coolify deployment is active.

**Steps:**
1. Open `https://ask.qsbportal.com.my/api/health`.
2. Check Coolify resource health.
3. Open `https://ask.qsbportal.com.my`.
4. Run one smoke event from organiser and participant browsers.

**Expected:**
- Health endpoint returns HTTP 200 and `"ok": true`.
- App is reachable over HTTPS.
- Coolify, not an unmanaged VPS service, owns the running application.

**Evidence:** Health response screenshot or copied non-secret JSON, Coolify resource status, and smoke result.
