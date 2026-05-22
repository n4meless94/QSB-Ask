import Link from "next/link";

import { Badge } from "@/components/ui/Badge";

import { CopyJoinLinkButton } from "./CopyJoinLinkButton";
import type { DashboardEvent } from "./EventDashboard";

type EventListItemProps = {
  event: DashboardEvent;
};

const statusLabels: Record<DashboardEvent["status"], string> = {
  active: "Active",
  archived: "Archived",
  draft: "Draft",
  ended: "Ended",
};

function formatEventDate(startsAt: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(new Date(startsAt));
}

export function EventListItem({ event }: EventListItemProps) {
  const eventHref = `/events/${event.id}`;

  return (
    <li className="grid gap-3 border-b border-slate-300 px-3 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1.5fr)_minmax(150px,0.8fr)_120px_minmax(110px,0.6fr)_minmax(150px,0.8fr)] sm:items-center">
      <Link
        className="min-w-0 rounded-[6px] text-base font-semibold leading-6 text-slate-900 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
        href={eventHref}
      >
        {event.name}
      </Link>

      <div className="text-sm leading-[1.4] text-slate-600">
        <span className="font-semibold text-slate-900 sm:hidden">Date: </span>
        {formatEventDate(event.starts_at, event.time_zone)}
      </div>

      <div>
        <Badge tone={event.status}>{statusLabels[event.status]}</Badge>
      </div>

      <div className="font-mono text-sm font-semibold leading-[1.4] text-slate-900">
        <span className="font-sans font-semibold sm:hidden">Join code: </span>
        {event.join_code}
      </div>

      <CopyJoinLinkButton
        eventName={event.name}
        joinCode={event.join_code}
        joinLink={event.join_link}
      />
    </li>
  );
}
