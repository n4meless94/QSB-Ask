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

test("organiser sees approved CSV export rows and empty states", async ({ page }) => {
  await page.goto("/events/event-export");
  await page.getByRole("tab", { name: "Exports" }).click();
  const exportsPanel = page.getByRole("tabpanel", { name: "Exports" });

  await expect(page.getByRole("heading", { name: "CSV exports" })).toBeVisible();
  await expect(exportsPanel.getByText("Questions and versions")).toBeVisible();
  await expect(exportsPanel.getByText("Question records, current text, and version history for this event.")).toBeVisible();
  await expect(exportsPanel.getByText("Moderation history")).toBeVisible();
  await expect(exportsPanel.getByText("Survey responses")).toBeVisible();
  await expect(exportsPanel.getByText("Survey answers flattened by response and question.")).toBeVisible();

  const questionsRow = exportsPanel.getByRole("group", { name: "Questions and versions" });
  await expect(questionsRow.getByText("2 records")).toBeVisible();
  await expect(questionsRow.getByRole("link", { name: "Download CSV" })).toHaveAttribute(
    "href",
    "/events/event-export/export/questions",
  );

  const moderationRow = exportsPanel.getByRole("group", { name: "Moderation history" });
  await expect(moderationRow.getByText("No records to export")).toBeVisible();
  await expect(moderationRow.getByRole("link", { name: "Download CSV" })).toHaveCount(0);

  const surveyRow = exportsPanel.getByRole("group", { name: "Survey responses" });
  await expect(surveyRow.getByText("3 records")).toBeVisible();
  await expect(surveyRow.getByRole("link", { name: "Download CSV" })).toHaveAttribute(
    "href",
    "/events/event-export/export/survey-responses",
  );
});

test("empty export categories do not show download actions or overflow on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 720 });
  await page.goto("/events/event-empty-exports");
  await page.getByRole("tab", { name: "Exports" }).click();
  const exportsPanel = page.getByRole("tabpanel", { name: "Exports" });

  await expect(exportsPanel.getByText("No records to export")).toHaveCount(3);
  await expect(exportsPanel.getByText("This CSV will be available after records exist for this event.")).toHaveCount(3);
  await expect(exportsPanel.getByRole("link", { name: "Download CSV" })).toHaveCount(0);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});

test("moderators and speakers cannot see export controls", async ({ page }) => {
  await page.goto("/events/event-moderator");
  await page.getByRole("tab", { name: "Exports" }).click();

  await expect(page.getByText("Only organisers can export event records.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Download CSV" })).toHaveCount(0);

  await page.goto("/events/event-speaker");
  await page.getByRole("tab", { name: "Exports" }).click();

  await expect(page.getByText("Only organisers can export event records.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Download CSV" })).toHaveCount(0);
});
