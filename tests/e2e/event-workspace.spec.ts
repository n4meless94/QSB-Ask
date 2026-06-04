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

test("event workspace E2E fixture requires the auth cookie as well as the env flag", async ({
  context,
  page,
}) => {
  await context.clearCookies();
  await page.goto("/events/event-1");

  await expect(page).toHaveURL(/\/login/);
});

test("D-01/D-03 event workspace renders tabs and organiser Access content with E2E auth fixture", async ({
  page,
}) => {
  await page.goto("/events/event-1");

  await expect(page.getByRole("heading", { level: 1, name: "Quarterly Briefing" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Audience QR" })).toBeVisible();
  await expect(page.getByText("QSB2X9ZA", { exact: true })).toHaveCount(2);
  await expect(page.getByText("http://127.0.0.1:3000/join/QSB2X9ZA")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Download QR PNG" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy join link for Quarterly Briefing" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open Presenter View" })).toHaveAttribute(
    "href",
    "/events/event-1/presenter",
  );

  const tabs = page.getByRole("tablist", { name: "Event workspace sections" });
  await expect(tabs.getByRole("tab", { name: "Q&A" })).toBeVisible();
  await expect(tabs.getByRole("tab", { name: "Access" })).toBeVisible();
  await expect(tabs.getByRole("tab", { name: "Settings" })).toBeVisible();
  await expect(tabs.getByRole("tab", { name: "Presenter" })).toBeVisible();

  await page.getByRole("tab", { name: "Access" }).click();

  await expect(page.getByRole("heading", { level: 2, name: "Event access" })).toBeVisible();
  await expect(
    page.getByText("Invite emails are not sent yet. Add the staff email here; access activates automatically"),
  ).toBeVisible();
  await expect(page.getByLabel("Invite email")).toBeVisible();
  await expect(
    page.getByLabel("Role").locator("option").evaluateAll((options) =>
      options.map((option) => (option as HTMLOptionElement).value),
    ),
  ).resolves.toEqual(["moderator", "speaker"]);
  await expect(page.getByRole("button", { name: "Invite member" })).toBeVisible();
  const accessPanel = page.getByLabel("Event access");
  await expect(accessPanel.getByText("organiser@qsb.com")).toBeVisible();
  await expect(accessPanel.getByText("Original organiser", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove access for moderator@qsb.com" })).toBeVisible();
});

test("event workspace has no mobile horizontal overflow at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 720 });
  await page.goto("/events/event-1");

  await page.getByRole("tab", { name: "Access" }).click();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
