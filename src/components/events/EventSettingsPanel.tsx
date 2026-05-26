"use client";

import { useActionState, useState } from "react";

import {
  archiveEventAction,
  closeEventAction,
  updateEventSettingsAction,
  type EventSettingsActionResult,
} from "@/app/(app)/events/[eventId]/settings-actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import type { EventAccessContext } from "@/lib/events/access";
import type { EventRole } from "@/types/app";

type EventSettingsPanelProps = {
  event: EventAccessContext["event"];
  role: EventRole;
};

const initialState: EventSettingsActionResult = { ok: true, message: "" };

function toDatetimeLocal(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 16);
}

export function EventSettingsPanel({ event, role }: EventSettingsPanelProps) {
  const updateAction = updateEventSettingsAction.bind(null, event.id);
  const closeAction = closeEventAction.bind(null, event.id);
  const archiveAction = archiveEventAction.bind(null, event.id);
  const [state, formAction, isPending] = useActionState(updateAction, initialState);
  const [moderationEnabled, setModerationEnabled] = useState(event.moderation_enabled);
  const [moderationWarningAcknowledged, setModerationWarningAcknowledged] = useState(
    event.moderation_enabled,
  );
  const [duplicateBlockEnabled, setDuplicateBlockEnabled] = useState(event.duplicate_block_enabled);
  const [dialog, setDialog] = useState<"moderation" | "close" | "archive" | null>(null);
  const canManageSettings = role === "organiser";
  const fieldErrors = state.ok ? {} : state.fieldErrors ?? {};

  function requestModerationChange(checked: boolean) {
    if (!checked) {
      setModerationEnabled(false);
      setModerationWarningAcknowledged(false);
      setDialog("moderation");
      return;
    }

    setModerationEnabled(true);
    setModerationWarningAcknowledged(true);
  }

  if (!canManageSettings) {
    return (
      <section className="grid gap-2 rounded-[6px] border border-slate-300 bg-white p-4 sm:p-6">
        <h2 className="text-[20px] font-semibold leading-[1.25] text-slate-900">Event settings</h2>
        <p className="text-base leading-6 text-slate-700">
          Only organisers can edit event settings and lifecycle state.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="event-settings-heading"
      className="grid gap-5 rounded-[6px] border border-slate-300 bg-white p-4 sm:p-6"
    >
      <div className="grid gap-1">
        <h2
          className="text-[20px] font-semibold leading-[1.25] text-slate-900"
          id="event-settings-heading"
        >
          Event settings
        </h2>
        <p className="text-sm leading-[1.4] text-slate-600">
          Manage event details, audience identity rules, moderation defaults, and lifecycle state.
        </p>
      </div>

      {!state.ok ? (
        <div className="rounded-[6px] border border-red-700 bg-white p-4" role="alert">
          <p className="text-base font-semibold leading-6 text-red-700">{state.message}</p>
        </div>
      ) : state.message ? (
        <div className="rounded-[6px] border border-teal-700 bg-white p-4" role="status">
          <p className="text-base font-semibold leading-6 text-teal-700">{state.message}</p>
        </div>
      ) : null}

      <form action={formAction} className="grid gap-5">
        <input
          name="moderation_warning_acknowledged"
          type="hidden"
          value={moderationWarningAcknowledged ? "true" : "false"}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            defaultValue={event.name}
            error={fieldErrors.name}
            label="Event name"
            name="name"
            type="text"
          />
          <Field
            defaultValue={toDatetimeLocal(event.starts_at)}
            error={fieldErrors.starts_at}
            label="Event date/time"
            name="starts_at"
            type="datetime-local"
          />
          <Field
            defaultValue={event.time_zone}
            error={fieldErrors.time_zone}
            label="Time zone"
            name="time_zone"
            type="text"
          />
          <div className="grid gap-2">
            <label
              className="text-sm font-semibold leading-[1.4] text-slate-900"
              htmlFor="identity_mode"
            >
              Participant identity mode
            </label>
            <select
              className="min-h-11 rounded-[6px] border border-slate-300 bg-white px-3 text-base leading-6 text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 sm:min-h-10"
              defaultValue={event.identity_mode}
              id="identity_mode"
              name="identity_mode"
            >
              <option value="anonymous">Anonymous</option>
              <option value="name_required">Name required</option>
              <option value="name_email_required">Name and email required</option>
            </select>
          </div>
          <Field
            defaultValue={event.question_character_limit}
            error={fieldErrors.question_character_limit}
            label="Question character limit"
            max={1000}
            min={50}
            name="question_character_limit"
            type="number"
          />
          <Field
            defaultValue={event.question_rate_limit_seconds}
            error={fieldErrors.question_rate_limit_seconds}
            label="Question rate limit seconds"
            max={300}
            min={5}
            name="question_rate_limit_seconds"
            type="number"
          />
        </div>

        <div className="grid gap-4 border-t border-slate-200 pt-4">
          <label className="flex items-start gap-3 text-sm font-semibold leading-[1.4] text-slate-900">
            <input
              checked={moderationEnabled}
              className="mt-1 size-5 rounded border-slate-300 text-teal-700 focus:ring-2 focus:ring-teal-700"
              name="moderation_enabled"
              onChange={(input) => requestModerationChange(input.target.checked)}
              type="checkbox"
              value="true"
            />
            <span>
              Moderation enabled
              <span className="block pt-1 text-sm font-normal leading-[1.4] text-slate-600">
                Recommended. Audience questions stay private until reviewed.
              </span>
            </span>
          </label>
          {fieldErrors.moderation_warning_acknowledged ? (
            <p className="text-sm font-semibold leading-[1.4] text-red-700">
              {fieldErrors.moderation_warning_acknowledged}
            </p>
          ) : null}

          <label className="flex items-start gap-3 text-sm font-semibold leading-[1.4] text-slate-900">
            <input
              checked={duplicateBlockEnabled}
              className="mt-1 size-5 rounded border-slate-300 text-teal-700 focus:ring-2 focus:ring-teal-700"
              name="duplicate_block_enabled"
              onChange={(input) => setDuplicateBlockEnabled(input.target.checked)}
              type="checkbox"
              value="true"
            />
            <span>
              Duplicate question block
              <span className="block pt-1 text-sm font-normal leading-[1.4] text-slate-600">
                Helps reduce repeated submissions before moderator review.
              </span>
            </span>
          </label>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => setDialog("close")} type="button" variant="secondary">
              Close event
            </Button>
            <Button onClick={() => setDialog("archive")} type="button" variant="destructive">
              Archive event
            </Button>
          </div>
          <Button loading={isPending} type="submit">
            Save settings
          </Button>
        </div>
      </form>

      {dialog === "moderation" ? (
        <div
          aria-labelledby="moderation-dialog-title"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 px-4"
          role="dialog"
        >
          <div className="w-full max-w-[480px] rounded-[6px] border border-slate-300 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold leading-[1.25] text-slate-900" id="moderation-dialog-title">
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
                  setModerationWarningAcknowledged(true);
                  setDialog(null);
                }}
                variant="secondary"
              >
                Keep moderation on
              </Button>
              <Button
                onClick={() => {
                  setModerationEnabled(false);
                  setModerationWarningAcknowledged(true);
                  setDialog(null);
                }}
                variant="destructive"
              >
                I understand, turn moderation off
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {dialog === "close" ? (
        <div
          aria-labelledby="close-dialog-title"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 px-4"
          role="dialog"
        >
          <div className="w-full max-w-[480px] rounded-[6px] border border-slate-300 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold leading-[1.25] text-slate-900" id="close-dialog-title">
              Close event?
            </h2>
            <p className="mt-2 text-sm leading-[1.4] text-slate-600">
              Participants will no longer be able to submit new questions. Existing records stay
              available for moderation and review.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button onClick={() => setDialog(null)} variant="secondary">
                Keep event open
              </Button>
              <form action={closeAction}>
                <Button type="submit" variant="destructive">
                  Close event
                </Button>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {dialog === "archive" ? (
        <div
          aria-labelledby="archive-dialog-title"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 px-4"
          role="dialog"
        >
          <div className="w-full max-w-[480px] rounded-[6px] border border-slate-300 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold leading-[1.25] text-slate-900" id="archive-dialog-title">
              Archive event?
            </h2>
            <p className="mt-2 text-sm leading-[1.4] text-slate-600">
              Archived events stay available for records but are hidden from active workflows.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button onClick={() => setDialog(null)} variant="secondary">
                Keep event active
              </Button>
              <form action={archiveAction}>
                <Button type="submit" variant="destructive">
                  Archive event
                </Button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
