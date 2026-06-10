"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type PresenterFocusMessage = {
  eventId: string;
  questionId: string;
  sentAt: number;
};

const CHANNEL_NAME = "qsb-ask:presenter-control";

function storageKey(eventId: string) {
  return `${CHANNEL_NAME}:${eventId}`;
}

function isPresenterFocusMessage(value: unknown): value is PresenterFocusMessage {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<PresenterFocusMessage>;
  return (
    typeof candidate.eventId === "string" &&
    typeof candidate.questionId === "string" &&
    typeof candidate.sentAt === "number"
  );
}

function parseMessage(value: string | null) {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);
    return isPresenterFocusMessage(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function createClientOrNull() {
  try {
    return createSupabaseBrowserClient();
  } catch {
    return null;
  }
}

function publishLocalFocus(message: PresenterFocusMessage) {
  globalThis.localStorage?.setItem(storageKey(message.eventId), JSON.stringify(message));
  globalThis.dispatchEvent(new CustomEvent(CHANNEL_NAME, { detail: message }));

  if ("BroadcastChannel" in globalThis) {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(message);
    channel.close();
  }
}

export function publishPresenterFocus(eventId: string, questionId: string) {
  const message: PresenterFocusMessage = {
    eventId,
    questionId,
    sentAt: Date.now(),
  };

  publishLocalFocus(message);

  const supabase = createClientOrNull();
  if (!supabase) return;

  void supabase.auth.getUser().then(({ data }) => {
    if (!data.user) return;

    void supabase.from("event_presenter_state").upsert(
      {
        event_id: eventId,
        focused_question_id: questionId,
        updated_at: new Date(message.sentAt).toISOString(),
        updated_by: data.user.id,
      },
      { onConflict: "event_id" },
    );
  });
}

export function subscribeToPresenterFocus(
  eventId: string,
  onFocus: (questionId: string) => void,
) {
  const supabase = createClientOrNull();

  function applyMessage(message: PresenterFocusMessage | null) {
    if (message?.eventId === eventId) {
      onFocus(message.questionId);
    }
  }

  const latestMessage = parseMessage(globalThis.localStorage?.getItem(storageKey(eventId)) ?? null);
  applyMessage(latestMessage);

  const channel =
    "BroadcastChannel" in globalThis ? new BroadcastChannel(CHANNEL_NAME) : null;

  void supabase
    ?.from("event_presenter_state")
    .select("focused_question_id")
    .eq("event_id", eventId)
    .maybeSingle()
    .then(({ data }) => {
      if (data?.focused_question_id) {
        onFocus(data.focused_question_id);
      }
    });

  const presenterStateChannel = supabase
    ?.channel(`qsb-ask-presenter-state-${eventId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        filter: `event_id=eq.${eventId}`,
        schema: "public",
        table: "event_presenter_state",
      },
      (payload) => {
        const next = payload.new as { focused_question_id?: unknown };

        if (typeof next.focused_question_id === "string") {
          onFocus(next.focused_question_id);
        }
      },
    );

  presenterStateChannel?.subscribe();

  function handleBroadcast(event: MessageEvent) {
    applyMessage(isPresenterFocusMessage(event.data) ? event.data : null);
  }

  function handleStorage(event: StorageEvent) {
    if (event.key === storageKey(eventId)) {
      applyMessage(parseMessage(event.newValue));
    }
  }

  function handleLocalEvent(event: Event) {
    const detail = (event as CustomEvent<unknown>).detail;
    applyMessage(isPresenterFocusMessage(detail) ? detail : null);
  }

  channel?.addEventListener("message", handleBroadcast);
  globalThis.addEventListener("storage", handleStorage);
  globalThis.addEventListener(CHANNEL_NAME, handleLocalEvent);

  return () => {
    channel?.removeEventListener("message", handleBroadcast);
    channel?.close();
    if (presenterStateChannel) {
      void supabase?.removeChannel(presenterStateChannel);
    }
    globalThis.removeEventListener("storage", handleStorage);
    globalThis.removeEventListener(CHANNEL_NAME, handleLocalEvent);
  };
}
