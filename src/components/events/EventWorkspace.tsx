"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

import { Badge } from "@/components/ui/Badge";
import { CopyJoinLinkButton } from "@/components/events/CopyJoinLinkButton";
import type { EventAccessContext } from "@/lib/events/access";
import type { EventRole } from "@/types/app";

type WorkspaceTab = "qa" | "access" | "settings" | "presenter";

type EventWorkspaceProps = {
  access: EventAccessContext;
  accessPanel: ReactNode;
};

const tabs: Array<{ id: WorkspaceTab; label: string }> = [
  { id: "qa", label: "Q&A" },
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
    "min-h-11 rounded-[6px] border px-4 text-base font-semibold leading-6 outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 sm:min-h-10",
    isActive
      ? "border-teal-700 bg-white text-teal-700"
      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
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

export function EventWorkspace({ access, accessPanel }: EventWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("qa");
  const { event, role } = access;

  return (
    <div className="grid w-full max-w-6xl gap-6">
      <header className="grid gap-4 rounded-[6px] border border-slate-300 bg-white p-4 sm:p-6">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-[28px] font-semibold leading-[1.2] text-slate-900">
                {event.name}
              </h1>
              <Badge tone={event.status}>{event.status}</Badge>
              <span className="rounded-[6px] border border-slate-300 px-2 py-1 text-sm font-semibold leading-[1.4] text-slate-700">
                {roleLabels[role]}
              </span>
            </div>
            <dl className="mt-3 grid gap-2 text-sm leading-[1.4] text-slate-600 sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-slate-900">Join code</dt>
                <dd className="break-words font-semibold text-slate-900">{event.join_code}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">Join link</dt>
                <dd className="break-all">{event.joinLink}</dd>
              </div>
            </dl>
          </div>
          <div className="grid gap-3 sm:justify-items-end">
            <CopyJoinLinkButton
              eventName={event.name}
              joinCode={event.join_code}
              joinLink={event.joinLink}
            />
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-[6px] border border-slate-300 bg-white px-4 text-base font-semibold leading-6 text-slate-900 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 sm:min-h-10"
              href={`/events/${event.id}/presenter`}
              target="_blank"
            >
              Open Presenter View
            </Link>
          </div>
        </div>
      </header>

      <nav aria-label="Event workspace sections">
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
        {activeTab === "qa" ? (
          <LaterPlanPanel
            body="Question submission and moderation queue controls are planned in the later Phase 2 Q&A plans. This workspace slice establishes staff access first."
            title="Q&A workspace"
          />
        ) : null}
        {activeTab === "access" ? accessPanel : null}
        {activeTab === "settings" ? (
          <LaterPlanPanel
            body="Event lifecycle and moderation settings are planned in the settings lifecycle slice. Organiser-only editing is not enabled in this access slice."
            title="Event settings"
          />
        ) : null}
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
