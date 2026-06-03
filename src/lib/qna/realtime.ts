"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type QnaConnectionState = "live" | "reconnecting" | "offline" | "refresh-needed";

type SubscriptionOptions = {
  eventId: string;
  onConnectionChange?: (state: QnaConnectionState) => void;
  onRefresh: () => void;
  refreshIntervalMs?: number;
  reconnectTimeoutMs?: number;
};

const DEFAULT_RECONNECT_TIMEOUT_MS = 30_000;

function createConnectionMonitor(
  onConnectionChange: ((state: QnaConnectionState) => void) | undefined,
  reconnectTimeoutMs: number,
) {
  let reconnectTimer: ReturnType<typeof globalThis.setTimeout> | undefined;
  let currentState: QnaConnectionState | undefined;

  function browserIsOnline() {
    return typeof globalThis.navigator === "undefined" || globalThis.navigator.onLine !== false;
  }

  function clearReconnectTimer() {
    if (reconnectTimer === undefined) return;
    globalThis.clearTimeout(reconnectTimer);
    reconnectTimer = undefined;
  }

  function emit(state: QnaConnectionState) {
    if (currentState === state) return;
    currentState = state;
    onConnectionChange?.(state);
  }

  function scheduleRefreshNeeded() {
    clearReconnectTimer();
    reconnectTimer = globalThis.setTimeout(() => {
      reconnectTimer = undefined;
      if (browserIsOnline()) {
        emit("refresh-needed");
      }
    }, reconnectTimeoutMs);
  }

  function reconnect() {
    if (!browserIsOnline()) {
      clearReconnectTimer();
      emit("offline");
      return;
    }

    emit("reconnecting");
    scheduleRefreshNeeded();
  }

  function handleOnline() {
    reconnect();
  }

  function handleOffline() {
    clearReconnectTimer();
    emit("offline");
  }

  if (typeof globalThis.addEventListener === "function") {
    globalThis.addEventListener("online", handleOnline);
    globalThis.addEventListener("offline", handleOffline);
  }

  if (!browserIsOnline()) {
    emit("offline");
  }

  return {
    cleanup() {
      clearReconnectTimer();
      if (typeof globalThis.removeEventListener === "function") {
        globalThis.removeEventListener("online", handleOnline);
        globalThis.removeEventListener("offline", handleOffline);
      }
    },
    handleStatus(status: string) {
      if (status === "SUBSCRIBED") {
        clearReconnectTimer();
        emit(browserIsOnline() ? "live" : "offline");
        return;
      }

      if (status === "CLOSED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        reconnect();
      }
    },
  };
}

function subscribeToQuestionChanges({
  eventId,
  includeModerationHistory,
  onConnectionChange,
  onRefresh,
  refreshIntervalMs,
  reconnectTimeoutMs = DEFAULT_RECONNECT_TIMEOUT_MS,
}: SubscriptionOptions & { includeModerationHistory: boolean }) {
  const supabase = createSupabaseBrowserClient();
  const connection = createConnectionMonitor(onConnectionChange, reconnectTimeoutMs);
  const interval =
    refreshIntervalMs && refreshIntervalMs > 0
      ? globalThis.setInterval(onRefresh, refreshIntervalMs)
      : undefined;
  const channel = supabase
    .channel(`qsb-ask-qna-${includeModerationHistory ? "staff" : "public"}-${eventId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        filter: `event_id=eq.${eventId}`,
        schema: "public",
        table: "questions",
      },
      () => onRefresh(),
    );

  if (includeModerationHistory) {
    channel.on(
      "postgres_changes",
      {
        event: "*",
        filter: `event_id=eq.${eventId}`,
        schema: "public",
        table: "moderation_actions",
      },
      () => onRefresh(),
    );
  }

  channel.subscribe((status) => connection.handleStatus(status));

  return () => {
    connection.cleanup();
    if (interval !== undefined) {
      globalThis.clearInterval(interval);
    }
    void supabase.removeChannel(channel);
  };
}

export function subscribeToModeratorQuestions(options: SubscriptionOptions) {
  return subscribeToQuestionChanges({ ...options, includeModerationHistory: true });
}

export function subscribeToPublicQuestions(options: SubscriptionOptions) {
  return subscribeToQuestionChanges({ ...options, includeModerationHistory: false });
}
