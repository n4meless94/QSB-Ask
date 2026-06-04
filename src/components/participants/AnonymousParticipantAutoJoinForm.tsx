"use client";

import { useEffect, useRef } from "react";

import { autoJoinAnonymousParticipantAction } from "@/app/join/actions";
import { Button } from "@/components/ui/Button";

type AnonymousParticipantAutoJoinFormProps = {
  eventName: string;
  joinCode: string;
};

export function AnonymousParticipantAutoJoinForm({
  eventName,
  joinCode,
}: AnonymousParticipantAutoJoinFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.requestSubmit();
  }, []);

  return (
    <form
      action={autoJoinAnonymousParticipantAction}
      className="mx-auto grid w-full max-w-[520px] gap-5"
      ref={formRef}
    >
      <div className="grid gap-2">
        <p className="text-sm leading-[1.4] text-slate-600">QSB Ask</p>
        <h1 className="text-[28px] font-semibold leading-[1.2] text-slate-900">
          Joining {eventName}
        </h1>
        <p className="text-base leading-6 text-slate-600">Taking you straight to Q&A.</p>
      </div>

      <input name="join_code" type="hidden" value={joinCode} />

      <Button className="w-full" type="submit">
        Continue to Q&A
      </Button>
    </form>
  );
}
