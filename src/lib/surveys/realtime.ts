"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type SurveyConnectionState = "live" | "reconnecting" | "refresh-needed";

type SurveyResultsSubscriptionOptions = {
  eventId: string;
  onConnectionChange?: (state: SurveyConnectionState) => void;
  onRefresh: () => void;
  surveyId: string;
};

export function subscribeToSurveyResults({
  eventId,
  onConnectionChange,
  onRefresh,
  surveyId,
}: SurveyResultsSubscriptionOptions) {
  const supabase = createSupabaseBrowserClient();
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
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        filter: `survey_id=eq.${surveyId}`,
        schema: "public",
        table: "survey_responses",
      },
      () => onRefresh(),
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "survey_answers",
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
    void supabase.removeChannel(channel);
  };
}
