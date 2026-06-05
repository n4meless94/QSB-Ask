import Link from "next/link";

const knowledgeItems = [
  {
    title: "Join a live event",
    body: "Enter the event code from the organiser, then choose the available Q&A or survey room.",
  },
  {
    title: "Host a session",
    body: "Sign in, create an event, configure moderation, and share the join code with participants.",
  },
  {
    title: "Moderate public questions",
    body: "Review pending questions before they appear on public, audience, or presenter screens.",
  },
];

export default function KnowledgeBasePage() {
  return (
    <main className="homepage-portal min-h-screen bg-[var(--color-paper)] px-4 py-10 text-[var(--color-ink)] sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-4xl">
        <Link className="foundation-utility-link" href="/">
          Back to QSB Ask
        </Link>
        <h1 className="homepage-portal-title mt-8">Knowledge Base</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--color-ink-muted)]">
          Quick operating notes for joining, hosting, and moderating QSB Ask event sessions.
        </p>
        <div className="mt-10 grid gap-4">
          {knowledgeItems.map((item) => (
            <article className="homepage-action-panel homepage-action-panel-primary" key={item.title}>
              <h2 className="text-xl font-semibold leading-7">{item.title}</h2>
              <p className="mt-3 text-base leading-7 text-[var(--color-ink-muted)]">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
