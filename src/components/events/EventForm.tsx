"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";

import { createEventAction, type CreateEventActionResult } from "@/app/(app)/events/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { EVENT_STATUSES, IDENTITY_MODES } from "@/lib/events/validation";

const initialState: CreateEventActionResult = { ok: true };

const statusLabels = {
  active: "Active",
  draft: "Draft",
  ended: "Ended",
};

const identityLabels = {
  anonymous: "Anonymous",
  name_email_required: "Name and email required",
  name_required: "Name required",
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
  const [moderationEnabled, setModerationEnabled] = useState(true);
  const [showModerationDialog, setShowModerationDialog] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const timeZone = useMemo(() => getDefaultTimeZone(), []);
  const fieldErrors = state.ok ? {} : state.fieldErrors;

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
    <form action={formAction} className="mx-auto grid max-w-3xl gap-6" onChange={() => setIsDirty(true)}>
      <input name="moderation_enabled" type="hidden" value={moderationEnabled ? "true" : "false"} />

      <div>
        <h1 className="text-[28px] font-semibold leading-[1.2] text-slate-900">Create Event</h1>
        <p className="mt-1 text-sm leading-[1.4] text-slate-600">
          Set up the Phase 1 event details and audience access controls.
        </p>
      </div>

      {!state.ok ? (
        <div
          className="rounded-[6px] border border-red-700 bg-white p-4"
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

      <section className="grid gap-4" aria-labelledby="event-details-heading">
        <h2 className="text-xl font-semibold leading-[1.25] text-slate-900" id="event-details-heading">
          Event details
        </h2>
        <Field error={fieldErrors.name} label="Event name" name="name" type="text" />
        <Field
          error={fieldErrors.starts_at}
          label="Event date/time"
          name="starts_at"
          type="datetime-local"
        />
        <Field
          defaultValue={timeZone}
          error={fieldErrors.time_zone}
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
            defaultValue="draft"
            id="status"
            name="status"
          >
            {EVENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
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
            defaultValue="name_required"
            id="identity_mode"
            name="identity_mode"
          >
            {IDENTITY_MODES.map((identityMode) => (
              <option key={identityMode} value={identityMode}>
                {identityLabels[identityMode]}
              </option>
            ))}
          </select>
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
        <div className="rounded-[6px] border border-slate-300 bg-white p-4">
          <label className="flex items-start gap-3 text-sm font-semibold leading-[1.4] text-slate-900">
            <input
              checked={moderationEnabled}
              className="mt-1 size-5 rounded border-slate-300 text-teal-700 focus:ring-2 focus:ring-teal-700"
              disabled={!isReady}
              onChange={(event) => requestModerationChange(event.target.checked)}
              type="checkbox"
            />
            <span>
              Moderation enabled
              <span className="block pt-1 text-sm font-normal leading-[1.4] text-slate-600">
                Recommended. Audience questions stay private until reviewed.
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

      <div className="flex flex-col gap-3 border-t border-slate-300 pt-4 sm:flex-row sm:justify-end">
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-[6px] border border-slate-300 bg-white px-4 text-base font-semibold text-slate-900 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-700 sm:min-h-10"
          href="/dashboard"
        >
          Cancel
        </Link>
        <Button loading={isPending} type="submit">
          Save event
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
