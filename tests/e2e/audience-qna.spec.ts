import { expect, test } from "@playwright/test";

test("audience list shows approved questions only, sorts, and votes once", async ({ page }) => {
  await page.goto("/join/QSB2X9ZA/qna");

  await expect(page.getByRole("heading", { level: 2, name: "Questions" })).toBeVisible();
  await expect(page.getByText("Will slides be shared?")).toBeVisible();
  await expect(page.getByText("Already answered item")).toBeVisible();
  await expect(page.getByText("Pending private question")).toHaveCount(0);
  await expect(page.getByText("Archived private question")).toHaveCount(0);

  await page.getByRole("radio", { name: "Recent" }).click();
  const cards = page.locator("[data-testid='audience-question-card']");
  await expect(cards.first()).toContainText("Newest approved question");

  await page.getByRole("radio", { name: "Popular" }).click();
  await expect(cards.first()).toContainText("Will slides be shared?");

  const voteButton = page.getByRole("button", { name: "Vote for question Will slides be shared?" });
  await expect(voteButton).toContainText("3");
  await voteButton.click();
  await expect(page.getByText("Vote recorded.")).toBeVisible();
  await expect(voteButton).toContainText("4");
  await expect(voteButton).toHaveAttribute("aria-pressed", "true");
  await expect(voteButton).toBeDisabled();
  await expect(page.getByText("You voted")).toBeVisible();

  await expect(page.getByText("Answered", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Voting closed for question Already answered item" })).toHaveCount(0);
  await expect(page.getByLabel("2 votes for answered question Already answered item")).toBeVisible();
});

test("audience Q&A has no mobile horizontal overflow at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 720 });
  await page.goto("/join/QSB2X9ZA/qna");

  const surveysTab = page.getByRole("link", { name: "Surveys" });
  await expect(surveysTab).toBeVisible();
  await expect(surveysTab).toHaveAttribute("href", "/join/QSB2X9ZA/surveys");

  const surveysTabBox = await surveysTab.boundingBox();
  expect(surveysTabBox?.y).toBeGreaterThan(620);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
