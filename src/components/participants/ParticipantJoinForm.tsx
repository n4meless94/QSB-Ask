"use client";

import { useActionState } from "react";

import {
  joinParticipantAction,
  type JoinParticipantActionResult,
} from "@/app/join/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import type { IdentityMode } from "@/types/app";

type ParticipantJoinFormProps = {
  eventName?: string;
  initialCode?: string;
  identityMode?: IdentityMode;
  initialError?: string;
};

const initialState: JoinParticipantActionResult = { ok: true, message: "" };

export function ParticipantJoinForm({
  eventName,
  initialCode = "",
  identityMode = "name_required",
  initialError,
}: ParticipantJoinFormProps) {
  const [state, formAction, isPending] = useActionState(joinParticipantAction, initialState);
  const activeError = state.ok ? initialError : state.message;
  const fieldErrors = state.ok ? {} : state.fieldErrors ?? {};
  const requiresName = identityMode === "name_required" || identityMode === "name_email_required";
  const requiresEmail = identityMode === "name_email_required";

  return (
    <form action={formAction} className="mx-auto grid w-full max-w-[520px] gap-5">
      <div className="grid gap-2">
        <p className="text-sm leading-[1.4] text-slate-600">QSB Ask</p>
        <h1 className="text-[28px] font-semibold leading-[1.2] text-slate-900">
          {eventName ? `Join ${eventName}` : "Join event"}
        </h1>
        <p className="text-base leading-6 text-slate-600">
          Enter the event code shared by the organiser.
        </p>
      </div>

      {activeError ? (
        <div className="rounded-[6px] border border-red-700 bg-white p-4" role="alert">
          <p className="text-base font-semibold leading-6 text-red-700">{activeError}</p>
        </div>
      ) : null}

      <Field
        defaultValue={initialCode}
        error={fieldErrors.join_code}
        label="Join code"
        name="join_code"
        type="text"
      />

      {requiresName ? (
        <Field
          autoComplete="name"
          error={fieldErrors.display_name}
          label="Display name"
          name="display_name"
          type="text"
        />
      ) : null}

      {requiresEmail ? (
        <Field
          autoComplete="email"
          error={fieldErrors.email}
          label="Email"
          name="email"
          type="email"
        />
      ) : null}

      {!requiresName ? (
        <input name="display_name" type="hidden" value="" />
      ) : null}

      <Button className="w-full" loading={isPending} type="submit">
        Join event
      </Button>
    </form>
  );
}
