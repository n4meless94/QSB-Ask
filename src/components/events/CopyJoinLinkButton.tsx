"use client";

import { Copy } from "lucide-react";
import { useState } from "react";

type CopyJoinLinkButtonProps = {
  align?: "end" | "stretch";
  eventName: string;
  joinCode: string;
  joinLink: string;
};

export function CopyJoinLinkButton({
  align = "end",
  eventName,
  joinCode,
  joinLink,
}: CopyJoinLinkButtonProps) {
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
    <div className={align === "stretch" ? "grid justify-items-stretch gap-2" : "grid justify-items-stretch gap-2 sm:justify-items-end"}>
      <button
        aria-label={`Copy join link for ${eventName}`}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[6px] border border-teal-700 bg-white px-4 text-sm font-semibold leading-[1.4] text-teal-800 outline-none transition-colors hover:bg-teal-50 focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 sm:min-h-10"
        onClick={copyJoinDetails}
        type="button"
      >
        <Copy aria-hidden="true" focusable="false" size={17} strokeWidth={2.2} />
        Copy join details
      </button>
      <p aria-live="polite" className={message ? "text-sm leading-[1.4] text-teal-700" : "sr-only"}>
        {message}
      </p>
    </div>
  );
}
