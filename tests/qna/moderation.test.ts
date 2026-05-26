import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  archiveQuestion,
  approveQuestion,
  dismissQuestion,
  editQuestion,
  listModerationQuestions,
  markQuestionAnswered,
  restoreQuestion,
  STALE_MODERATION_MESSAGE,
} from "@/lib/qna/moderation";
import { listPublicQuestions } from "@/lib/qna/public";
import { PUBLIC_QUESTION_STATUSES } from "@/lib/supabase/rls";

const assertEventRoleMock = vi.hoisted(() => vi.fn());
const fromMock = vi.hoisted(() => vi.fn());
const rpcMock = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));

vi.mock("@/lib/events/access", () => ({
  assertEventRole: assertEventRoleMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    from: fromMock,
    rpc: rpcMock,
  })),
}));

const pendingQuestion = {
  current_text: "Will slides be shared?",
  event_id: "event-1",
  id: "question-1",
  is_edited: false,
  participant_session_id: "session-1",
  previous_status: null,
  status: "pending",
  submitted_at: "2026-05-26T01:00:00.000Z",
  updated_at: "2026-05-26T01:00:00.000Z",
  vote_count: 2,
  participant_sessions: {
    display_name: "Aina",
    email: "aina@qsb.com",
  },
};

function makeModerationListQuery() {
  const calls: Array<{ name: string; args: unknown[] }> = [];
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn((...args: unknown[]) => {
      calls.push({ name: "eq", args });
      return chain;
    }),
    ilike: vi.fn((...args: unknown[]) => {
      calls.push({ name: "ilike", args });
      return chain;
    }),
    order: vi.fn((...args: unknown[]) => {
      calls.push({ name: "order", args });
      return chain;
    }),
    then: (resolve: (value: unknown) => void) =>
      Promise.resolve({ data: [pendingQuestion], error: null }).then(resolve),
  };

  return { calls, chain };
}

function makePublicQuery() {
  const publicStatusFilters: unknown[] = [];
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    in: vi.fn((column: string, values: unknown[]) => {
      publicStatusFilters.push({ column, values });
      return chain;
    }),
    order: vi.fn(() => Promise.resolve({ data: [], error: null })),
  };

  return { chain, publicStatusFilters };
}

function makeQueries() {
  const moderationList = makeModerationListQuery();
  const publicQuery = makePublicQuery();

  fromMock.mockImplementation((table: string) => {
    if (table === "questions") {
      return moderationList.chain;
    }

    throw new Error(`Unexpected table: ${table}`);
  });

  return { moderationList, publicQuery };
}

function expectModerationRpc(action: string, toStatus: string | null, metadata?: Record<string, unknown>) {
  expect(rpcMock).toHaveBeenLastCalledWith(
    "moderate_question_action",
    expect.objectContaining({
      action_metadata: metadata ?? {},
      actor_user_id: "moderator-1",
      expected_status: "pending",
      expected_updated_at: "2026-05-26T01:00:00.000Z",
      moderation_action: action,
      target_event_id: "event-1",
      target_question_id: "question-1",
      target_status: toStatus,
    }),
  );
}

describe("moderation queue helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertEventRoleMock.mockResolvedValue({ role: "moderator" });
    rpcMock.mockResolvedValue({ data: [{ ...pendingQuestion, status: "live" }], error: null });
  });

  it("requires organiser/moderator access and searches question text only", async () => {
    const queries = makeQueries();

    const questions = await listModerationQuestions("moderator-1", "event-1", {
      search: "slides",
      sort: "most_recent",
      status: "pending",
    });

    expect(assertEventRoleMock).toHaveBeenCalledWith("moderator-1", "event-1", [
      "organiser",
      "moderator",
    ]);
    expect(questions[0]).toMatchObject({
      id: "question-1",
      participantIdentity: "Aina",
      status: "pending",
    });
    expect(queries.moderationList.calls).toContainEqual({
      name: "ilike",
      args: ["current_text", "%slides%"],
    });
  });

  it("sorts moderation questions by newest, oldest, or most votes", async () => {
    const recent = makeQueries();
    await listModerationQuestions("moderator-1", "event-1", {
      sort: "most_recent",
      status: "pending",
    });
    expect(recent.moderationList.calls).toContainEqual({
      name: "order",
      args: ["submitted_at", { ascending: false }],
    });

    const oldest = makeQueries();
    await listModerationQuestions("moderator-1", "event-1", {
      sort: "oldest",
      status: "pending",
    });
    expect(oldest.moderationList.calls).toContainEqual({
      name: "order",
      args: ["submitted_at", { ascending: true }],
    });

    const votes = makeQueries();
    await listModerationQuestions("moderator-1", "event-1", {
      sort: "most_votes",
      status: "pending",
    });
    expect(votes.moderationList.calls).toContainEqual({
      name: "order",
      args: ["vote_count", { ascending: false }],
    });
  });

  it("keeps public reads approved-only after staff actions", async () => {
    const publicQuery = makePublicQuery();
    fromMock.mockImplementation((table: string) => {
      if (table === "questions") {
        return publicQuery.chain;
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    await listPublicQuestions("event-1");

    expect(publicQuery.publicStatusFilters[0]).toEqual({
      column: "status",
      values: PUBLIC_QUESTION_STATUSES,
    });
  });
});

describe("moderation actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertEventRoleMock.mockResolvedValue({ role: "moderator" });
    rpcMock.mockResolvedValue({ data: [{ ...pendingQuestion, status: "live" }], error: null });
  });

  const expected = {
    expectedStatus: "pending" as const,
    expectedUpdatedAt: "2026-05-26T01:00:00.000Z",
  };

  it("approves pending questions to live with an audit action", async () => {
    await approveQuestion("moderator-1", "event-1", "question-1", expected);

    expectModerationRpc("approve", "live");
  });

  it("dismisses allowed questions to archived and records dismiss metadata", async () => {
    await dismissQuestion("moderator-1", "event-1", "question-1", expected);

    expectModerationRpc("dismiss", "archived", { dismissed: true });
  });

  it("archives and restores using previous status", async () => {
    await archiveQuestion("moderator-1", "event-1", "question-1", expected);

    expectModerationRpc("archive", "archived");

    rpcMock.mockResolvedValueOnce({ data: [{ ...pendingQuestion, status: "live" }], error: null });
    await restoreQuestion("moderator-1", "event-1", "question-1", {
      expectedStatus: "archived",
      expectedUpdatedAt: "2026-05-26T01:01:00.000Z",
    });

    expect(rpcMock).toHaveBeenLastCalledWith(
      "moderate_question_action",
      expect.objectContaining({
        expected_status: "archived",
        moderation_action: "restore",
        target_status: null,
      }),
    );
  });

  it("marks live questions answered", async () => {
    await markQuestionAnswered("moderator-1", "event-1", "question-1", {
      expectedStatus: "live",
      expectedUpdatedAt: "2026-05-26T01:00:00.000Z",
    });

    expect(rpcMock).toHaveBeenLastCalledWith(
      "moderate_question_action",
      expect.objectContaining({
        expected_status: "live",
        moderation_action: "mark_answered",
        target_status: "answered",
      }),
    );
  });

  it("edits text through the version-preserving RPC", async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ ...pendingQuestion, current_text: "Will slides be shared after the briefing?", is_edited: true }],
      error: null,
    });

    await editQuestion("moderator-1", "event-1", "question-1", {
      ...expected,
      nextText: " Will slides be shared after the briefing? ",
    });

    expect(rpcMock).toHaveBeenLastCalledWith(
      "edit_question_action",
      expect.objectContaining({
        actor_user_id: "moderator-1",
        expected_status: "pending",
        expected_updated_at: "2026-05-26T01:00:00.000Z",
        next_text: "Will slides be shared after the briefing?",
        target_event_id: "event-1",
        target_question_id: "question-1",
      }),
    );
  });

  it("returns the exact stale-state error when expected status or timestamp no longer matches", async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null });

    await expect(approveQuestion("moderator-1", "event-1", "question-1", expected)).rejects.toThrow(
      STALE_MODERATION_MESSAGE,
    );
  });
});
