import { beforeEach, describe, expect, it, vi } from "vitest";

import { subscribeToSurveyResults } from "@/lib/surveys/realtime";

const removeChannelMock = vi.hoisted(() => vi.fn());
const subscribeMock = vi.hoisted(() => vi.fn());
const onMock = vi.hoisted(() => vi.fn());
const channelMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: vi.fn(() => ({
    channel: channelMock,
    removeChannel: removeChannelMock,
  })),
}));

describe("survey realtime subscriptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const channel = {
      on: onMock,
      subscribe: subscribeMock,
    };

    channelMock.mockReturnValue(channel);
    onMock.mockReturnValue(channel);
    subscribeMock.mockImplementation((callback?: (status: string) => void) => {
      callback?.("SUBSCRIBED");
      return channel;
    });
  });

  it("does not subscribe browser clients to raw survey response or answer rows", () => {
    const onRefresh = vi.fn();
    const onConnectionChange = vi.fn();

    const unsubscribe = subscribeToSurveyResults({
      eventId: "event-1",
      onConnectionChange,
      onRefresh,
      surveyId: "survey-1",
    });

    expect(channelMock).toHaveBeenCalledWith("qsb-ask-survey-results-event-1-survey-1");
    expect(onMock).toHaveBeenCalledWith(
      "postgres_changes",
      {
        event: "*",
        filter: "id=eq.survey-1",
        schema: "public",
        table: "surveys",
      },
      expect.any(Function),
    );
    expect(onMock.mock.calls.map((call) => call[1]?.table)).not.toContain("survey_responses");
    expect(onMock.mock.calls.map((call) => call[1]?.table)).not.toContain("survey_answers");
    expect(onConnectionChange).toHaveBeenCalledWith("live");

    const surveyCall = onMock.mock.calls.find((call) => call[1]?.table === "surveys");
    const surveyCallback = surveyCall?.[2] as () => void;
    surveyCallback();

    expect(onRefresh).toHaveBeenCalled();
    unsubscribe();
    expect(removeChannelMock).toHaveBeenCalled();
  });
});
