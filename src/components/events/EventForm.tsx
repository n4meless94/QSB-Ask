"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";

import { createEventAction, type CreateEventActionResult } from "@/app/(app)/events/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { EVENT_STATUSES, IDENTITY_MODES } from "@/lib/events/validation";
import type { IdentityMode } from "@/types/app";

const initialState: CreateEventActionResult = { ok: true };
type CreateEventStatus = (typeof EVENT_STATUSES)[number];

const statusLabels = {
  active: "Active",
  draft: "Draft",
  ended: "Ended",
};

const statusDescriptions = {
  active: "Participants can access the event and submit questions.",
  draft: "Not visible to participants until you activate it.",
  ended: "Closed for new submissions and kept for reporting.",
};

const identityLabels = {
  anonymous: "Anonymous",
  name_email_required: "Name and email required",
  name_required: "Name required",
};

const identityDescriptions = {
  anonymous: "Participants can submit without providing a display name.",
  name_email_required: "Best for invited stakeholder sessions that need follow-up.",
  name_required: "Participants enter a display name before submitting.",
};

function getDefaultTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kuala_Lumpur";
  } catch {
    return "Asia/Kuala_Lumpur";
  }
}

export function EventForm() {
  const [state, formAction, isPending] = useActionState(createEventAction, initialState);
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [status, setStatus] = useState<CreateEventStatus>("draft");
  const [identityMode, setIdentityMode] = useState<IdentityMode>("name_required");
  const [moderationEnabled, setModerationEnabled] = useState(true);
  const [showModerationDialog, setShowModerationDialog] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const timeZone = useMemo(() => getDefaultTimeZone(), []);
  const fieldErrors = state.ok ? {} : state.fieldErrors;
  const startsAtValue = eventDate && eventTime ? `${eventDate}T${eventTime}` : "";
  const actionLabel =
    status === "active" ? "Create live event" : status === "draft" ? "Save draft" : "Create closed event";

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    function warnOnUnload(event: BeforeUnloadEvent) {
      if (!isDirty || isPending) return;

      event.preventDefault();
    }

    window.addEventListener("beforeunload", warnOnUnload);
    return () => window.removeEventListener("beforeunload", warnOnUnload);
  }, [isDirty, isPending]);

  function requestModerationChange(checked: boolean) {
    setIsDirty(true);

    if (!checked) {
      setShowModerationDialog(true);
      return;
    }

    setModerationEnabled(true);
  }

  return (
    <form
      action={formAction}
      className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start"
      onChange={() => setIsDirty(true)}
    >
      <input name="moderation_enabled" type="hidden" value={moderationEnabled ? "true" : "false"} />
      <input name="starts_at" type="hidden" value={startsAtValue} />

      <div className="lg:col-span-2">
        <h1 className="text-[28px] font-semibold leading-[1.2] text-slate-900">Create Event</h1>
        <p className="mt-1 text-sm leading-[1.4] text-slate-600">
          Set up the event details, participant access, and public question safety controls.
        </p>
      </div>

      {!state.ok ? (
        <div
          className="rounded-[6px] border border-red-700 bg-white p-4 lg:col-span-2"
          role="alert"
          tabIndex={-1}
        >
          <p className="text-base font-semibold leading-6 text-red-700">{state.message}</p>
          {Object.keys(fieldErrors).length > 1 ? (
            <ul className="mt-2 list-disc pl-5 text-sm leading-[1.4] text-slate-700">
              {Object.values(fieldErrors).map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-6">
        <section className="grid gap-4" aria-labelledby="event-details-heading">
          <h2 className="text-xl font-semibold leading-[1.25] text-slate-900" id="event-details-heading">
            Event details
          </h2>
          <Field
            error={fieldErrors.name}
            helperText="Use the title organisers and participants will recognise."
            label="Event name"
            name="name"
            onChange={(event) => setEventName(event.target.value)}
            placeholder="QSB Townhall June 2026"
            type="text"
            value={eventName}
          />
          <div className="grid gap-2">
            <span className="text-sm font-semibold leading-[1.4] text-slate-900">Event date and time</span>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                aria-label="Event date"
                className={fieldErrors.starts_at ? "border-red-700" : undefined}
                id="event_date"
                label="Date"
                onChange={(event) => setEventDate(event.target.value)}
                type="date"
                value={eventDate}
              />
              <Field
                aria-label="Event time"
                className={fieldErrors.starts_at ? "border-red-700" : undefined}
                id="event_time"
                label="Time"
                onChange={(event) => setEventTime(event.target.value)}
                type="time"
                value={eventTime}
              />
            </div>
            <p className="text-sm leading-[1.4] text-slate-600">
              Used for dashboard sorting, event display, and organiser scheduling.
            </p>
            {fieldErrors.starts_at ? (
              <p className="text-sm font-semibold leading-[1.4] text-red-700">
                {fieldErrors.starts_at}
              </p>
            ) : null}
          </div>
          <Field
            defaultValue={timeZone}
            error={fieldErrors.time_zone}
            helperText="Participants see the event timing in this timezone."
            label="Time zone"
            name="time_zone"
            type="text"
          />
          <div className="grid gap-2">
            <label className="text-sm font-semibold leading-[1.4] text-slate-900" htmlFor="status">
              Status
            </label>
            <select
              className="min-h-11 rounded-[6px] border border-slate-300 bg-white px-3 text-base leading-6 text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 sm:min-h-10"
              id="status"
              name="status"
              onChange={(event) => setStatus(event.target.value as CreateEventStatus)}
              value={status}
            >
              {EVENT_STATUSES.map((eventStatus) => (
                <option key={eventStatus} value={eventStatus}>
                  {statusLabels[eventStatus]}
                </option>
              ))}
            </select>
            <p className="text-sm leading-[1.4] text-slate-600">{statusDescriptions[status]}</p>
            {fieldErrors.status ? (
              <p className="text-sm font-semibold leading-[1.4] text-red-700">
                {fieldErrors.status}
              </p>
            ) : null}
          </div>
        </section>

        <section className="grid gap-4" aria-labelledby="participant-access-heading">
          <h2
            className="text-xl font-semibold leading-[1.25] text-slate-900"
            id="participant-access-heading"
          >
            Participant access
          </h2>
          <div className="grid gap-2">
            <label
              className="text-sm font-semibold leading-[1.4] text-slate-900"
              htmlFor="identity_mode"
            >
              Participant identity mode
            </label>
            <select
              className="min-h-11 rounded-[6px] border border-slate-300 bg-white px-3 text-base leading-6 text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 sm:min-h-10"
              id="identity_mode"
              name="identity_mode"
              onChange={(event) => setIdentityMode(event.target.value as IdentityMode)}
              value={identityMode}
            >
              {IDENTITY_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {identityLabels[mode]}
                </option>
              ))}
            </select>
            <p className="text-sm leading-[1.4] text-slate-600">
              {identityDescriptions[identityMode]}
            </p>
            {fieldErrors.identity_mode ? (
              <p className="text-sm font-semibold leading-[1.4] text-red-700">
                {fieldErrors.identity_mode}
              </p>
            ) : null}
          </div>
        </section>

        <section className="grid gap-4" aria-labelledby="question-controls-heading">
          <h2
            className="text-xl font-semibold leading-[1.25] text-slate-900"
            id="question-controls-heading"
          >
            Question controls
          </h2>
          <div className="rounded-[6px] border border-teal-700 bg-white p-4">
            <label className="flex items-start gap-3 text-sm font-semibold leading-[1.4] text-slate-900">
              <input
                checked={moderationEnabled}
                className="mt-1 size-5 rounded border-slate-300 text-teal-700 focus:ring-2 focus:ring-teal-700"
                disabled={!isReady}
                onChange={(event) => requestModerationChange(event.target.checked)}
                type="checkbox"
              />
              <span>
                Questions require approval before public display
                <span className="block pt-1 text-sm font-normal leading-[1.4] text-slate-600">
                  Recommended for all QSB events. Audience questions stay private until reviewed.
                </span>
              </span>
            </label>
            <p className="mt-3 text-sm leading-[1.4] text-slate-600">
              Defaults: 280 characters, duplicate submission block on, 30 second question rate limit.
            </p>
            {fieldErrors.moderation_enabled ? (
              <p className="mt-2 text-sm font-semibold leading-[1.4] text-red-700">
                {fieldErrors.moderation_enabled}
              </p>
            ) : null}
          </div>
        </section>
      </div>

      <aside
        aria-labelledby="event-summary-heading"
        className="grid gap-4 rounded-[6px] border border-slate-300 bg-white p-4 lg:sticky lg:top-6"
      >
        <div>
          <h2 className="text-base font-semibold leading-[1.35] text-slate-900" id="event-summary-heading">
            Event access summary
          </h2>
          <p className="mt-1 text-sm leading-[1.4] text-slate-600">
            Review what participants and moderators will experience after creation.
          </p>
        </div>
        <dl className="grid gap-3 text-sm leading-[1.4]">
          <div>
            <dt className="font-semibold text-slate-900">Event</dt>
            <dd className="mt-1 text-slate-600">{eventName.trim() || "Untitled event"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-900">Schedule</dt>
            <dd className="mt-1 text-slate-600">
              {eventDate && eventTime ? `${eventDate} at ${eventTime}` : "Date and time not set"}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-900">Audience access</dt>
            <dd className="mt-1 text-slate-600">{statusDescriptions[status]}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-900">Identity</dt>
            <dd className="mt-1 text-slate-600">{identityLabels[identityMode]}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-900">Moderation</dt>
            <dd className={moderationEnabled ? "mt-1 text-teal-700" : "mt-1 text-red-700"}>
              {moderationEnabled
                ? "Protected: questions stay private until approved."
                : "Unmoderated: public display can happen without review."}
            </dd>
          </div>
        </dl>
        <p className="border-t border-slate-300 pt-3 text-sm leading-[1.4] text-slate-600">
          After creation, you can add surveys and share audience, moderator, and presenter links.
        </p>
      </aside>

      <div className="flex flex-col gap-3 border-t border-slate-300 pt-4 sm:flex-row sm:justify-end lg:col-span-2">
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-[6px] border border-slate-300 bg-white px-4 text-base font-semibold text-slate-900 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-700 sm:min-h-10"
          href="/dashboard"
        >
          Cancel
        </Link>
        <Button loading={isPending} type="submit">
          {actionLabel}
        </Button>
      </div>

      {showModerationDialog ? (
        <div
          aria-labelledby="moderation-dialog-title"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 px-4"
          role="dialog"
        >
          <div className="w-full max-w-[480px] rounded-[6px] border border-slate-300 bg-white p-5 shadow-sm">
            <h2
              className="text-xl font-semibold leading-[1.25] text-slate-900"
              id="moderation-dialog-title"
            >
              Turn moderation off?
            </h2>
            <p className="mt-2 text-sm leading-[1.4] text-slate-600">
              Audience questions may appear publicly without review. Keep moderation on unless this
              event is intentionally unmoderated.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                onClick={() => {
                  setModerationEnabled(true);
                  setShowModerationDialog(false);
                }}
                variant="secondary"
              >
                Keep moderation on
              </Button>
              <Button
                onClick={() => {
                  setModerationEnabled(false);
                  setShowModerationDialog(false);
                }}
                variant="destructive"
              >
                Turn off moderation
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
