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

test("organiser can inspect survey result counts, charts, tables, and open text rows", async ({
  page,
}) => {
  await page.goto("/events/event-results");
  await page.getByRole("tab", { name: "Results" }).click();
  const resultsPanel = page.getByRole("tabpanel", { name: "Results" });

  await expect(page.getByRole("heading", { name: "Survey results" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pulse check" })).toBeVisible();
  await expect(
    page
      .getByRole("heading", { name: "Pulse check" })
      .locator("xpath=ancestor::div[contains(@class, 'min-w-0')]")
      .getByText("3 responses"),
  ).toBeVisible();
  await expect(page.locator("span").filter({ hasText: "Results visible" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open presentation view" })).toBeVisible();

  await expect(page.getByRole("heading", { name: "Is the pace clear?" })).toBeVisible();
  await expect(page.getByText("Yes: 2 responses, 67%")).toBeVisible();
  await expect(page.getByRole("table", { name: "Is the pace clear? data" })).toContainText("No");
  await expect(page.getByRole("table", { name: "Is the pace clear? data" })).toContainText("33%");

  await expect(page.getByRole("heading", { name: "Which topics should we expand?" })).toBeVisible();
  await expect(page.getByText("Risks: 2 responses, 100%")).toBeVisible();

  await expect(page.getByRole("heading", { name: "What should we clarify next?" })).toBeVisible();
  await expect(page.getByText("Need more budget detail.")).toBeVisible();
  await expect(page.getByText("Timeline please.")).toBeVisible();
  await expect(resultsPanel.getByText(/token|token_hash|raw-cookie-token|@qsb/i)).toHaveCount(0);
});

test("zero-response surveys keep chart/table structure and do not overflow at 360px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 720 });
  await page.goto("/events/event-results");
  await page.getByRole("tab", { name: "Results" }).click();

  await expect(page.getByRole("heading", { name: "Should we repeat this format?" })).toBeVisible();
  await expect(page.getByText("No responses yet")).toBeVisible();
  await expect(page.getByRole("table", { name: "Should we repeat this format? data" })).toContainText(
    "Agree",
  );
  await expect(page.getByRole("table", { name: "Should we repeat this format? data" })).toContainText(
    "0%",
  );

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
