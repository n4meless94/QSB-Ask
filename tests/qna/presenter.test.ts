import { beforeEach, describe, expect, it, vi } from "vitest";

import { getPresenterQuestions } from "@/lib/qna/presenter";
import { PUBLIC_QUESTION_STATUSES } from "@/lib/supabase/rls";

const getPresenterEventAccessMock = vi.hoisted(() => vi.fn());
const fromMock = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));

vi.mock("@/lib/events/access", async () => {
  const actual = await vi.importActual<typeof import("@/lib/events/access")>("@/lib/events/access");

  return {
    ...actual,
    getPresenterEventAccess: getPresenterEventAccessMock,
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    from: fromMock,
  })),
}));

function questionsQuery(statusFilters: unknown[], selectedColumns: string[]) {
  const query = {
    eq: vi.fn(() => query),
    in: vi.fn((column: string, values: unknown[]) => {
      statusFilters.push({ column, values });
      return query;
    }),
    order: vi.fn(() =>
      Promise.resolve({
        data: [
          {
            current_text: "Approved presenter question",
            id: "question-live",
            is_edited: false,
            status: "live",
            submitted_at: "2026-05-26T00:00:00.000Z",
            updated_at: "2026-05-26T00:00:00.000Z",
            vote_count: 7,
          },
        ],
        error: null,
      }),
    ),
  };

  return {
    select: vi.fn((columns: string) => {
      selectedColumns.push(columns);
      return query;
    }),
  };
}

describe("presenter questions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPresenterEventAccessMock.mockResolvedValue({
      event: {
        id: "event-1",
        name: "Quarterly Briefing",
      },
      role: "speaker",
    });
  });

  it("requires presenter access and selects approved public fields only", async () => {
    const statusFilters: unknown[] = [];
    const selectedColumns: string[] = [];
    fromMock.mockImplementation((table: string) => {
      if (table === "questions") return questionsQuery(statusFilters, selectedColumns);
      throw new Error(`Unexpected table: ${table}`);
    });

    const result = await getPresenterQuestions("speaker-1", "event-1");

    expect(getPresenterEventAccessMock).toHaveBeenCalledWith("speaker-1", "event-1");
    expect(selectedColumns[0]).toBe("id,current_text,status,vote_count,is_edited,submitted_at,updated_at");
    expect(statusFilters[0]).toEqual({ column: "status", values: PUBLIC_QUESTION_STATUSES });
    expect(result.questions).toEqual([
      {
        current_text: "Approved presenter question",
        id: "question-live",
        is_edited: false,
        status: "live",
        submitted_at: "2026-05-26T00:00:00.000Z",
        updated_at: "2026-05-26T00:00:00.000Z",
        vote_count: 7,
      },
    ]);
  });

  it("denies unassigned users before loading question rows", async () => {
    getPresenterEventAccessMock.mockRejectedValueOnce(new Error("You do not have access to this event."));

    await expect(getPresenterQuestions("outsider-1", "event-1")).rejects.toThrow(
      "You do not have access to this event.",
    );
    expect(fromMock).not.toHaveBeenCalled();
  });
});
