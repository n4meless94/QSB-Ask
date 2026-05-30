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

  await expect(page.getByRole("heading", { level: 1, name: /Quarterly Briefing/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pulse check" })).toBeVisible();
  await expect(page.getByText("Connected")).toBeVisible();
  await expect(page.getByText("3 responses")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Is the pace clear?" })).toBeVisible();
  await expect(page.getByText("Yes: 2 responses, 67%")).toBeVisible();
  await expect(page.getByRole("table", { name: "Is the pace clear? data" })).toContainText("No");
  await expect(page.getByRole("heading", { name: "Should we repeat this format?" })).toBeVisible();
  await expect(page.getByText("No responses yet")).toBeVisible();

  await expect(page.getByRole("tab", { name: "Surveys" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Publish survey" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Save visibility" })).toHaveCount(0);
  await expect(page.getByText("Download CSV")).toHaveCount(0);
  await expect(page.getByText(/participant_session_id|session_token_hash|raw-token|@qsb/i)).toHaveCount(0);
});

test("fixture refresh updates aggregate counts within 2 seconds without trusting raw payloads", async ({
  page,
}) => {
  await page.goto("/events/event-results/presentation/surveys/survey-1");

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

  await expect(page.getByText("4 responses")).toBeVisible({ timeout: 2000 });
  await expect(page.getByText("Yes: 3 responses, 75%")).toBeVisible({ timeout: 2000 });
  await expect(page.getByText(/participant_session_id|session_token_hash|private-token-hash|Hidden raw response/i)).toHaveCount(0);
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
