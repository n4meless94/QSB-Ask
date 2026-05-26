import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  archiveEventAction,
  closeEventAction,
  updateEventSettingsAction,
} from "@/app/(app)/events/[eventId]/settings-actions";
import { archiveEvent, closeEvent, updateEventSettings } from "@/lib/events/settings";
import { assertEventRole } from "@/lib/events/access";

const revalidatePathMock = vi.hoisted(() => vi.fn());
const getUserMock = vi.hoisted(() => vi.fn());
const fromMock = vi.hoisted(() => vi.fn());
const assertEventRoleMock = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/lib/events/access", async () => {
  const actual = await vi.importActual<typeof import("@/lib/events/access")>("@/lib/events/access");

  return {
    ...actual,
    assertEventRole: assertEventRoleMock,
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser: getUserMock,
    },
    from: fromMock,
  })),
}));

function form(values: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}

function validSettings(overrides: Record<string, string> = {}) {
  return {
    name: "Quarterly Briefing Updated",
    starts_at: "2099-06-01T09:30",
    time_zone: "Asia/Kuala_Lumpur",
    identity_mode: "name_email_required",
    moderation_enabled: "true",
    question_character_limit: "500",
    duplicate_block_enabled: "true",
    question_rate_limit_seconds: "45",
    ...overrides,
  };
}

function makeEventsQuery() {
  const calls: unknown[] = [];
  const single = vi.fn(async () => ({
    data: {
      id: "event-1",
      name: "Quarterly Briefing Updated",
      join_code: "QSB2X9ZA",
      starts_at: "2099-06-01T01:30:00.000Z",
      time_zone: "Asia/Kuala_Lumpur",
      status: "active",
      identity_mode: "name_email_required",
      moderation_enabled: true,
      question_character_limit: 500,
      duplicate_block_enabled: true,
      question_rate_limit_seconds: 45,
      created_by: "organiser-1",
    },
    error: null,
  }));
  const select = vi.fn(() => ({ single }));
  const eq = vi.fn(() => ({ select }));
  const update = vi.fn((payload: unknown) => {
    calls.push(payload);
    return { eq };
  });

  return { calls, eq, select, single, update };
}

describe("event settings helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertEventRoleMock.mockResolvedValue({
      event: { id: "event-1", created_by: "organiser-1", join_code: "QSB2X9ZA" },
      role: "organiser",
    });
  });

  it("updates organiser event details and question rules after an organiser role check", async () => {
    const eventsQuery = makeEventsQuery();
    fromMock.mockReturnValue(eventsQuery);

    await updateEventSettings("organiser-1", "event-1", validSettings());

    expect(assertEventRole).toHaveBeenCalledWith("organiser-1", "event-1", ["organiser"]);
    expect(eventsQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        duplicate_block_enabled: true,
        identity_mode: "name_email_required",
        moderation_enabled: true,
        name: "Quarterly Briefing Updated",
        question_character_limit: 500,
        question_rate_limit_seconds: 45,
        time_zone: "Asia/Kuala_Lumpur",
      }),
    );
  });

  it("rejects question limit, rate limit, and moderation-off without warning acknowledgement", async () => {
    await expect(
      updateEventSettings(
        "organiser-1",
        "event-1",
        validSettings({
          moderation_enabled: "false",
          question_character_limit: "49",
          question_rate_limit_seconds: "301",
        }),
      ),
    ).rejects.toThrow("Fix the highlighted fields and try again.");
  });

  it("close and archive preserve records by updating event status only", async () => {
    const eventsQuery = makeEventsQuery();
    fromMock.mockReturnValue(eventsQuery);

    await closeEvent("organiser-1", "event-1");
    await archiveEvent("organiser-1", "event-1");

    expect(eventsQuery.update).toHaveBeenNthCalledWith(1, { status: "ended" });
    expect(eventsQuery.update).toHaveBeenNthCalledWith(2, { status: "archived" });
    expect(assertEventRole).toHaveBeenCalledTimes(2);
  });
});

describe("event settings actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserMock.mockResolvedValue({
      data: { user: { id: "organiser-1", email: "organiser@qsb.com" } },
      error: null,
    });
    assertEventRoleMock.mockResolvedValue({
      event: { id: "event-1", created_by: "organiser-1", join_code: "QSB2X9ZA" },
      role: "organiser",
    });
  });

  it("returns field errors for invalid settings form data", async () => {
    const result = await updateEventSettingsAction(
      "event-1",
      form(validSettings({ question_character_limit: "1001" })),
    );

    expect(result.ok).toBe(false);
    expect(result.fieldErrors?.question_character_limit).toBe(
      "Question character limit must be between 50 and 1000.",
    );
  });

  it("updates settings and lifecycle actions for signed-in organisers", async () => {
    const eventsQuery = makeEventsQuery();
    fromMock.mockReturnValue(eventsQuery);

    await expect(updateEventSettingsAction("event-1", form(validSettings()))).resolves.toMatchObject({
      ok: true,
      message: "Event settings saved.",
    });
    await expect(closeEventAction("event-1")).resolves.toMatchObject({
      ok: true,
      message: "Event closed.",
    });
    await expect(archiveEventAction("event-1")).resolves.toMatchObject({
      ok: true,
      message: "Event archived.",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/events/event-1");
  });
});
