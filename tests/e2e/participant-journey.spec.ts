import { expect, type Page, test } from "@playwright/test";

async function expectNoJoinAgainMessage(page: Page) {
  await expect(page.getByText(/Join this event again/)).toHaveCount(0);
}

async function expectParticipantCookie(page: Page) {
  const cookies = await page.context().cookies();

  expect(cookies).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        httpOnly: true,
        name: "qsb_ask_participant_event-1",
        path: "/join",
        sameSite: "Lax",
      }),
    ]),
  );
}

async function voteForSlidesQuestion(page: Page) {
  const voteButton = page.getByRole("button", {
    name: "Vote for question Will slides be shared?",
  });

  await expect(voteButton).toBeVisible();
  await voteButton.click();
  await expect(page.getByText("Vote recorded.")).toBeVisible();
  await expect(voteButton).toHaveAttribute("aria-pressed", "true");
  await expectNoJoinAgainMessage(page);
}

test("mobile participant joins a name-required event, keeps the session, and votes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/join/qsb2x9za");

  await expect(page.getByRole("heading", { level: 1, name: "Join Quarterly Briefing" })).toBeVisible();
  await expect(page.getByLabel("Join code")).toHaveValue("QSB2X9ZA");
  await expect(page.getByLabel("Display name")).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveCount(0);

  await page.getByRole("button", { name: "Join event" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Display name is required for this event." }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/join\/qsb2x9za$/i);

  await page.getByLabel("Display name").fill("Mobile Participant");
  await page.getByRole("button", { name: "Join event" }).click();

  await expect(page).toHaveURL(/\/join\/QSB2X9ZA\/qna$/);
  await expectParticipantCookie(page);
  await voteForSlidesQuestion(page);

  await page.getByRole("link", { name: "Surveys" }).click();
  await expect(page).toHaveURL(/\/join\/QSB2X9ZA\/surveys$/);
  await expect(page.getByRole("heading", { level: 1, name: "Quarterly Briefing Surveys" })).toBeVisible();
  await expectNoJoinAgainMessage(page);
});

test("participant name and email mode requires both identity fields before Q&A access", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/join/QSBEMAIL");

  await expect(page.getByRole("heading", { level: 1, name: "Join Stakeholder Briefing" })).toBeVisible();
  await expect(page.getByLabel("Display name")).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();

  await page.getByLabel("Display name").fill("Stakeholder Guest");
  await page.getByRole("button", { name: "Join event" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Email is required for this event." }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/join\/QSBEMAIL$/);

  await page.getByLabel("Display name").fill("Stakeholder Guest");
  await page.getByLabel("Email").fill("guest@example.com");
  await page.getByRole("button", { name: "Join event" }).click();

  await expect(page).toHaveURL(/\/join\/QSBEMAIL\/qna$/);
  await expect(page.getByRole("heading", { level: 1, name: "Stakeholder Briefing Q&A" })).toBeVisible();
  await expectParticipantCookie(page);
  await voteForSlidesQuestion(page);
});

test("anonymous event auto-join and manual fallback do not require identity fields", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/join/QSB7HALL");

  await page.waitForURL(/\/join\/QSB7HALL\/qna$/, { timeout: 5000 }).catch(async () => {
    await page.getByRole("button", { name: "Continue to Q&A" }).click();
  });

  await expect(page.getByRole("heading", { level: 1, name: "Town Hall Q&A" })).toBeVisible();
  await expectParticipantCookie(page);
  await voteForSlidesQuestion(page);

  const manualPage = await page.context().newPage();
  await manualPage.setViewportSize({ width: 390, height: 844 });
  await manualPage.goto("/join/QSB7HALL?join=manual");

  await expect(manualPage.getByRole("heading", { level: 1, name: "Join Town Hall" })).toBeVisible();
  await expect(manualPage.getByLabel("Join code")).toHaveValue("QSB7HALL");
  await expect(manualPage.getByLabel("Display name")).toHaveCount(0);
  await expect(manualPage.getByLabel("Email")).toHaveCount(0);

  await manualPage.getByRole("button", { name: "Join event" }).click();
  await expect(manualPage).toHaveURL(/\/join\/QSB7HALL\/qna$/);
  await expectParticipantCookie(manualPage);
  await expectNoJoinAgainMessage(manualPage);
});
