import { QuestionSubmitForm } from "@/components/qna/QuestionSubmitForm";
import { getJoinableEventByCode, type JoinableEvent } from "@/lib/participants/session";
import { listPublicQuestions, type PublicQuestion } from "@/lib/qna/public";

type ParticipantQnaPageProps = {
  params: Promise<{ joinCode: string }>;
  searchParams: Promise<{ error?: string }>;
};

function e2eEvent(joinCode: string): JoinableEvent | null {
  if (joinCode.toUpperCase() !== "QSB2X9ZA") return null;

  return {
    id: "event-1",
    identity_mode: "name_required",
    join_code: "QSB2X9ZA",
    name: "Quarterly Briefing",
    status: "active",
  };
}

function e2eQuestions(): PublicQuestion[] {
  return [];
}

function errorCopy(error?: string) {
  if (error === "rate-limit") return "Please wait before submitting another question.";
  if (error === "duplicate") return "This question looks like one you already submitted.";
  return undefined;
}

export default async function ParticipantQnaPage({ params, searchParams }: ParticipantQnaPageProps) {
  const { joinCode } = await params;
  const query = await searchParams;
  const event =
    process.env.QSB_ASK_E2E_AUTH === "1"
      ? e2eEvent(joinCode)
      : await getJoinableEventByCode(joinCode);
  const questions =
    process.env.QSB_ASK_E2E_AUTH === "1" || !event ? e2eQuestions() : await listPublicQuestions(event.id);

  if (!event) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6">
        <div className="mx-auto grid max-w-[720px] gap-4">
          <h1 className="text-[28px] font-semibold leading-[1.2] text-slate-900">Event Q&A</h1>
          <div className="rounded-[6px] border border-red-700 bg-white p-4" role="alert">
            <p className="text-base font-semibold leading-6 text-red-700">
              We could not find an active event for that code.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto grid max-w-[760px] gap-5">
        <header className="grid gap-2 border-b border-slate-300 pb-4">
          <p className="text-sm font-semibold leading-[1.4] text-teal-700">Connected</p>
          <h1 className="text-[28px] font-semibold leading-[1.2] text-slate-900">
            {event.name} Q&A
          </h1>
          <p className="text-base leading-6 text-slate-600">
            Submit a question for moderator review. Approved questions appear below.
          </p>
        </header>

        <QuestionSubmitForm
          characterLimit={280}
          eventId={event.id}
          initialError={errorCopy(query.error)}
          joinCode={joinCode}
        />

        <section className="grid gap-3" aria-labelledby="approved-questions-heading">
          <h2
            className="text-[20px] font-semibold leading-[1.25] text-slate-900"
            id="approved-questions-heading"
          >
            Approved questions
          </h2>
          {questions.length === 0 ? (
            <div className="rounded-[6px] border border-slate-300 bg-white p-4">
              <p className="text-base leading-6 text-slate-600">No approved questions yet.</p>
            </div>
          ) : (
            <ul className="grid gap-3">
              {questions.map((question) => (
                <li className="rounded-[6px] border border-slate-300 bg-white p-4" key={question.id}>
                  <p className="text-base leading-6 text-slate-900">{question.current_text}</p>
                  <p className="mt-2 text-sm leading-[1.4] text-slate-600">
                    {question.vote_count} votes
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
