"use client";

import { useState } from "react";

type CopyJoinLinkButtonProps = {
  eventName: string;
  joinCode: string;
  joinLink: string;
};

export function CopyJoinLinkButton({ eventName, joinCode, joinLink }: CopyJoinLinkButtonProps) {
  const [message, setMessage] = useState("");

  async function copyJoinDetails() {
    try {
      await navigator.clipboard.writeText(`${eventName}\nJoin code: ${joinCode}\n${joinLink}`);
      setMessage("Join details copied.");
    } catch {
      setMessage("Join details could not be copied. Select the code and copy it manually.");
    }
  }

  return (
    <div className="grid justify-items-start gap-2 sm:justify-items-end">
      <button
        aria-label={`Copy join link for ${eventName}`}
        className="min-h-11 rounded-[6px] border border-slate-300 bg-white px-3 text-sm font-semibold leading-[1.4] text-slate-900 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 sm:min-h-10"
        onClick={copyJoinDetails}
        type="button"
      >
        Copy join link
      </button>
      <p aria-live="polite" className="min-h-5 text-sm leading-[1.4] text-teal-700">
        {message}
      </p>
    </div>
  );
}
