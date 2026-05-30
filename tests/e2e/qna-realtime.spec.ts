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

test("audience and presenter realtime updates use approved-only payloads", async ({ context }) => {
  const audiencePage = await context.newPage();
  const presenterPage = await context.newPage();

  await audiencePage.goto("/join/QSB2X9ZA/qna");
  await presenterPage.goto("/events/event-1/presenter");

  await expect(audiencePage.getByText("Pending private realtime question")).toHaveCount(0);
  await expect(presenterPage.getByText("Pending private realtime question")).toHaveCount(0);

  const approvedQuestions = [
    {
      current_text: "Approved realtime question",
      id: "question-realtime",
      is_edited: false,
      status: "live",
      submitted_at: "2026-05-26T03:00:00.000Z",
      updated_at: "2026-05-26T03:00:00.000Z",
      vote_count: 1,
    },
  ];

  await audiencePage.evaluate((questions) => {
    window.dispatchEvent(new CustomEvent("qsb-ask:e2e-qna-refresh", { detail: { questions } }));
  }, approvedQuestions);
  await presenterPage.evaluate((questions) => {
    window.dispatchEvent(new CustomEvent("qsb-ask:e2e-qna-refresh", { detail: { questions } }));
  }, approvedQuestions);

  await expect(audiencePage.getByText("Approved realtime question")).toBeVisible({ timeout: 2000 });
  await expect(presenterPage.getByText("Approved realtime question")).toBeVisible({ timeout: 2000 });

  const answeredQuestions = [
    {
      ...approvedQuestions[0],
      status: "answered",
      vote_count: 2,
    },
  ];

  await audiencePage.evaluate((questions) => {
    window.dispatchEvent(new CustomEvent("qsb-ask:e2e-qna-refresh", { detail: { questions } }));
  }, answeredQuestions);
  await presenterPage.evaluate((questions) => {
    window.dispatchEvent(new CustomEvent("qsb-ask:e2e-qna-refresh", { detail: { questions } }));
  }, answeredQuestions);

  await expect(audiencePage.getByText("2 votes")).toBeVisible({ timeout: 2000 });
  await expect(audiencePage.getByText("Answered", { exact: true })).toBeVisible({ timeout: 2000 });
  await expect(presenterPage.getByText("2 votes")).toBeVisible({ timeout: 2000 });
  await expect(presenterPage.getByText("Answered", { exact: true })).toBeVisible({ timeout: 2000 });

  await audiencePage.evaluate(() => {
    window.dispatchEvent(new CustomEvent("qsb-ask:e2e-qna-refresh", { detail: { questions: [] } }));
  });
  await presenterPage.evaluate(() => {
    window.dispatchEvent(new CustomEvent("qsb-ask:e2e-qna-refresh", { detail: { questions: [] } }));
  });

  await expect(audiencePage.getByText("Approved realtime question")).toHaveCount(0, { timeout: 2000 });
  await expect(presenterPage.getByText("Approved realtime question")).toHaveCount(0, { timeout: 2000 });
});

test("audience and presenter show offline and refresh-needed reconnect actions without raw payloads", async ({
  context,
}) => {
  const audiencePage = await context.newPage();
  const presenterPage = await context.newPage();

  await audiencePage.goto("/join/QSB2X9ZA/qna");
  await presenterPage.goto("/events/event-1/presenter");

  await audiencePage.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent("qsb-ask:e2e-qna-connection", {
        detail: {
          rawPayload: "Pending private realtime question",
          state: "offline",
        },
      }),
    );
  });
  await presenterPage.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent("qsb-ask:e2e-qna-connection", {
        detail: {
          rawPayload: "Pending private realtime question",
          state: "refresh-needed",
        },
      }),
    );
  });

  await expect(
    audiencePage.getByText("You are offline. Live updates will resume when the connection returns."),
  ).toBeVisible();
  await expect(
    presenterPage.getByText("Live updates are not reconnecting. Refresh this view to continue."),
  ).toBeVisible();
  await expect(presenterPage.getByRole("button", { name: "Refresh view" })).toBeVisible();
  await presenterPage.getByRole("button", { name: "Refresh view" }).focus();
  await expect(presenterPage.getByRole("button", { name: "Refresh view" })).toBeFocused();

  await expect(audiencePage.getByText("Pending private realtime question")).toHaveCount(0);
  await expect(presenterPage.getByText("Pending private realtime question")).toHaveCount(0);
});
