"use client";

import { ExternalLink, ShieldCheck, ShieldOff } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { Badge } from "@/components/ui/Badge";
import { CopyJoinLinkButton } from "@/components/events/CopyJoinLinkButton";
import { EventJoinQrCard } from "@/components/events/EventJoinQrCard";
import type { EventAccessContext } from "@/lib/events/access";
import type { EventRole } from "@/types/app";

type WorkspaceTab = "qa" | "surveys" | "results" | "exports" | "access" | "settings" | "presenter";

type EventWorkspaceProps = {
  access: EventAccessContext;
  accessPanel: ReactNode;
  exportsPanel: ReactNode;
  initialTab?: WorkspaceTab;
  qnaPanel: ReactNode;
  resultsPanel: ReactNode;
  settingsPanel: ReactNode;
  surveysPanel: ReactNode;
};

const tabs: Array<{ id: WorkspaceTab; label: string }> = [
  { id: "qa", label: "Q&A" },
  { id: "surveys", label: "Surveys" },
  { id: "results", label: "Results" },
  { id: "exports", label: "Exports" },
  { id: "access", label: "Access" },
  { id: "settings", label: "Settings" },
  { id: "presenter", label: "Presenter" },
];

const roleLabels: Record<EventRole, string> = {
  organiser: "Organiser",
  moderator: "Moderator",
  speaker: "Speaker",
};

function tabClasses(isActive: boolean) {
  return [
    "min-h-11 rounded-[6px] border px-4 text-base font-semibold leading-6 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 sm:min-h-10",
    isActive
      ? "border-teal-800 bg-teal-800 text-white shadow-sm"
      : "border-slate-300 bg-white text-slate-700 hover:border-slate-500 hover:bg-slate-50",
  ].join(" ");
}

function LaterPlanPanel({ title, body }: { title: string; body: string }) {
  return (
    <section className="grid gap-2 rounded-[6px] border border-slate-300 bg-white p-4 sm:p-6">
      <h2 className="text-[20px] font-semibold leading-[1.25] text-slate-900">{title}</h2>
      <p className="text-base leading-6 text-slate-700">{body}</p>
    </section>
  );
}

function moderationBadgeClasses(enabled: boolean) {
  return [
    "inline-flex items-center gap-1.5 rounded-[6px] border px-2 py-1 text-sm font-semibold leading-[1.4]",
    enabled ? "border-teal-700 bg-teal-50 text-teal-800" : "border-amber-700 bg-amber-50 text-amber-800",
  ].join(" ");
}

export function EventWorkspace({
  access,
  accessPanel,
  exportsPanel,
  initialTab = "qa",
  qnaPanel,
  resultsPanel,
  settingsPanel,
  surveysPanel,
}: EventWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialTab);
  const { event, role } = access;
  const moderationEnabled = event.moderation_enabled;

  return (
    <div className="grid w-full gap-4">
      <header className="grid gap-5 rounded-[6px] border border-slate-300 bg-white p-4 shadow-[var(--shadow-panel)] sm:p-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] lg:items-start">
          <div className="min-w-0">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={event.status}>{event.status}</Badge>
                <span className="rounded-[6px] border border-slate-300 bg-slate-50 px-2 py-1 text-sm font-semibold leading-[1.4] text-slate-700">
                  {roleLabels[role]}
                </span>
                <span className={moderationBadgeClasses(moderationEnabled)}>
                  {moderationEnabled ? (
                    <ShieldCheck aria-hidden="true" focusable="false" size={16} strokeWidth={2.4} />
                  ) : (
                    <ShieldOff aria-hidden="true" focusable="false" size={16} strokeWidth={2.4} />
                  )}
                  {moderationEnabled ? "Moderation On" : "Moderation Off"}
                </span>
              </div>
              <Link
                className="inline-flex min-h-11 w-full items-center justify-center rounded-[6px] border border-slate-300 bg-white px-4 text-base font-semibold leading-6 text-slate-900 outline-none transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 sm:min-h-10 sm:w-auto"
                href="/dashboard"
              >
                Back to Event Dashboard
              </Link>
            </div>
            <h1 className="break-words text-[28px] font-semibold leading-[1.1] text-slate-950 sm:text-[32px]">
              {event.name}
            </h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-[1.5] text-slate-700">
              {moderationEnabled
                ? "Moderation safety: pending questions stay hidden until approved."
                : "Moderation is off: new audience questions can appear without approval."}
            </p>
            <dl className="mt-4 grid gap-2 text-sm leading-[1.4] text-slate-700 sm:grid-cols-3">
              <div className="rounded-[6px] border border-slate-200 bg-slate-50 px-3 py-2">
                <dt className="font-semibold text-slate-900">Question limit</dt>
                <dd>{event.question_character_limit} characters</dd>
              </div>
              <div className="rounded-[6px] border border-slate-200 bg-slate-50 px-3 py-2">
                <dt className="font-semibold text-slate-900">Rate limit</dt>
                <dd>{event.question_rate_limit_seconds} seconds</dd>
              </div>
              <div className="rounded-[6px] border border-slate-200 bg-slate-50 px-3 py-2">
                <dt className="font-semibold text-slate-900">Duplicate block</dt>
                <dd>{event.duplicate_block_enabled ? "On" : "Off"}</dd>
              </div>
            </dl>
          </div>

          <div className="grid gap-3">
            <EventJoinQrCard
              eventName={event.name}
              joinCode={event.join_code}
              joinLink={event.joinLink}
              showDownload
            />
            <div className="grid items-start gap-2 xl:grid-cols-2">
              <CopyJoinLinkButton
                align="stretch"
                eventName={event.name}
                joinCode={event.join_code}
                joinLink={event.joinLink}
              />
              <Link
                className="inline-flex min-h-11 min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-[6px] border border-slate-300 bg-white px-3 text-sm font-semibold leading-[1.4] text-slate-900 outline-none transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 sm:min-h-10"
                href={`/events/${event.id}/presenter`}
                target="_blank"
              >
                <ExternalLink aria-hidden="true" className="shrink-0" focusable="false" size={17} strokeWidth={2.2} />
                Open Presenter View
              </Link>
            </div>
          </div>
        </div>
      </header>

      <nav aria-label="Event workspace sections" className="rounded-[6px] border border-slate-300 bg-white p-2">
        <div
          aria-label="Event workspace sections"
          className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
          role="tablist"
        >
          {tabs.map((tab) => (
            <button
              aria-controls={`${tab.id}-panel`}
              aria-selected={activeTab === tab.id}
              className={tabClasses(activeTab === tab.id)}
              id={`${tab.id}-tab`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <div
        aria-labelledby={`${activeTab}-tab`}
        className="grid gap-4"
        id={`${activeTab}-panel`}
        role="tabpanel"
      >
        {activeTab === "qa" ? qnaPanel : null}
        {activeTab === "surveys" ? surveysPanel : null}
        {activeTab === "results" ? resultsPanel : null}
        {activeTab === "exports" ? exportsPanel : null}
        {activeTab === "access" ? accessPanel : null}
        {activeTab === "settings" ? settingsPanel : null}
        {activeTab === "presenter" ? (
          <LaterPlanPanel
            body="Presenter display data is planned in the presenter slice. Assigned speakers can use the Presenter View entry point once that route is implemented."
            title="Presenter"
          />
        ) : null}
      </div>
    </div>
  );
}
