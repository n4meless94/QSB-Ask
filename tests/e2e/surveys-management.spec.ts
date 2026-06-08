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

test("organiser can author surveys from the Event Workspace", async ({ page }) => {
  await page.goto("/events/event-1");

  const tabs = page.getByRole("tablist", { name: "Event workspace sections" });
  await expect(tabs.getByRole("tab")).toHaveText([
    "Q&A",
    "Surveys",
    "Results",
    "Exports",
    "Access",
    "Settings",
    "Presenter",
  ]);

  await page.getByRole("tab", { name: "Surveys" }).click();

  await expect(page.getByRole("button", { name: "Create survey" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save draft" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Publish survey" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add question" })).toBeVisible();
  await expect(page.getByText("Survey is not ready to publish")).toBeVisible();
  await expect(page.getByLabel("Show results to participants")).not.toBeChecked();

  await page.getByRole("button", { name: "Add question" }).click();
  await expect(page.getByRole("button", { name: "Remove question" })).toHaveCount(2);

  await page.getByRole("button", { name: "Remove question" }).nth(1).click();
  await expect(page.getByRole("button", { name: "Remove question" })).toHaveCount(1);
  await expect(page.getByText("Question 2")).toHaveCount(0);
});

test("moderators and speakers do not see organiser survey authoring controls", async ({ page }) => {
  await page.goto("/events/event-moderator");
  await page.getByRole("tab", { name: "Surveys" }).click();

  await expect(
    page.getByText("Only organisers can create and manage surveys for this event."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Create survey" })).toHaveCount(0);

  await page.goto("/events/event-speaker");
  await page.getByRole("tab", { name: "Surveys" }).click();

  await expect(
    page.getByText("Only organisers can create and manage surveys for this event."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Publish survey" })).toHaveCount(0);
});

test("survey workspace has no mobile horizontal overflow at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 720 });
  await page.goto("/events/event-1");

  await page.getByRole("tab", { name: "Surveys" }).click();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
