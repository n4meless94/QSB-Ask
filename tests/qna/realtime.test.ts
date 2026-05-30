import { beforeEach, describe, expect, it, vi } from "vitest";

import { subscribeToModeratorQuestions, subscribeToPublicQuestions } from "@/lib/qna/realtime";

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

describe("qna realtime subscriptions", () => {
  let browserEvents: EventTarget;
  let subscribeCallback: ((status: string) => void) | undefined;
  let addEventListenerMock: ReturnType<typeof vi.fn>;
  let removeEventListenerMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    browserEvents = new EventTarget();
    addEventListenerMock = vi.fn((type: string, listener: EventListenerOrEventListenerObject) => {
      browserEvents.addEventListener(type, listener);
    });
    removeEventListenerMock = vi.fn((type: string, listener: EventListenerOrEventListenerObject) => {
      browserEvents.removeEventListener(type, listener);
    });
    vi.stubGlobal("addEventListener", addEventListenerMock);
    vi.stubGlobal("removeEventListener", removeEventListenerMock);
    vi.stubGlobal("navigator", { onLine: true });

    const channel = {
      on: onMock,
      subscribe: subscribeMock,
    };

    channelMock.mockReturnValue(channel);
    onMock.mockReturnValue(channel);
    subscribeMock.mockImplementation((callback?: (status: string) => void) => {
      subscribeCallback = callback;
      return channel;
    });
  });

  it("uses realtime payloads as refresh triggers only", () => {
    const onRefresh = vi.fn();
    const onConnectionChange = vi.fn();

    const unsubscribe = subscribeToPublicQuestions({
      eventId: "event-1",
      onConnectionChange,
      onRefresh,
    });

    expect(channelMock).toHaveBeenCalledWith("qsb-ask-qna-public-event-1");
    expect(onMock).toHaveBeenCalledWith(
      "postgres_changes",
      {
        event: "*",
        filter: "event_id=eq.event-1",
        schema: "public",
        table: "questions",
      },
      expect.any(Function),
    );

    const questionCallback = onMock.mock.calls.find((call) => call[1]?.table === "questions")?.[2] as
      | (() => void)
      | undefined;
    questionCallback?.();

    expect(onRefresh).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("exposes live, reconnecting, offline, and refresh-needed states", () => {
    const onConnectionChange = vi.fn();

    subscribeToModeratorQuestions({
      eventId: "event-1",
      onConnectionChange,
      onRefresh: vi.fn(),
      reconnectTimeoutMs: 1000,
    });

    subscribeCallback?.("SUBSCRIBED");
    subscribeCallback?.("CLOSED");
    browserEvents.dispatchEvent(new Event("offline"));
    browserEvents.dispatchEvent(new Event("online"));
    vi.advanceTimersByTime(1000);

    expect(onConnectionChange).toHaveBeenCalledWith("live");
    expect(onConnectionChange).toHaveBeenCalledWith("reconnecting");
    expect(onConnectionChange).toHaveBeenCalledWith("offline");
    expect(onConnectionChange).toHaveBeenCalledWith("refresh-needed");
  });

  it("escalates closed and interrupted channels only after the prolonged reconnect timeout", () => {
    const onConnectionChange = vi.fn();

    subscribeToPublicQuestions({
      eventId: "event-1",
      onConnectionChange,
      onRefresh: vi.fn(),
      reconnectTimeoutMs: 1000,
    });

    subscribeCallback?.("CLOSED");
    expect(onConnectionChange).toHaveBeenLastCalledWith("reconnecting");
    expect(onConnectionChange).not.toHaveBeenCalledWith("refresh-needed");

    vi.advanceTimersByTime(999);
    expect(onConnectionChange).not.toHaveBeenCalledWith("refresh-needed");

    vi.advanceTimersByTime(1);
    expect(onConnectionChange).toHaveBeenLastCalledWith("refresh-needed");

    subscribeCallback?.("CHANNEL_ERROR");
    expect(onConnectionChange).toHaveBeenLastCalledWith("reconnecting");
  });

  it("surfaces browser offline state and allows online recovery", () => {
    const onConnectionChange = vi.fn();

    subscribeToPublicQuestions({
      eventId: "event-1",
      onConnectionChange,
      onRefresh: vi.fn(),
      reconnectTimeoutMs: 1000,
    });

    browserEvents.dispatchEvent(new Event("offline"));
    browserEvents.dispatchEvent(new Event("online"));
    subscribeCallback?.("SUBSCRIBED");

    expect(onConnectionChange).toHaveBeenNthCalledWith(1, "offline");
    expect(onConnectionChange).toHaveBeenNthCalledWith(2, "reconnecting");
    expect(onConnectionChange).toHaveBeenNthCalledWith(3, "live");
  });

  it("cleans up timers, event listeners, and the realtime channel", () => {
    const onConnectionChange = vi.fn();

    const unsubscribe = subscribeToPublicQuestions({
      eventId: "event-1",
      onConnectionChange,
      onRefresh: vi.fn(),
      reconnectTimeoutMs: 1000,
    });

    subscribeCallback?.("CLOSED");
    unsubscribe();
    vi.advanceTimersByTime(1000);

    expect(onConnectionChange).not.toHaveBeenCalledWith("refresh-needed");
    expect(removeEventListenerMock).toHaveBeenCalledWith("offline", expect.any(Function));
    expect(removeEventListenerMock).toHaveBeenCalledWith("online", expect.any(Function));
    expect(removeChannelMock).toHaveBeenCalled();
  });
});
