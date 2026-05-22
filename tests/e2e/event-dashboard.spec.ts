import { expect, test } from "@playwright/test";

test("dashboard shows shell, title, create action, search, and event rows", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.getByText("QSB Ask")).toBeVisible();
  await expect(page.getByText("organiser@qsb.com")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Event Dashboard" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Create event" })).toHaveAttribute(
    "href",
    "/events/new",
  );
  await expect(page.getByLabel("Search events")).toBeVisible();

  const row = page.getByRole("link", { name: /Quarterly Briefing/ });
  await expect(row).toBeVisible();
  await expect(row).toContainText("1 Jun 2099");
  await expect(row).toContainText("Draft");
  await expect(row).toContainText("QSB2X9ZA");
  await expect(page.getByRole("button", { name: "Copy join link for Quarterly Briefing" })).toBeVisible();
});

test("dashboard search filters by event name and join code case-insensitively", async ({ page }) => {
  await page.goto("/dashboard");

  await page.getByLabel("Search events").fill("townhall");
  await expect(page.getByRole("link", { name: /Town Hall/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Quarterly Briefing/ })).toHaveCount(0);

  await page.getByLabel("Search events").fill("qsb2x9za");
  await expect(page.getByRole("link", { name: /Quarterly Briefing/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Town Hall/ })).toHaveCount(0);
});

test("copy action copies join details and does not open the event row", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/dashboard");

  await page.getByRole("button", { name: "Copy join link for Quarterly Briefing" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Join details copied.")).toBeVisible();
  await expect(page.evaluate(() => navigator.clipboard.readText())).resolves.toContain("QSB2X9ZA");
});

test("dashboard has no mobile horizontal overflow at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 720 });
  await page.goto("/dashboard");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
