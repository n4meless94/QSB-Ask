import Link from "next/link";
import { redirect } from "next/navigation";

async function joinEventAction(formData: FormData) {
  "use server";

  const rawCode = String(formData.get("event_code") ?? "").trim();
  const code = rawCode.toUpperCase().replace(/[^A-Z0-9-]/g, "");

  if (code.length === 0) {
    redirect("/join");
  }

  redirect(`/join/${encodeURIComponent(code)}`);
}

const queueItems = [
  {
    status: "Pending review",
    tone: "accent",
    text: "Can we get the slides after the session?",
    meta: "New question",
  },
  {
    status: "Approved",
    tone: "success",
    text: "What is the next phase of the project?",
    meta: "Ready for presenter",
  },
  {
    status: "Hidden",
    tone: "muted",
    text: "Duplicate question from earlier.",
    meta: "Kept out of public view",
  },
];

const workflowSteps = [
  {
    title: "Audience joins",
    body: "Participants use a simple code or QR link. No app download needed.",
  },
  {
    title: "Questions come in",
    body: "People can ask from their phone while the session keeps moving.",
  },
  {
    title: "Organisers review",
    body: "Approve, hide, or archive questions before they reach the screen.",
  },
  {
    title: "Presenter shares",
    body: "Approved questions and poll results stay clear for the live room.",
  },
];

const useCases = [
  "Townhalls",
  "CEO sessions",
  "Training",
  "Subsidiary briefings",
  "Internal surveys",
  "Post-session feedback",
  "Anonymous audience questions",
];

const pollOptions = [
  { label: "Very useful", value: "64%" },
  { label: "Useful", value: "28%" },
  { label: "Need more detail", value: "8%" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)]">
      <header className="border-b border-[var(--color-rule)] bg-[var(--color-surface)]/95">
        <nav
          aria-label="Main navigation"
          className="mx-auto grid w-full max-w-6xl gap-3 px-4 py-4 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:px-10"
        >
          <Link
            className="w-fit text-lg font-semibold leading-6 text-[var(--color-ink)] no-underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2"
            href="/"
          >
            QSB Ask
          </Link>
          <div className="homepage-room-note">
            <span aria-hidden="true" className="homepage-room-dot" />
            Built for live QSB sessions
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold leading-[1.4] text-[var(--color-ink-muted)] sm:gap-4">
            <a className="homepage-nav-link" href="#how-it-works">
              How it works
            </a>
            <a className="homepage-nav-link" href="#sessions">
              Sessions
            </a>
            <Link className="homepage-nav-link" href="/login">
              Log in
            </Link>
            <Link className="homepage-nav-button" href="/events/new">
              Create session
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(24rem,1fr)] lg:items-center lg:px-10">
        <div className="min-w-0">
          <p className="homepage-kicker">Live room control</p>
          <h1 className="hallmark-display-heading mt-4 max-w-3xl text-[var(--color-ink)]">
            Run QSB sessions with every question under control.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--color-ink-muted)]">
            Collect questions, run quick polls, and gather feedback during your session.
            Organisers can review questions before they appear on screen.
          </p>

          <form
            action={joinEventAction}
            className="homepage-join-panel mt-8"
          >
            <div className="min-w-0">
              <label
                className="text-sm font-semibold leading-[1.4] text-[var(--color-ink)]"
                htmlFor="event-code"
              >
                Joining a session?
              </label>
              <input
                autoComplete="off"
                className="mt-2 min-h-12 w-full rounded-[var(--radius-sm)] border border-[var(--color-rule-strong)] bg-[var(--color-surface)] px-4 text-base font-semibold uppercase leading-6 text-[var(--color-ink)] outline-none transition-colors placeholder:normal-case placeholder:text-[var(--color-ink-soft)] focus:border-[var(--color-focus)] focus:ring-2 focus:ring-[var(--color-focus)] focus:ring-offset-2"
                id="event-code"
                name="event_code"
                placeholder="Enter session code"
                type="text"
              />
            </div>
            <button className="foundation-action foundation-action-primary min-h-12" type="submit">
              Join now
            </button>
          </form>

          <div className="mt-5 flex flex-col gap-3 text-sm leading-[1.4] text-[var(--color-ink-muted)] sm:flex-row sm:items-center">
            <Link className="foundation-utility-link" href="/events/new">
              Create a session
            </Link>
            <span>No login or app download needed for participants.</span>
          </div>
        </div>

        <ModerationConsole />
      </section>

      <section
        aria-labelledby="how-it-works"
        className="border-y border-[var(--color-rule)] bg-[var(--color-surface)]/75"
      >
        <div className="mx-auto grid w-full max-w-6xl gap-7 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)] lg:px-10">
          <div>
            <h2 id="how-it-works" className="text-3xl font-semibold leading-tight">
              From audience question to presenter screen.
            </h2>
            <p className="mt-4 text-base leading-7 text-[var(--color-ink-muted)]">
              The flow stays simple for participants, while organisers get the checks
              they need before anything is shared with the room.
            </p>
          </div>
          <ol className="homepage-workflow">
            {workflowSteps.map((step, index) => (
              <li className="homepage-workflow-step" key={step.title}>
                <span className="homepage-step-number">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="text-base font-semibold leading-6">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-ink-muted)]">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        aria-labelledby="sessions"
        className="mx-auto grid w-full max-w-6xl gap-7 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] lg:px-10"
      >
        <div>
          <h2 id="sessions" className="text-3xl font-semibold leading-tight">
            Made for the sessions QSB already runs.
          </h2>
          <p className="mt-4 text-base leading-7 text-[var(--color-ink-muted)]">
            Use it for formal briefings, training, surveys, and open Q&A moments
            where the room needs to stay focused.
          </p>
        </div>
        <div className="homepage-session-list">
          {useCases.map((useCase) => (
            <div className="homepage-session-item" key={useCase}>
              {useCase}
            </div>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="help"
        className="homepage-control-band"
      >
        <div className="mx-auto grid w-full max-w-6xl gap-7 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:items-center lg:px-10">
          <div>
            <p className="homepage-dark-kicker">Simple and controlled</p>
            <h2 id="help" className="mt-3 text-3xl font-semibold leading-tight">
              Only approved questions appear on screen.
            </h2>
          </div>
          <div className="grid gap-4">
            <p className="text-base leading-7 text-[var(--color-accent-soft)]">
              QSB Ask helps organisers keep the live room clear and focused. Questions can
              be reviewed, approved, hidden, or archived before they are shared.
            </p>
            <div className="homepage-control-list" aria-label="Moderation controls">
              <span>Review</span>
              <span>Approve</span>
              <span>Hide</span>
              <span>Archive</span>
              <span>Export</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ModerationConsole() {
  return (
    <aside aria-label="Moderation queue preview" className="homepage-console">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--color-rule)] pb-4">
        <div>
          <p className="text-sm font-semibold leading-[1.4] text-[var(--color-accent-strong)]">
            Moderation queue
          </p>
          <h2 className="mt-1 text-2xl font-semibold leading-tight">Today&apos;s live room</h2>
        </div>
        <span className="homepage-live-pill">Live</span>
      </div>

      <div className="grid gap-3">
        {queueItems.map((item) => (
          <article className="homepage-queue-row" data-tone={item.tone} key={item.text}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="homepage-status-chip">{item.status}</span>
                <span className="text-xs font-semibold leading-5 text-[var(--color-ink-soft)]">
                  {item.meta}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--color-ink)]">
                &ldquo;{item.text}&rdquo;
              </p>
            </div>
          </article>
        ))}
      </div>

      <section aria-labelledby="preview-poll" className="homepage-poll-panel">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h3 id="preview-poll" className="text-base font-semibold leading-6">
              Quick poll
            </h3>
            <p className="text-xs font-semibold leading-5 text-[var(--color-ink-soft)]">
              Example response split
            </p>
          </div>
          <span className="text-sm font-semibold leading-6 text-[var(--color-accent-strong)]">
            3 choices
          </span>
        </div>
        <div className="mt-4 grid gap-3">
          {pollOptions.map((option) => (
            <div className="grid gap-1" key={option.label}>
              <div className="flex items-center justify-between gap-3 text-sm font-semibold leading-[1.4]">
                <span>{option.label}</span>
                <span>{option.value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--color-paper-soft)]">
                <div
                  aria-hidden="true"
                  className="h-full rounded-full bg-[var(--color-accent-strong)]"
                  style={{ width: option.value }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}
