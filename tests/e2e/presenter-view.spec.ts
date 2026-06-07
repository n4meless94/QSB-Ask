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

test("presenter view shows approved questions only without management controls", async ({ page }) => {
  await page.goto("/events/event-1/presenter");

  await expect(page.getByRole("heading", { level: 1, name: "Quarterly Briefing Presenter View" })).toBeVisible();
  await expect(page.getByText("Townhall Briefing")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 2, name: "Ask a question" })).toBeVisible();
  await expect(page.getByText("Scan the QR code or enter this code")).toBeVisible();
  await expect(page.getByText("QSB2-X9ZA", { exact: true })).toBeVisible();
  await expect(page.getByText("Live Q&A active")).toBeVisible();
  await expect(page.getByText("Now answering")).toBeVisible();
  await expect(page.getByText("How will follow-up actions be shared?")).toBeVisible();
  await expect(page.getByText("Queue #1")).toBeVisible();
  await expect(page.getByText("8 votes")).toBeVisible();
  await expect(page.getByText("Live now", { exact: true })).toBeVisible();
  await expect(page.getByText("Queue clear")).toBeVisible();
  await expect(page.getByRole("button", { name: "Enter fullscreen" })).toBeVisible();

  await expect(page.getByText("Jameson Sterling")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Open event settings" })).toHaveCount(0);
  await expect(page.getByText("Will slides be shared?")).toHaveCount(0);
  await expect(page.getByText("Archived duplicate question")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Approve question/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Edit question/ })).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Question" })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "Access" })).toHaveCount(0);
});

test("presenter view can focus a queue question from the query string", async ({ page }) => {
  await page.goto("/events/event-1/presenter?questionId=question-answered-1");

  await expect(page.getByText("Who owns the next briefing?")).toBeVisible();
  await expect(page.getByText("Queue #2")).toBeVisible();
  await expect(page.getByText("Answered", { exact: true })).toBeVisible();
});

test("moderation queue updates the existing presenter view without opening a popup", async ({
  context,
}) => {
  const presenterPage = await context.newPage();
  const moderatorPage = await context.newPage();

  await presenterPage.goto("/events/event-1/presenter");
  await expect(presenterPage.getByText("How will follow-up actions be shared?")).toBeVisible();

  await moderatorPage.goto("/events/event-1");
  await moderatorPage.getByRole("tab", { name: "Q&A" }).click();
  await moderatorPage.getByRole("tab", { name: "Answered 1" }).click();

  const popupPromise = moderatorPage.waitForEvent("popup", { timeout: 750 }).catch(() => null);
  await moderatorPage.getByLabel("Show queue #2 in Presenter View").click();

  await expect(moderatorPage.getByText("Presenter View now showing Queue #2.")).toBeVisible();
  await expect(presenterPage.getByTestId("presenter-featured-question")).toContainText(
    "Who owns the next briefing?",
  );
  await expect(presenterPage.getByText("Queue #2")).toBeVisible();
  expect(await popupPromise).toBeNull();
});

test("presenter view denies unassigned signed-in users", async ({ page }) => {
  await page.goto("/events/denied/presenter");

  await expect(page.getByRole("heading", { level: 1, name: "Presenter View" })).toBeVisible();
  await expect(page.getByText("You do not have presenter access to this event.")).toBeVisible();
});

test("presenter view has no mobile horizontal overflow at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 720 });
  await page.goto("/events/event-1/presenter");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
