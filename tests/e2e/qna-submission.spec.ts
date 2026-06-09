import { expect, test } from "@playwright/test";

test("participant submits a moderated question without rendering pending text publicly", async ({
  page,
}) => {
  await page.goto("/join/QSB2X9ZA");
  await page.getByLabel("Display name").fill("Mobile Participant");
  await page.getByRole("button", { name: "Join event" }).click();

  await expect(page).toHaveURL(/\/join\/QSB2X9ZA\/qna$/);
  await expect(page.getByRole("heading", { level: 1, name: "Quarterly Briefing Q&A" })).toBeVisible();
  await expect(
    page.locator("section[aria-labelledby='approved-questions-heading']").getByText("Connected"),
  ).toHaveCount(0);
  await expect(page.getByText("Q&A open")).toBeVisible();
  await expect(page.getByText("Live updates active")).toHaveCount(0);
  await expect(page.getByText("Checking for queue changes every 2 seconds.")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Surveys" })).toHaveAttribute(
    "href",
    "/join/QSB2X9ZA/surveys",
  );
  const questionInput = page.getByRole("textbox", { name: "Question" });
  await expect(questionInput).toBeVisible();

  await questionInput.fill("Will slides be shared after the briefing?");
  await expect(page.getByText("41 / 280")).toBeVisible();
  await page.getByRole("button", { name: "Ask question" }).click();

  await expect(page.getByText("Question submitted. It is waiting for moderator review.")).toBeVisible();
  await expect(page.getByText(/Join this event again/)).toHaveCount(0);
  await expect(page.getByText("Will slides be shared after the briefing?")).toHaveCount(0);
});

test("participant Q&A shows safe error copy and preserves draft text", async ({ page }) => {
  await page.goto("/join/QSB2X9ZA/qna?error=rate-limit");

  await expect(page.getByText("Please wait before submitting another question.")).toBeVisible();
  const questionInput = page.getByRole("textbox", { name: "Question" });
  await questionInput.fill("Can I ask again?");
  await expect(questionInput).toHaveValue("Can I ask again?");
});

test("participant Q&A has no mobile horizontal overflow at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 720 });
  await page.goto("/join/QSB2X9ZA/qna");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
