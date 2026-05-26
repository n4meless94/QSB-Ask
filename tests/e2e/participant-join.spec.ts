import { expect, test } from "@playwright/test";

test("participant can open join form by shared code and see required identity copy", async ({
  page,
}) => {
  await page.goto("/join/QSB2X9ZA");

  await expect(page.getByRole("heading", { level: 1, name: "Join Quarterly Briefing" })).toBeVisible();
  await expect(page.getByLabel("Join code")).toHaveValue("QSB2X9ZA");
  await expect(page.getByLabel("Display name")).toBeVisible();
  await expect(page.getByRole("button", { name: "Join event" })).toBeVisible();
});

test("participant join shows participant-safe invalid code copy", async ({ page }) => {
  await page.goto("/join/NOPE1234");

  await expect(page.getByRole("heading", { level: 1, name: "Join event" })).toBeVisible();
  await expect(page.getByText("Enter the event code shared by the organiser.")).toBeVisible();
  await expect(page.getByText("We could not find an active event for that code.")).toBeVisible();
});

test("participant can enter code from the generic join page", async ({ page }) => {
  await page.goto("/join");

  await expect(page.getByRole("heading", { level: 1, name: "Join event" })).toBeVisible();
  await expect(page.getByLabel("Join code")).toBeVisible();
  await expect(page.getByLabel("Display name")).toBeVisible();
});

test("participant join has no mobile horizontal overflow at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 720 });
  await page.goto("/join/QSB2X9ZA");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
