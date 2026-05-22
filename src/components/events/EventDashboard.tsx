"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import type { EventSummary } from "@/lib/events/events";

import { EventListItem } from "./EventListItem";

export type DashboardEvent = EventSummary & {
  join_link: string;
};

type EventDashboardProps = {
  events: DashboardEvent[];
  error?: string;
  loading?: boolean;
};

function matchesSearch(event: DashboardEvent, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) return true;

  return (
    event.name.toLowerCase().includes(normalizedQuery) ||
    event.join_code.toLowerCase().includes(normalizedQuery)
  );
}

export function EventDashboard({ error, events, loading = false }: EventDashboardProps) {
  const [query, setQuery] = useState("");
  const visibleEvents = useMemo(
    () => events.filter((event) => matchesSearch(event, query)),
    [events, query],
  );

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold leading-[1.2] text-slate-900">
            Event Dashboard
          </h1>
          <p className="mt-1 text-sm leading-[1.4] text-slate-600">
            Manage accessible Q&A and survey events.
          </p>
        </div>
        <Link href="/events/new">
          <Button className="w-full sm:w-auto">Create event</Button>
        </Link>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold leading-[1.4] text-slate-900" htmlFor="event-search">
          Search events
        </label>
        <input
          className="min-h-11 rounded-[6px] border border-slate-300 bg-white px-3 text-base leading-6 text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 sm:min-h-10"
          id="event-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by event name or join code"
          type="search"
          value={query}
        />
      </div>

      {loading ? (
        <div className="rounded-[6px] border border-slate-300 bg-white" role="status">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="h-[72px] border-b border-slate-300 last:border-b-0" key={index} />
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[6px] border border-red-700 bg-white p-4" role="alert">
          <p className="text-base font-semibold leading-6 text-red-700">Events could not be loaded</p>
          <p className="mt-1 text-sm leading-[1.4] text-slate-600">{error}</p>
        </div>
      ) : null}

      {!loading && !error && events.length === 0 ? (
        <div className="rounded-[6px] border border-slate-300 bg-white p-5">
          <h2 className="text-xl font-semibold leading-[1.25] text-slate-900">No events yet</h2>
          <p className="mt-1 text-sm leading-[1.4] text-slate-600">
            Create an event to generate a join code and prepare the audience access settings.
          </p>
          <Link className="mt-4 inline-flex" href="/events/new">
            <Button>Create event</Button>
          </Link>
        </div>
      ) : null}

      {!loading && !error && events.length > 0 ? (
        <div className="overflow-hidden rounded-[6px] border border-slate-300 bg-white">
          <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(150px,0.8fr)_120px_minmax(110px,0.6fr)_minmax(150px,0.8fr)] gap-3 border-b border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold leading-[1.4] text-slate-600 sm:grid">
            <span>Event name</span>
            <span>Date/time</span>
            <span>Status</span>
            <span>Join code</span>
            <span className="text-right">Action</span>
          </div>

          {visibleEvents.length > 0 ? (
            <ul>
              {visibleEvents.map((event) => (
                <EventListItem event={event} key={event.id} />
              ))}
            </ul>
          ) : (
            <p className="p-4 text-sm leading-[1.4] text-slate-600">No events match your search.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
