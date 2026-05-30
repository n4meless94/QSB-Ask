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

  it("subscribes to survey response and answer changes as refresh triggers only", () => {
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
        filter: "survey_id=eq.survey-1",
        schema: "public",
        table: "survey_responses",
      },
      expect.any(Function),
    );
    expect(onMock).toHaveBeenCalledWith(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "survey_answers",
      },
      expect.any(Function),
    );
    expect(onConnectionChange).toHaveBeenCalledWith("live");

    const responseCall = onMock.mock.calls.find((call) => call[1]?.table === "survey_responses");
    const answerCall = onMock.mock.calls.find((call) => call[1]?.table === "survey_answers");
    const responseCallback = responseCall?.[2] as () => void;
    const answerCallback = answerCall?.[2] as () => void;
    responseCallback();
    answerCallback();

    expect(onRefresh).toHaveBeenCalledTimes(2);
    unsubscribe();
    expect(removeChannelMock).toHaveBeenCalled();
  });
});
