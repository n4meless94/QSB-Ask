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

test("organiser can edit event settings only after acknowledging moderation-off warning", async ({
  page,
}) => {
  await page.goto("/events/event-1");
  await page.getByRole("tab", { name: "Settings" }).click();

  await expect(page.getByRole("heading", { level: 2, name: "Event settings" })).toBeVisible();
  await expect(page.getByLabel("Event name")).toHaveValue("Quarterly Briefing");
  await expect(page.getByLabel("Participant identity mode")).toHaveValue("name_required");
  await expect(page.getByLabel("Question character limit")).toHaveValue("280");
  await expect(page.getByLabel("Question rate limit seconds")).toHaveValue("30");

  const moderationCheckbox = page.getByRole("checkbox", {
    name: /Moderation required before public display/,
  });

  await moderationCheckbox.uncheck();
  await expect(page.getByRole("dialog", { name: "Turn moderation off?" })).toBeVisible();
  await expect(page.getByText("Audience questions may appear publicly without review.")).toBeVisible();
  await page.getByRole("button", { name: "Keep moderation on" }).click();
  await expect(moderationCheckbox).toBeChecked();

  await moderationCheckbox.uncheck();
  await page.getByRole("button", { name: "I understand, turn moderation off" }).click();
  await expect(moderationCheckbox).not.toBeChecked();
  await expect(page.locator("input[name='moderation_warning_acknowledged']")).toHaveValue("true");
  await expect(page.getByRole("button", { name: "Save settings" })).toBeVisible();
});

test("organiser lifecycle actions require close and archive confirmations", async ({ page }) => {
  await page.goto("/events/event-1");
  await page.getByRole("tab", { name: "Settings" }).click();

  await page.getByRole("button", { name: "Close event" }).click();
  await expect(page.getByRole("dialog", { name: "Close event?" })).toBeVisible();
  await expect(page.getByText("Participants will no longer be able to submit new questions.")).toBeVisible();
  await page.getByRole("button", { name: "Keep event open" }).click();

  await page.getByRole("button", { name: "Archive event" }).click();
  await expect(page.getByRole("dialog", { name: "Archive event?" })).toBeVisible();
  await expect(page.getByText("Archived events stay available for records but are hidden from active workflows.")).toBeVisible();
  await page.getByRole("button", { name: "Keep event active" }).click();

  await page.getByRole("button", { name: "Archive event" }).click();
  await page.getByRole("dialog", { name: "Archive event?" }).getByRole("button", { name: "Archive event" }).click();
  await expect(page.getByRole("dialog", { name: "Archive event?" })).toBeHidden();
  await expect(page.getByRole("status").filter({ hasText: "Event archived." })).toBeVisible();
});

test("event settings has no mobile horizontal overflow at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 720 });
  await page.goto("/events/event-1");
  await page.getByRole("tab", { name: "Settings" }).click();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
