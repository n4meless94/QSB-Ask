import Link from "next/link";
import { cookies } from "next/headers";

import { AudienceQuestionList } from "@/components/qna/AudienceQuestionList";
import { QuestionSubmitForm } from "@/components/qna/QuestionSubmitForm";
import {
  getJoinableEventByCode,
  getParticipantCookieName,
  type JoinableEvent,
} from "@/lib/participants/session";
import { listPublicQuestions, type PublicQuestion } from "@/lib/qna/public";
import { listParticipantVoteQuestionIds } from "@/lib/qna/voting";

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
  return [
    {
      current_text: "Will slides be shared?",
      id: "question-live-popular",
      is_edited: false,
      status: "live",
      submitted_at: "2026-05-26T01:00:00.000Z",
      updated_at: "2026-05-26T01:00:00.000Z",
      vote_count: 3,
    },
    {
      current_text: "Newest approved question",
      id: "question-live-newest",
      is_edited: false,
      status: "live",
      submitted_at: "2026-05-26T02:00:00.000Z",
      updated_at: "2026-05-26T02:00:00.000Z",
      vote_count: 1,
    },
    {
      current_text: "Already answered item",
      id: "question-answered",
      is_edited: true,
      status: "answered",
      submitted_at: "2026-05-26T00:30:00.000Z",
      updated_at: "2026-05-26T00:30:00.000Z",
      vote_count: 2,
    },
  ];
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
  let votedQuestionIds: string[] = [];

  if (event && process.env.QSB_ASK_E2E_AUTH !== "1") {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(getParticipantCookieName(event.id))?.value;

    if (rawToken) {
      votedQuestionIds = await listParticipantVoteQuestionIds(event.id, rawToken);
    }
  }

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
          <nav aria-label="Participant event sections" className="flex min-w-0 flex-wrap gap-2 pt-2">
            <Link
              aria-current="page"
              className="inline-flex min-h-11 items-center rounded-[6px] border border-teal-700 bg-white px-3 text-base font-semibold leading-6 text-teal-700 outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 sm:min-h-10"
              href={`/join/${joinCode}/qna`}
            >
              Q&A
            </Link>
            <Link
              className="inline-flex min-h-11 items-center rounded-[6px] border border-slate-300 bg-white px-3 text-base font-semibold leading-6 text-slate-700 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 sm:min-h-10"
              href={`/join/${joinCode}/surveys`}
            >
              Surveys
            </Link>
          </nav>
        </header>

        <QuestionSubmitForm
          characterLimit={280}
          eventId={event.id}
          initialError={errorCopy(query.error)}
          joinCode={joinCode}
        />

        <AudienceQuestionList
          eventId={event.id}
          fixtureMode={process.env.QSB_ASK_E2E_AUTH === "1"}
          initialVotedQuestionIds={votedQuestionIds}
          joinCode={joinCode}
          key={questions.map((question) => `${question.id}:${question.updated_at}:${question.vote_count}`).join("|")}
          questions={questions}
        />
      </div>
    </main>
  );
}
