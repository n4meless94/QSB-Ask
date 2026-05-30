"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type SurveyConnectionState = "live" | "reconnecting" | "refresh-needed";

type SurveyResultsSubscriptionOptions = {
  eventId: string;
  onConnectionChange?: (state: SurveyConnectionState) => void;
  onRefresh: () => void;
  refreshIntervalMs?: number;
  surveyId: string;
};

export function subscribeToSurveyResults({
  eventId,
  onConnectionChange,
  onRefresh,
  refreshIntervalMs = 2000,
  surveyId,
}: SurveyResultsSubscriptionOptions) {
  const supabase = createSupabaseBrowserClient();
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

  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      onConnectionChange?.("live");
      return;
    }

    if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
      onConnectionChange?.("refresh-needed");
      return;
    }

    if (status === "CLOSED") {
      onConnectionChange?.("reconnecting");
    }
  });

  return () => {
    globalThis.clearInterval(interval);
    void supabase.removeChannel(channel);
  };
}
