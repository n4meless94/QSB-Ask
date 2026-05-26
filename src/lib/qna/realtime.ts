"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type QnaConnectionState = "live" | "reconnecting" | "refresh-needed";

type SubscriptionOptions = {
  eventId: string;
  onConnectionChange?: (state: QnaConnectionState) => void;
  onRefresh: () => void;
};

function subscribeToQuestionChanges({
  eventId,
  includeModerationHistory,
  onConnectionChange,
  onRefresh,
}: SubscriptionOptions & { includeModerationHistory: boolean }) {
  const supabase = createSupabaseBrowserClient();
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

export function subscribeToModeratorQuestions(options: SubscriptionOptions) {
  return subscribeToQuestionChanges({ ...options, includeModerationHistory: true });
}

export function subscribeToPublicQuestions(options: SubscriptionOptions) {
  return subscribeToQuestionChanges({ ...options, includeModerationHistory: false });
}
