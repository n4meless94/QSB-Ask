"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type SurveyConnectionState = "live" | "reconnecting" | "offline" | "refresh-needed";

type SurveyResultsSubscriptionOptions = {
  eventId: string;
  onConnectionChange?: (state: SurveyConnectionState) => void;
  onRefresh: () => void;
  reconnectTimeoutMs?: number;
  refreshIntervalMs?: number;
  surveyId: string;
};

const DEFAULT_RECONNECT_TIMEOUT_MS = 30_000;

function createConnectionMonitor(
  onConnectionChange: ((state: SurveyConnectionState) => void) | undefined,
  reconnectTimeoutMs: number,
) {
  let reconnectTimer: ReturnType<typeof globalThis.setTimeout> | undefined;
  let currentState: SurveyConnectionState | undefined;

  function browserIsOnline() {
    return typeof globalThis.navigator === "undefined" || globalThis.navigator.onLine !== false;
  }

  function clearReconnectTimer() {
    if (reconnectTimer === undefined) return;
    globalThis.clearTimeout(reconnectTimer);
    reconnectTimer = undefined;
  }

  function emit(state: SurveyConnectionState) {
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

export function subscribeToSurveyResults({
  eventId,
  onConnectionChange,
  onRefresh,
  reconnectTimeoutMs = DEFAULT_RECONNECT_TIMEOUT_MS,
  refreshIntervalMs = 2000,
  surveyId,
}: SurveyResultsSubscriptionOptions) {
  const supabase = createSupabaseBrowserClient();
  const connection = createConnectionMonitor(onConnectionChange, reconnectTimeoutMs);
  const interval = globalThis.setInterval(onRefresh, refreshIntervalMs);
  const channel = supabase
    .channel(`qsb-ask-survey-results-${eventId}-${surveyId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        filter: `id=eq.${surveyId}`,
        schema: "public",
        table: "surveys",
      },
      () => onRefresh(),
    );

  channel.subscribe((status) => connection.handleStatus(status));

  return () => {
    connection.cleanup();
    globalThis.clearInterval(interval);
    void supabase.removeChannel(channel);
  };
}
