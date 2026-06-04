"use client";

import { useId, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

type EventJoinQrCardProps = {
  eventName: string;
  joinCode: string;
  joinLink: string;
  showDownload?: boolean;
  variant?: "compact" | "presenter";
};

function fileSafe(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function displayJoinHost(joinLink: string) {
  try {
    return new URL(joinLink).host;
  } catch {
    return joinLink.replace(/^https?:\/\//, "").split("/")[0] || joinLink;
  }
}

export function EventJoinQrCard({
  eventName,
  joinCode,
  joinLink,
  showDownload = false,
  variant = "compact",
}: EventJoinQrCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const titleId = useId();
  const [message, setMessage] = useState("");
  const isPresenter = variant === "presenter";
  const qrSize = isPresenter ? 220 : 132;
  const title = isPresenter ? "Scan to ask a question" : "Audience QR";
  const joinLinkDisplay = isPresenter ? displayJoinHost(joinLink) : joinLink;

  function downloadQr() {
    const canvas = canvasRef.current;

    if (!canvas) {
      setMessage("QR download is not ready yet.");
      return;
    }

    const link = document.createElement("a");
    const eventSlug = fileSafe(eventName) || "event";
    link.href = canvas.toDataURL("image/png");
    link.download = `qsb-ask-${eventSlug}-${joinCode.toLowerCase()}-qr.png`;
    link.click();
    setMessage("QR PNG downloaded.");
  }

  return (
    <section
      aria-labelledby={titleId}
      className={[
        "grid gap-3 rounded-[6px] border bg-white",
        isPresenter ? "border-slate-300 p-5 shadow-[var(--shadow-panel)]" : "border-slate-300 p-3",
      ].join(" ")}
    >
      <div className={isPresenter ? "grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center" : "grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center"}>
        <div className="w-fit rounded-[6px] border border-slate-300 bg-white p-2">
          <QRCodeCanvas
            bgColor="#ffffff"
            fgColor="#020617"
            level="M"
            marginSize={4}
            ref={canvasRef}
            size={qrSize}
            title={`QR code for ${eventName} Q&A join link`}
            value={joinLink}
          />
        </div>
        <div className="min-w-0">
          <h2
            className={
              isPresenter
                ? "max-w-[12ch] text-[25px] font-semibold leading-[1.08] text-slate-950 sm:text-[32px]"
                : "text-base font-semibold leading-[1.35] text-slate-950"
            }
            id={titleId}
          >
            {title}
          </h2>
          <p
            className={
              isPresenter
                ? "mt-2 max-w-[18ch] text-base font-semibold leading-[1.35] text-slate-700"
                : "mt-1 text-sm font-semibold leading-[1.4] text-slate-700"
            }
          >
            Open Q&amp;A on your phone.
          </p>
          <p
            aria-label="Join code"
            className={
              isPresenter
                ? "mt-3 w-fit rounded-[6px] border border-slate-300 bg-slate-50 px-4 py-3 font-mono text-[34px] font-semibold leading-none tracking-normal text-slate-950"
                : "mt-2 w-fit rounded-[6px] border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-[20px] font-semibold leading-none tracking-normal text-slate-950"
            }
          >
            {joinCode}
          </p>
          <p
            aria-label="Join link"
            className={
              isPresenter
                ? "mt-3 break-words font-mono text-base font-semibold leading-[1.35] text-slate-700"
                : "mt-2 break-all font-mono text-xs leading-[1.45] text-slate-600"
            }
          >
            {joinLinkDisplay}
          </p>
        </div>
      </div>

      {showDownload ? (
        <div className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-[6px] border border-slate-300 bg-white px-4 text-sm font-semibold leading-[1.4] text-slate-900 outline-none transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 sm:min-h-10"
            onClick={downloadQr}
            type="button"
          >
            Download QR PNG
          </button>
          <p aria-live="polite" className="min-h-5 text-sm leading-[1.4] text-teal-700">
            {message}
          </p>
        </div>
      ) : null}
    </section>
  );
}
