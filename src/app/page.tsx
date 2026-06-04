import Link from "next/link";
import { redirect } from "next/navigation";

import {
  listLandingEventsForUser,
  splitLandingEvents,
  type LandingEvent,
  type LandingEventStatus,
} from "@/lib/events/landing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function joinEventAction(formData: FormData) {
  "use server";

  const rawCode = String(formData.get("event_code") ?? "").trim();
  const code = rawCode.toUpperCase().replace(/[^A-Z0-9-]/g, "");

  if (code.length === 0) {
    redirect("/join");
  }

  redirect(`/join/${encodeURIComponent(code)}`);
}

type LandingEventData = {
  activeUpcoming: LandingEvent[];
  error?: string;
  isSignedIn: boolean;
  recent: LandingEvent[];
};

const statusLabels: Record<LandingEventStatus, string> = {
  completed: "Completed",
  live: "Live",
  "starting-soon": "Starting soon",
  upcoming: "Upcoming",
};

async function loadLandingEventData(): Promise<LandingEventData> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { activeUpcoming: [], isSignedIn: false, recent: [] };
  }

  try {
    const events = await listLandingEventsForUser(user.id);
    return { ...splitLandingEvents(events), isSignedIn: true };
  } catch (loadError) {
    return {
      activeUpcoming: [],
      error: loadError instanceof Error ? loadError.message : "Events could not be loaded.",
      isSignedIn: true,
      recent: [],
    };
  }
}

function formatEventDate(event: LandingEvent) {
  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone: event.time_zone,
    weekday: "short",
  }).format(event.startsAt);
}

export default async function Home() {
  const eventData = await loadLandingEventData();

  return (
    <main className="homepage-portal min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)]">
      <PortalNavbar isSignedIn={eventData.isSignedIn} />
      <HeroSection />
      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 pb-10 sm:px-6 lg:grid-cols-2 lg:px-10">
        <JoinEventCard />
        <HostEventCard />
      </section>
      <ActiveUpcomingEvents events={eventData.activeUpcoming} error={eventData.error} />
      <RecentEventsTable events={eventData.recent} error={eventData.error} />
      <PortalFooter />
    </main>
  );
}

function PortalNavbar({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <header className="homepage-portal-nav">
      <nav
        aria-label="Main navigation"
        className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:px-10"
      >
        <Link className="homepage-brand" href="/">
          <span className="homepage-brand-mark" aria-hidden="true">•••</span>
          <span>QSB <strong>Ask</strong></span>
        </Link>
        <div className="homepage-portal-links">
          <Link href="/dashboard">My Events</Link>
          <a href="#knowledge">Knowledge Base</a>
          <a href="#support">Support</a>
        </div>
        <Link className="homepage-login-link" href={isSignedIn ? "/dashboard" : "/login"}>
          {isSignedIn ? "Dashboard" : "Log in"}
        </Link>
      </nav>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 text-center sm:px-6 sm:py-16 lg:px-10">
      <h1 className="homepage-portal-title">QSB Event Portal</h1>
      <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-[var(--color-ink-muted)] sm:text-xl">
        Access current live sessions or create a new interactive event.
      </p>
    </section>
  );
}

function JoinEventCard() {
  return (
    <section aria-labelledby="join-event-title" className="homepage-portal-card">
      <div className="text-center">
        <h2 id="join-event-title" className="text-xl font-semibold leading-7">
          Join an Event
        </h2>
        <p className="mt-3 text-base leading-7 text-[var(--color-ink-muted)]">
          Enter the code provided by the organizer.
        </p>
      </div>
      <form action={joinEventAction} className="mt-6 grid gap-4">
        <label className="sr-only" htmlFor="event-code">
          Event code
        </label>
        <input
          autoComplete="off"
          className="homepage-portal-input"
          id="event-code"
          name="event_code"
          placeholder="Enter event code"
          type="text"
        />
        <button className="foundation-action foundation-action-primary min-h-12" type="submit">
          Join Event
        </button>
      </form>
    </section>
  );
}

function HostEventCard() {
  return (
    <section aria-labelledby="host-event-title" className="homepage-portal-card">
      <div className="text-center">
        <h2 id="host-event-title" className="text-xl font-semibold leading-7">
          Host an Event
        </h2>
        <p className="mx-auto mt-3 max-w-md text-base leading-7 text-[var(--color-ink-muted)]">
          Create a new session for Q&A, polls, or feedback.
        </p>
      </div>
      <Link className="foundation-action homepage-host-action mt-6 min-h-12" href="/events/new">
        Create Event
      </Link>
    </section>
  );
}

function ActiveUpcomingEvents({ events, error }: { events: LandingEvent[]; error?: string }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10" aria-labelledby="active-events">
      <h2 id="active-events" className="text-3xl font-semibold leading-tight">
        Active & Upcoming QSB Events
      </h2>
      {error ? <AlertText>{error}</AlertText> : null}
      {events.length > 0 ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {events.map((event) => (
            <article className="homepage-event-card" key={event.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <EventStatusBadge status={event.portalStatus} />
                <time className="text-sm font-semibold leading-6 text-[var(--color-ink-muted)]" dateTime={event.starts_at}>
                  {formatEventDate(event)}
                </time>
              </div>
              <h3 className="mt-4 text-xl font-semibold leading-7">{event.name}</h3>
              <p className="mt-2 font-mono text-sm font-semibold leading-6 text-[var(--color-ink-muted)]">
                Join code {event.join_code}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState>No active or upcoming events at the moment.</EmptyState>
      )}
    </section>
  );
}

function RecentEventsTable({ events, error }: { events: LandingEvent[]; error?: string }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10" aria-labelledby="recent-events">
      <h2 id="recent-events" className="text-3xl font-semibold leading-tight">
        Recent Events
      </h2>
      {error ? <AlertText>{error}</AlertText> : null}
      {events.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-surface-raised)]">
          <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(10rem,0.7fr)_auto] gap-4 border-b border-[var(--color-rule)] bg-[var(--color-paper-soft)] px-5 py-4 text-sm font-semibold leading-6 text-[var(--color-ink)] sm:grid">
            <span>Event Name</span>
            <span>Date</span>
            <span className="text-right">Action</span>
          </div>
          <div className="divide-y divide-[var(--color-rule)]">
            {events.map((event) => (
              <article className="homepage-recent-row" key={event.id}>
                <h3 className="font-semibold leading-6">{event.name}</h3>
                <time className="text-sm leading-6 text-[var(--color-ink-muted)]" dateTime={event.starts_at}>
                  {formatEventDate(event)}
                </time>
                <Link className="homepage-summary-link" href={`/events/${event.id}`}>
                  View Event
                </Link>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState>No recent events yet.</EmptyState>
      )}
    </section>
  );
}

function EventStatusBadge({ status }: { status: LandingEventStatus }) {
  return (
    <span className="homepage-event-badge" data-status={status}>
      {statusLabels[status]}
    </span>
  );
}

function EmptyState({ children }: { children: string }) {
  return (
    <div className="mt-6 rounded-[var(--radius-md)] border border-dashed border-[var(--color-rule)] bg-[var(--color-surface-raised)] px-5 py-6 text-base leading-7 text-[var(--color-ink-muted)]">
      {children}
    </div>
  );
}

function AlertText({ children }: { children: string }) {
  return (
    <p className="mt-4 rounded-[var(--radius-sm)] border border-[var(--color-warning)] bg-[var(--color-warning-soft)] px-4 py-3 text-sm font-semibold leading-6 text-[var(--color-ink)]">
      {children}
    </p>
  );
}

function PortalFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-[var(--color-rule)] bg-[var(--color-surface)]" id="support">
      <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-8 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:px-10">
        <Link className="homepage-brand" href="/">
          <span className="homepage-brand-mark" aria-hidden="true">•••</span>
          <span>QSB <strong>Ask</strong></span>
        </Link>
        <div className="homepage-portal-links" id="knowledge">
          <Link href="/dashboard">My Events</Link>
          <a href="#knowledge">Knowledge Base</a>
          <a href="#support">Support</a>
        </div>
        <p className="text-sm leading-6 text-[var(--color-ink-soft)]">
          © {year} QSB Internal Portal.
        </p>
      </div>
    </footer>
  );
}
