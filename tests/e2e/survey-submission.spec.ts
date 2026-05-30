import { expect, test } from "@playwright/test";

test("participant submits a published survey, sees hidden-results and duplicate states, and never sees organiser data", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 720 });
  await page.goto("/join/QSB2X9ZA/surveys");

  await expect(page.getByRole("heading", { level: 1, name: "Quarterly Briefing" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Pulse check" })).toBeVisible();
  await expect(page.getByText("Results are hidden by the organiser.")).toBeVisible();
  await expect(page.getByText("Create survey")).toHaveCount(0);
  await expect(page.getByText("Publish survey")).toHaveCount(0);
  await expect(page.getByText("participant_session_id")).toHaveCount(0);
  await expect(page.getByText("session_token_hash")).toHaveCount(0);
  await expect(page.getByText("raw-token")).toHaveCount(0);

  await page.getByRole("radio", { name: "Yes" }).check();
  await page.getByRole("checkbox", { name: "Budget" }).check();
  await page.getByRole("checkbox", { name: "Risks" }).check();
  await page.getByRole("radio", { name: "4" }).check();
  await page.getByLabel("What should we clarify next?").fill("Please expand the timeline.");
  await page.getByRole("button", { name: "Submit survey" }).click();

  await expect(page.getByText("Survey submitted. Thank you. Your response has been recorded for this event.")).toBeVisible();
  await expect(page.getByText("Results are hidden by the organiser.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit survey" })).toHaveCount(0);
  await expect(page.getByText("You have already submitted this survey.")).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});

test("draft and closed surveys never render enabled participant response controls", async ({ page }) => {
  await page.goto("/join/QSB2X9ZA/surveys?fixture=closed");
  await expect(page.getByText("This survey is closed. New responses are no longer being accepted.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit survey" })).toHaveCount(0);

  await page.goto("/join/QSB2X9ZA/surveys?fixture=draft");
  await expect(page.getByRole("heading", { name: "No surveys are open" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit survey" })).toHaveCount(0);
});
