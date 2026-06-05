"use client";

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

export function publishPresenterFocus(eventId: string, questionId: string) {
  const message: PresenterFocusMessage = {
    eventId,
    questionId,
    sentAt: Date.now(),
  };

  globalThis.localStorage?.setItem(storageKey(eventId), JSON.stringify(message));
  globalThis.dispatchEvent(new CustomEvent(CHANNEL_NAME, { detail: message }));

  if ("BroadcastChannel" in globalThis) {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(message);
    channel.close();
  }
}

export function subscribeToPresenterFocus(
  eventId: string,
  onFocus: (questionId: string) => void,
) {
  function applyMessage(message: PresenterFocusMessage | null) {
    if (message?.eventId === eventId) {
      onFocus(message.questionId);
    }
  }

  const latestMessage = parseMessage(globalThis.localStorage?.getItem(storageKey(eventId)) ?? null);
  applyMessage(latestMessage);

  const channel =
    "BroadcastChannel" in globalThis ? new BroadcastChannel(CHANNEL_NAME) : null;

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
    globalThis.removeEventListener("storage", handleStorage);
    globalThis.removeEventListener(CHANNEL_NAME, handleLocalEvent);
  };
}
