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

test("moderator realtime refresh updates pending count while public surfaces stay private", async ({
  context,
}) => {
  const moderatorPage = await context.newPage();
  const audiencePage = await context.newPage();

  await moderatorPage.goto("/events/event-1");
  await moderatorPage.getByRole("tab", { name: "Q&A" }).click();
  await audiencePage.goto("/join/QSB2X9ZA/qna");

  await expect(moderatorPage.getByRole("tab", { name: "Pending 2" })).toBeVisible();

  const questions = [
    {
      current_text: "Pending private realtime question",
      id: "question-pending-realtime",
      is_edited: false,
      participantEmail: null,
      participantIdentity: "Anonymous",
      previous_status: null,
      status: "pending",
      submitted_at: "2026-05-26T03:00:00.000Z",
      updated_at: "2026-05-26T03:00:00.000Z",
      vote_count: 0,
    },
  ];

  await moderatorPage.evaluate((moderationQuestions) => {
    window.dispatchEvent(
      new CustomEvent("qsb-ask:e2e-moderation-refresh", { detail: { moderationQuestions } }),
    );
  }, questions);

  await expect(moderatorPage.getByRole("tab", { name: "Pending 1" })).toBeVisible({ timeout: 2000 });
  await expect(moderatorPage.getByText("Pending private realtime question")).toBeVisible({ timeout: 2000 });
  await expect(audiencePage.getByText("Pending private realtime question")).toHaveCount(0);
});
