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

  const row = page.getByRole("listitem").filter({ hasText: "Quarterly Briefing" });
  await expect(row).toBeVisible();
  await expect(row).toContainText("1 Jun 2099");
  await expect(row).toContainText("Draft");
  await expect(row).toContainText("QSB2X9ZA");
  await expect(page.getByRole("button", { name: "Copy join link for Quarterly Briefing" })).toBeVisible();
});

test("dashboard search filters by event name and join code case-insensitively", async ({ page }) => {
  await page.goto("/dashboard");

  await page.getByLabel("Search events").fill("town");
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

test("create event form renders required Phase 1 fields", async ({ page }) => {
  await page.goto("/events/new");

  await expect(page.getByRole("heading", { level: 1, name: "Create Event" })).toBeVisible();
  await expect(page.getByLabel("Event name")).toBeVisible();
  await expect(page.getByLabel("Event date/time")).toBeVisible();
  await expect(page.getByLabel("Time zone")).toBeVisible();
  await expect(page.getByLabel("Status")).toBeVisible();
  await expect(page.getByLabel("Participant identity mode")).toBeVisible();
  await expect(page.getByLabel("Moderation enabled")).toBeChecked();
  await expect(page.getByRole("button", { name: "Save event" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", "/dashboard");
});

test("turning moderation off shows the required warning dialog", async ({ page }) => {
  await page.goto("/events/new");

  await page.getByLabel("Moderation enabled").uncheck();

  await expect(page.getByRole("dialog", { name: "Turn moderation off?" })).toBeVisible();
  await expect(
    page.getByText(
      "Audience questions may appear publicly without review. Keep moderation on unless this event is intentionally unmoderated.",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Keep moderation on" }).click();
  await expect(page.getByLabel("Moderation enabled")).toBeChecked();

  await page.getByLabel("Moderation enabled").uncheck();
  await page.getByRole("button", { name: "Turn off moderation" }).click();
  await expect(page.getByLabel("Moderation enabled")).not.toBeChecked();
});

test("create event validation shows field errors and summary", async ({ page }) => {
  await page.goto("/events/new");

  await page.getByRole("button", { name: "Save event" }).click();

  await expect(page.getByRole("alert")).toContainText("Fix the highlighted fields and try again.");
  await expect(page.getByText("Event name is required.")).toBeVisible();
  await expect(page.getByText("Event date/time is required.")).toBeVisible();
});

test("successful create event save redirects to dashboard with join details", async ({ page }) => {
  await page.goto("/events/new");

  await page.getByLabel("Event name").fill("Board Briefing");
  await page.getByLabel("Event date/time").fill("2099-08-20T10:30");
  await page.getByLabel("Time zone").fill("Asia/Kuala_Lumpur");
  await page.getByLabel("Status").selectOption("draft");
  await page.getByLabel("Participant identity mode").selectOption("name_email_required");
  await page.getByRole("button", { name: "Save event" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  const row = page.getByRole("listitem").filter({ hasText: "Board Briefing" });
  await expect(row).toBeVisible();
  await expect(row).toContainText("E2E9SAVE");
});
