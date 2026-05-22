import { expect, test } from "@playwright/test";

test("health route returns non-secret operational JSON", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.status()).toBe(200);
  const payload = await response.json();

  expect(payload).toMatchObject({
    ok: true,
    service: "qsb-ask",
  });
  expect(JSON.stringify(payload).toLowerCase()).not.toContain("service_role");
  expect(JSON.stringify(payload).toLowerCase()).not.toContain("supabase_service_role_key");
});

test("root page renders one h1 without mobile horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 720 });
  await page.goto("/");

  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1, name: "Event operations" })).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
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
