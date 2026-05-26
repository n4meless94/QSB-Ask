import { beforeEach, describe, expect, it, vi } from "vitest";

import { voteQuestionAction } from "@/app/join/[joinCode]/qna/vote-actions";
import { listPublicQuestions } from "@/lib/qna/public";
import { upvoteQuestion } from "@/lib/qna/voting";
import { PUBLIC_QUESTION_STATUSES } from "@/lib/supabase/rls";

const cookiesGetMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());
const fromMock = vi.hoisted(() => vi.fn());
const rpcMock = vi.hoisted(() => vi.fn());
const validateParticipantSessionMock = vi.hoisted(() => vi.fn());
const getParticipantCookieNameMock = vi.hoisted(() => vi.fn((eventId: string) => `qsb_ask_participant_${eventId}`));

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: cookiesGetMock,
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}));

vi.mock("@/lib/participants/session", async () => {
  const actual = await vi.importActual<typeof import("@/lib/participants/session")>(
    "@/lib/participants/session",
  );

  return {
    ...actual,
    getParticipantCookieName: getParticipantCookieNameMock,
    validateParticipantSession: validateParticipantSessionMock,
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    from: fromMock,
    rpc: rpcMock,
  })),
}));

const votedQuestion = {
  current_text: "Can we share slides?",
  event_id: "event-1",
  id: "question-live",
  is_edited: false,
  participant_session_id: "participant-session-other",
  previous_status: null,
  status: "live",
  submitted_at: "2026-05-26T00:00:00.000Z",
  updated_at: "2026-05-26T00:00:00.000Z",
  vote_count: 4,
};

function questionsQuery(publicStatusFilters: unknown[], orders: unknown[]) {
  const query = {
    eq: vi.fn(() => query),
    in: vi.fn((column: string, values: unknown[]) => {
      publicStatusFilters.push({ column, values });
      return query;
    }),
    order: vi.fn((column: string, options: unknown) => {
      orders.push({ column, options });
      return query;
    }),
    then: (resolve: (value: unknown) => void) =>
      resolve({
        data: [
          {
            current_text: "Popular approved question",
            id: "question-popular",
            is_edited: false,
            status: "live",
            submitted_at: "2026-05-26T00:00:00.000Z",
            updated_at: "2026-05-26T00:00:00.000Z",
            vote_count: 5,
          },
        ],
        error: null,
      }),
  };

  return {
    select: vi.fn(() => query),
  };
}

describe("audience voting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateParticipantSessionMock.mockResolvedValue({
      event_id: "event-1",
      id: "participant-session-1",
    });
    rpcMock.mockResolvedValue({ data: [{ already_voted: false, question: votedQuestion }], error: null });
  });

  it("upvotes live questions through the participant session and returns updated vote count", async () => {
    const result = await upvoteQuestion("event-1", "raw-token", "question-live");

    expect(validateParticipantSessionMock).toHaveBeenCalledWith("event-1", "raw-token");
    expect(rpcMock).toHaveBeenCalledWith("upvote_question", {
      target_event_id: "event-1",
      target_participant_session_id: "participant-session-1",
      target_question_id: "question-live",
    });
    expect(result).toEqual({
      alreadyVoted: false,
      question: votedQuestion,
    });
  });

  it("treats unique vote collisions as already-voted without requiring another increment", async () => {
    rpcMock.mockResolvedValueOnce({ data: [{ already_voted: true, question: votedQuestion }], error: null });

    await expect(upvoteQuestion("event-1", "raw-token", "question-live")).resolves.toMatchObject({
      alreadyVoted: true,
      question: { id: "question-live", vote_count: 4 },
    });
  });

  it("rejects non-live or missing questions and invalid sessions", async () => {
    validateParticipantSessionMock.mockRejectedValueOnce(new Error("Participant session is invalid."));
    await expect(upvoteQuestion("event-1", "bad-token", "question-live")).rejects.toThrow(
      "Participant session is invalid.",
    );

    validateParticipantSessionMock.mockResolvedValue({ event_id: "event-1", id: "participant-session-1" });
    rpcMock.mockResolvedValueOnce({ data: [], error: null });
    await expect(upvoteQuestion("event-1", "raw-token", "question-answered")).rejects.toThrow(
      "Only live approved questions can be voted on.",
    );
  });

  it("keeps public reads approved-only and applies Popular or Recent ordering", async () => {
    const publicStatusFilters: unknown[] = [];
    const orders: unknown[] = [];
    fromMock.mockImplementation((table: string) => {
      if (table === "questions") return questionsQuery(publicStatusFilters, orders);
      throw new Error(`Unexpected table: ${table}`);
    });

    await listPublicQuestions("event-1", { sort: "popular" });
    await listPublicQuestions("event-1", { sort: "recent" });

    expect(publicStatusFilters).toEqual([
      { column: "status", values: PUBLIC_QUESTION_STATUSES },
      { column: "status", values: PUBLIC_QUESTION_STATUSES },
    ]);
    expect(orders).toEqual([
      { column: "vote_count", options: { ascending: false } },
      { column: "submitted_at", options: { ascending: false } },
      { column: "submitted_at", options: { ascending: false } },
    ]);
  });
});

describe("vote question action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookiesGetMock.mockReturnValue({ value: "raw-token" });
    validateParticipantSessionMock.mockResolvedValue({
      event_id: "event-1",
      id: "participant-session-1",
    });
    rpcMock.mockResolvedValue({ data: [{ already_voted: false, question: votedQuestion }], error: null });
  });

  it("uses the participant cookie and revalidates the audience Q&A page", async () => {
    const formData = new FormData();
    formData.set("questionId", "question-live");

    const result = await voteQuestionAction("event-1", "QSB2X9ZA", formData);

    expect(getParticipantCookieNameMock).toHaveBeenCalledWith("event-1");
    expect(result).toMatchObject({
      ok: true,
      message: "Vote recorded.",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/join/QSB2X9ZA/qna");
  });
});
