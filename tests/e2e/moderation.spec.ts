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

test("moderator queue supports tabs, search, sort, actions, edit marker, history, and stale copy", async ({
  page,
}) => {
  await page.goto("/events/event-1");
  await page.getByRole("tab", { name: "Q&A" }).click();

  await expect(page.getByRole("heading", { level: 2, name: "Moderation queue" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Pending 2" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Live 1" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Answered 1" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Archived 1" })).toBeVisible();

  await page.getByLabel("Search questions").fill("slides");
  await expect(page.getByText("Will slides be shared?")).toBeVisible();
  await expect(page.getByText("Can we get lunch timing?")).toHaveCount(0);

  await page.getByLabel("Sort questions").selectOption("most_votes");
  await expect(page.getByLabel("Sort questions")).toHaveValue("most_votes");

  await page.getByRole("button", { name: "Edit question Will slides be shared?" }).click();
  const editBox = page.getByRole("textbox", { name: "Edit question text" });
  await expect(editBox).toBeFocused();
  await editBox.fill("Will slides be shared after the briefing?");
  await page.getByRole("button", { name: "Save edit" }).click();
  await expect(page.getByText("Edited", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Approve question Will slides be shared after the briefing?" }).click();
  await expect(page.getByText("Question approved.")).toBeVisible();

  await page.getByRole("button", { name: "Simulate stale update" }).click();
  await expect(
    page.getByText("This question was updated by another moderator. Review the latest version before taking action."),
  ).toBeVisible();

  await expect(page.getByRole("heading", { level: 3, name: "Moderation history" })).toBeVisible();
  await expect(page.getByText("edit: pending to pending")).toBeVisible();
  await expect(page.getByText("approve: pending to live")).toBeVisible();
});

test("moderation queue has no mobile horizontal overflow at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 720 });
  await page.goto("/events/event-1");
  await page.getByRole("tab", { name: "Q&A" }).click();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
