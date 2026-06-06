import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  await context.addCookies([
    {
      name: "qsb_ask_e2e_auth",
      value: "1",
      domain: "127.0.0.1",
      path: "/",
      sameSite: "Lax",
    },
  ]);
});

test("presentation view shows aggregate charts without admin controls or private identifiers", async ({
  page,
}) => {
  await page.goto("/events/event-results/presentation/surveys/survey-1");

  await expect(page.getByRole("heading", { name: "Present" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pulse check" })).toBeVisible();
  await expect(page.getByText("Connected")).toBeVisible();
  await expect(page.getByText("3 responses submitted")).toBeVisible();
  await expect(page.getByText("1 of 3")).toBeVisible();
  await expect(page.getByRole("button", { name: "Tiles" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: "Is the pace clear?" })).toBeVisible();
  await expect(page.getByText("Yes: 2 responses, 67%")).toBeVisible();
  await expect(page.getByRole("table", { name: "Is the pace clear? data" })).toContainText("No");
  await page.getByRole("button", { name: "Bar" }).click();
  await expect(page.getByRole("button", { name: "Bar" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("67%").first()).toBeVisible();
  await page.getByRole("button", { name: "Next question" }).click();
  await expect(page.getByText("2 of 3")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Which topics should we expand?" })).toBeVisible();
  await page.getByRole("button", { name: "Next question" }).click();
  await expect(page.getByText("3 of 3")).toBeVisible();
  await expect(page.getByRole("heading", { name: "What should we clarify next?" })).toBeVisible();
  await expect(page.getByText("Cloud")).toBeVisible();
  await expect(page.getByLabel("budget: 3 mentions")).toBeVisible();
  await expect(page.getByLabel("timeline: 2 mentions")).toBeVisible();
  await expect(page.getByRole("table", { name: "What should we clarify next? keywords data" })).toContainText("detail");
  await expect(page.getByText(/Need more budget detail|Timeline please/i)).toHaveCount(0);

  await expect(page.getByRole("tab", { name: "Surveys" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Publish survey" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Save visibility" })).toHaveCount(0);
  await expect(page.getByText("Download CSV")).toHaveCount(0);
  await expect(page.locator("main").getByText(/participant_session_id|session_token_hash|raw-token|@qsb/i)).toHaveCount(0);
});

test("fixture refresh updates aggregate counts within 2 seconds without trusting raw payloads", async ({
  page,
}) => {
  await page.goto("/events/event-results/presentation/surveys/survey-1");
  await expect(page.getByRole("heading", { name: "Pulse check" })).toBeVisible();
  await expect(page.getByText("3 responses").first()).toBeVisible();
  await page.waitForFunction(() => document.body.dataset.surveyPresentationReady === "true");

  await page.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent("qsb-ask:e2e-survey-results-refresh", {
        detail: {
          rawHiddenResult: {
            participant_session_id: "participant-private",
            session_token_hash: "private-token-hash",
            text_value: "Hidden raw response",
          },
          result: {
            id: "survey-1",
            lastUpdated: "2026-05-30T00:15:00.000Z",
            presentationHref: "/events/event-results/presentation/surveys/survey-1",
            responseCount: 4,
            resultsVisibleToParticipants: true,
            status: "published",
            title: "Pulse check",
            questions: [
              {
                chartData: [
                  { count: 3, label: "Yes", percentage: 75 },
                  { count: 1, label: "No", percentage: 25 },
                ],
                id: "question-choice",
                openTextKeywords: [],
                openTextResponses: [],
                options: [
                  { id: "option-yes", label: "Yes", position: 0 },
                  { id: "option-no", label: "No", position: 1 },
                ],
                position: 0,
                prompt: "Is the pace clear?",
                ratingScale: null,
                responseCount: 4,
                type: "multiple_choice",
              },
            ],
          },
        },
      }),
    );
  });

  await expect(page.getByText("4 responses").first()).toBeVisible({ timeout: 2000 });
  await expect(page.getByText("Yes: 3 responses, 75%")).toBeVisible({ timeout: 2000 });
  await expect(page.getByText(/participant_session_id|session_token_hash|private-token-hash|Hidden raw response/i)).toHaveCount(0);
});

test("presentation view shows offline and refresh-needed reconnect actions without raw payloads", async ({
  page,
}) => {
  await page.goto("/events/event-results/presentation/surveys/survey-1");
  await page.waitForFunction(() => document.body.dataset.surveyPresentationReady === "true");

  await page.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent("qsb-ask:e2e-survey-connection", {
        detail: {
          rawPayload: "Hidden raw response",
          state: "offline",
        },
      }),
    );
  });

  await expect(
    page.getByText("You are offline. Live updates will resume when the connection returns."),
  ).toBeVisible();
  await expect(page.getByText("Hidden raw response")).toHaveCount(0);

  await page.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent("qsb-ask:e2e-survey-connection", {
        detail: {
          rawPayload: "Hidden raw response",
          state: "refresh-needed",
        },
      }),
    );
  });

  await expect(
    page.getByText("Live updates are not reconnecting. Refresh this view to continue."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Refresh view" })).toBeVisible();
  await page.getByRole("button", { name: "Refresh view" }).focus();
  await expect(page.getByRole("button", { name: "Refresh view" })).toBeFocused();
  await expect(page.getByText("Hidden raw response")).toHaveCount(0);
});

test("participant view shows aggregate results only when organiser visibility is enabled", async ({
  page,
}) => {
  await page.goto("/join/QSB2X9ZA/surveys?fixture=visible");

  await expect(page.getByText("Survey submitted. Thank you. Your response has been recorded for this event.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Participant results" })).toBeVisible();
  await expect(page.getByText("Yes: 2 responses, 67%")).toBeVisible();
  await expect(page.getByText("Results are hidden by the organiser.")).toHaveCount(0);
  await expect(page.getByText(/participant_session_id|session_token_hash|raw-token|@qsb/i)).toHaveCount(0);

  await page.goto("/join/QSB2X9ZA/surveys");
  await expect(page.getByText("Results are hidden by the organiser.").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Participant results" })).toHaveCount(0);
});
