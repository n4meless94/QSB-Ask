import { expect, test } from "@playwright/test";

test("health route returns non-secret operational JSON", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.status()).toBe(200);
  const payload = await response.json();

  expect(payload).toMatchObject({
    ok: true,
    service: "qsb-ask",
  });
  const serializedPayload = JSON.stringify(payload);
  const serviceRoleValue = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (serviceRoleValue) {
    expect(serializedPayload).not.toContain(serviceRoleValue);
  }
  expect(serializedPayload).not.toContain("replace-with-supabase-service-role-key");
});

test("admin health route mirrors non-secret operational JSON", async ({ request }) => {
  const response = await request.get("/admin/health");

  expect(response.status()).toBe(200);
  const payload = await response.json();

  expect(payload).toMatchObject({
    ok: true,
    service: "qsb-ask",
  });
});

test("root page renders one h1 without mobile horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 720 });
  await page.goto("/");

  await expect(page.locator("h1")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { level: 1, name: "QSB Event Portal" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Join an Event" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Join Event" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Skip to main content" })).toHaveAttribute("href", "#main-content");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});

test("root page shows event actions without event list sections", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { exact: true, name: "Host an Event" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Create Event" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Knowledge Base" })).toHaveCount(2);
  await expect(page.getByRole("link", { name: "Knowledge Base" }).first()).toHaveAttribute("href", "/knowledge-base");
  await expect(page.getByRole("link", { name: "Support" })).toHaveCount(0);
  await expect(page.getByText("Active & Upcoming QSB Events")).toHaveCount(0);
  await expect(page.getByText("Recent Events")).toHaveCount(0);
  await expect(page.getByText("© 2026 Qhazanah Sabah Berhad.")).toBeVisible();
  await expect(page.getByText(/setup item|environment keys|system diagnostics/i)).toHaveCount(0);
});

test("knowledge base route is reachable from the homepage", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Knowledge Base" }).first().click();

  await expect(page).toHaveURL(/\/knowledge-base$/);
  await expect(page.getByRole("heading", { level: 1, name: "Knowledge Base" })).toBeVisible();
});

test("admin setup page keeps diagnostics off the public homepage", async ({ page }) => {
  await page.goto("/admin/setup");

  await expect(page.getByRole("heading", { level: 1, name: "QSB Ask setup status." })).toBeVisible();
  await expect(page.getByText("System diagnostics")).toBeVisible();
});

test("root page avoids banned marketing and decorative treatments", async ({ page }) => {
  await page.goto("/");

  const bodyText = await page.locator("body").innerText();
  await expect(page.locator(".hero")).toHaveCount(0);
  await expect(page.locator(".card .card")).toHaveCount(0);
  expect(bodyText).not.toMatch(/transform your event|engage your audience|all-in-one/i);

  const gradientCount = await page
    .locator("[class*='gradient'], [class*='from-'], [class*='to-'], [class*='via-']")
    .count();
  expect(gradientCount).toBe(0);
});
