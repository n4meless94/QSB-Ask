import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarPlus, KeyRound } from "lucide-react";

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
  isSignedIn: boolean;
};

async function loadLandingEventData(): Promise<LandingEventData> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { isSignedIn: false };
  }

  return { isSignedIn: true };
}

export default async function Home() {
  const eventData = await loadLandingEventData();

  return (
    <main className="homepage-portal min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)]">
      <PortalNavbar isSignedIn={eventData.isSignedIn} />
      <HeroSection isSignedIn={eventData.isSignedIn} />
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
          <span>QSB <strong>Ask</strong></span>
        </Link>
        <div className="homepage-portal-links">
          <Link href="/dashboard">My Events</Link>
          <Link href="/knowledge-base">Knowledge Base</Link>
        </div>
        <Link className="homepage-login-link" href={isSignedIn ? "/dashboard" : "/login"}>
          {isSignedIn ? "Dashboard" : "Sign in"}
        </Link>
      </nav>
    </header>
  );
}

function HeroSection({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <section className="homepage-hero mx-auto grid !min-h-0 w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:px-10">
      <div className="homepage-hero-copy">
        <p className="homepage-room-note">
          <span className="homepage-room-dot" aria-hidden="true" />
          QSB live sessions
        </p>
        <h1 className="homepage-portal-title">QSB Event Portal</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--color-ink-muted)] sm:text-xl">
          Join a live room with an event code, or open a controlled workspace for questions, polls, and feedback.
        </p>
      </div>
      <div className="homepage-hero-actions" aria-label="Event actions">
        <JoinEventCard />
        <HostEventCard isSignedIn={isSignedIn} />
      </div>
    </section>
  );
}

function JoinEventCard() {
  return (
    <section aria-labelledby="join-event-title" className="homepage-action-panel homepage-action-panel-primary">
      <div className="homepage-panel-heading">
        <span className="homepage-panel-icon" aria-hidden="true">
          <KeyRound size={18} strokeWidth={2.2} />
        </span>
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
          placeholder="Example: QSB2X9ZA..."
          spellCheck={false}
          type="text"
        />
        <button className="foundation-action foundation-action-primary min-h-12" type="submit">
          Join Event
          <ArrowRight size={18} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </form>
    </section>
  );
}

function HostEventCard({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <section aria-labelledby="host-event-title" className="homepage-action-panel homepage-action-panel-host">
      <div className="homepage-panel-heading">
        <span className="homepage-panel-icon" aria-hidden="true">
          <CalendarPlus size={18} strokeWidth={2.2} />
        </span>
        <h2 id="host-event-title" className="text-xl font-semibold leading-7">
          Host an Event
        </h2>
        <p className="mx-auto mt-3 max-w-md text-base leading-7 text-[var(--color-ink-muted)]">
          Create a new session for Q&A, polls, or feedback.
        </p>
      </div>
      <Link className="foundation-action homepage-host-action mt-6 min-h-12" href={isSignedIn ? "/events/new" : "/login"}>
        Create Event
        <ArrowRight size={18} strokeWidth={2.2} aria-hidden="true" />
      </Link>
    </section>
  );
}

function PortalFooter() {
  return (
    <footer className="homepage-footer border-t border-[var(--color-rule)] bg-[var(--color-surface)]">
      <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-8 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:px-10">
        <Link className="homepage-brand" href="/">
          <span>QSB <strong>Ask</strong></span>
        </Link>
        <div className="homepage-portal-links" id="knowledge">
          <Link href="/dashboard">My Events</Link>
          <Link href="/knowledge-base">Knowledge Base</Link>
        </div>
        <p className="text-sm leading-6 text-[var(--color-ink-soft)]">
          © 2026 Qhazanah Sabah Berhad.
        </p>
      </div>
    </footer>
  );
}
