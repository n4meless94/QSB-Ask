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

const featureCards = [
  {
    title: "Live Q&A",
    body: "Participants submit questions from phone or laptop.",
  },
  {
    title: "Moderation",
    body: "Organisers approve questions before they appear publicly.",
  },
  {
    title: "Live Polls",
    body: "Collect quick feedback during briefings, townhalls, or training.",
  },
  {
    title: "Surveys",
    body: "Gather structured feedback before, during, or after an event.",
  },
  {
    title: "Analytics",
    body: "Export questions, responses, and engagement summaries after the session.",
  },
  {
    title: "QR / Join Code",
    body: "Participants can join using an event code or QR link.",
  },
];

const useCases = [
  "Townhall sessions",
  "CEO engagement",
  "Training sessions",
  "Subsidiary briefings",
  "Internal surveys",
  "Post-event feedback",
  "Anonymous staff questions",
];

const qnaItems = [
  "What is the next phase of the project?",
  "Can we get the slides after the session?",
  "Will this apply to subsidiaries too?",
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
          className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10"
        >
          <Link
            className="w-fit text-lg font-semibold leading-6 text-[var(--color-ink)] no-underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2"
            href="/"
          >
            QSB Ask
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold leading-[1.4] text-[var(--color-ink-muted)] sm:gap-4">
            <a className="homepage-nav-link" href="#product">
              Product
            </a>
            <a className="homepage-nav-link" href="#use-cases">
              Use Cases
            </a>
            <a className="homepage-nav-link" href="#help">
              Help
            </a>
            <Link className="homepage-nav-link" href="/login">
              Log in
            </Link>
            <Link className="homepage-nav-button" href="/events/new">
              Create event
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)] lg:items-center lg:px-10">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase leading-[1.4] tracking-[0] text-[var(--color-accent-strong)]">
            Live Q&A and surveys for QSB
          </p>
          <h1 className="hallmark-display-heading mt-4 max-w-3xl text-[var(--color-ink)]">
            Make every QSB event interactive.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--color-ink-muted)]">
            Collect live questions, run polls, and gather feedback from participants in real
            time with organiser moderation before anything appears on screen.
          </p>

          <form
            action={joinEventAction}
            className="mt-8 grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-surface-raised)] p-4 shadow-[var(--shadow-panel)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-5"
          >
            <div className="min-w-0">
              <label
                className="text-sm font-semibold leading-[1.4] text-[var(--color-ink)]"
                htmlFor="event-code"
              >
                Joining an event?
              </label>
              <input
                autoComplete="off"
                className="mt-2 min-h-12 w-full rounded-[var(--radius-sm)] border border-[var(--color-rule-strong)] bg-[var(--color-surface)] px-4 text-base font-semibold uppercase leading-6 text-[var(--color-ink)] outline-none transition-colors placeholder:normal-case placeholder:text-[var(--color-ink-soft)] focus:border-[var(--color-focus)] focus:ring-2 focus:ring-[var(--color-focus)] focus:ring-offset-2"
                id="event-code"
                name="event_code"
                placeholder="Enter event code"
                type="text"
              />
            </div>
            <button className="foundation-action foundation-action-primary min-h-12" type="submit">
              Join now
            </button>
          </form>

          <div className="mt-5 flex flex-col gap-3 text-sm leading-[1.4] text-[var(--color-ink-muted)] sm:flex-row sm:items-center">
            <Link className="foundation-utility-link" href="/events/new">
              Create an event
            </Link>
            <span>No login or app download needed.</span>
          </div>
        </div>

        <ProductPreview />
      </section>

      <section
        aria-labelledby="product"
        className="border-y border-[var(--color-rule)] bg-[var(--color-surface)]/75"
      >
        <div className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="text-sm font-semibold uppercase leading-[1.4] tracking-[0] text-[var(--color-accent-strong)]">
              Product
            </p>
            <h2 id="product" className="mt-3 text-3xl font-semibold leading-tight">
              Built around the live room.
            </h2>
          </div>
          {featureCards.map((feature) => (
            <article
              className="rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-surface-raised)] p-5"
              key={feature.title}
            >
              <h3 className="text-lg font-semibold leading-7">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-ink-muted)]">
                {feature.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="use-cases"
        className="mx-auto grid w-full max-w-6xl gap-7 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] lg:px-10"
      >
        <div>
          <p className="text-sm font-semibold uppercase leading-[1.4] tracking-[0] text-[var(--color-accent-strong)]">
            Use Cases
          </p>
          <h2 id="use-cases" className="mt-3 text-3xl font-semibold leading-tight">
            Built for QSB events and internal sessions.
          </h2>
          <p className="mt-4 text-base leading-7 text-[var(--color-ink-muted)]">
            The homepage stays simple for participants, while organisers get the controls
            they need for corporate event flow.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {useCases.map((useCase) => (
            <div
              className="rounded-[var(--radius-sm)] border border-[var(--color-rule)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm font-semibold leading-[1.4]"
              key={useCase}
            >
              {useCase}
            </div>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="help"
        className="bg-[var(--color-ink)] text-[var(--color-surface-raised)]"
      >
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:items-center lg:px-10">
          <div>
            <p className="text-sm font-semibold uppercase leading-[1.4] tracking-[0] text-[var(--color-accent-soft)]">
              Controlled by design
            </p>
            <h2 id="help" className="mt-3 text-3xl font-semibold leading-tight">
              Nothing unapproved reaches a public screen.
            </h2>
          </div>
          <p className="text-base leading-7 text-[var(--color-accent-soft)]">
            QSB Ask gives organisers control over what appears on screen. Questions can
            be reviewed, approved, hidden, or archived before being displayed publicly,
            which is especially important for corporate internal events.
          </p>
        </div>
      </section>
    </main>
  );
}

function ProductPreview() {
  return (
    <div
      aria-label="QSB Ask product preview"
      className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-surface-raised)] p-4 shadow-[var(--shadow-panel)] sm:p-5"
    >
      <section aria-labelledby="preview-qna" className="grid gap-3">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--color-rule)] pb-3">
          <h2 id="preview-qna" className="text-lg font-semibold leading-7">
            Live Q&A
          </h2>
          <span className="rounded-[var(--radius-xs)] bg-[var(--color-accent-soft)] px-2 py-1 text-xs font-semibold text-[var(--color-accent-strong)]">
            Moderated
          </span>
        </div>
        {qnaItems.map((item) => (
          <div
            className="rounded-[var(--radius-sm)] border border-[var(--color-rule)] bg-[var(--color-paper)] p-3 text-sm leading-6 text-[var(--color-ink)]"
            key={item}
          >
            &ldquo;{item}&rdquo;
          </div>
        ))}
      </section>

      <section
        aria-labelledby="preview-poll"
        className="rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-surface)] p-4"
      >
        <h2 id="preview-poll" className="text-lg font-semibold leading-7">
          Live Poll
        </h2>
        <p className="mt-1 text-sm leading-6 text-[var(--color-ink-muted)]">
          How useful was today&apos;s session?
        </p>
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
    </div>
  );
}
