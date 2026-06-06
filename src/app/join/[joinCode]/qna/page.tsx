import Link from "next/link";
import { cookies } from "next/headers";
import { BarChart3, MessageSquare } from "lucide-react";

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
  const normalizedCode = joinCode.toUpperCase();

  if (normalizedCode === "QSB2X9ZA") {
    return {
      id: "event-1",
      identity_mode: "name_required",
      join_code: "QSB2X9ZA",
      name: "Quarterly Briefing",
      status: "active",
    };
  }

  if (normalizedCode === "QSB7HALL") {
    return {
      id: "event-1",
      identity_mode: "anonymous",
      join_code: "QSB7HALL",
      name: "Town Hall",
      status: "active",
    };
  }

  if (normalizedCode === "QSBEMAIL") {
    return {
      id: "event-1",
      identity_mode: "name_email_required",
      join_code: "QSBEMAIL",
      name: "Stakeholder Briefing",
      status: "active",
    };
  }

  return null;
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
  const [{ joinCode }, query] = await Promise.all([params, searchParams]);
  const event =
    process.env.QSB_ASK_E2E_AUTH === "1"
      ? e2eEvent(joinCode)
      : await getJoinableEventByCode(joinCode);

  if (!event) {
    return (
      <main className="min-h-screen bg-[#F6F8FB] px-4 py-8 text-slate-900 sm:px-6">
        <div className="mx-auto grid max-w-[720px] gap-4">
          <h1 className="text-[28px] font-semibold leading-[1.2] text-slate-950">Event Q&A</h1>
          <div className="rounded-[16px] border border-red-100 bg-white p-5 shadow-sm" role="alert">
            <p className="text-base font-semibold leading-6 text-red-700">
              This event is not available right now.
            </p>
          </div>
        </div>
      </main>
    );
  }

  let questions: PublicQuestion[];
  let votedQuestionIds: string[] = [];

  if (process.env.QSB_ASK_E2E_AUTH === "1") {
    questions = e2eQuestions();
  } else {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(getParticipantCookieName(event.id))?.value;

    if (rawToken) {
      [questions, votedQuestionIds] = await Promise.all([
        listPublicQuestions(event.id, { participantToken: rawToken }),
        listParticipantVoteQuestionIds(event.id, rawToken),
      ]);
    } else {
      questions = await listPublicQuestions(event.id, { participantToken: rawToken });
    }
  }

  return (
    <main className="min-h-screen bg-[#F6F8FB] px-4 py-8 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto grid max-w-[860px] gap-7">
        <header className="grid gap-5">
          <div className="grid gap-3">
            <h1 className="text-[34px] font-semibold leading-[1.08] text-slate-950 sm:text-[44px]">
            {event.name} Q&A
            </h1>
            <p className="max-w-[720px] text-base leading-7 text-slate-600 sm:text-lg">
              Ask a question for the speaker. Vote for the questions you want answered most.
            </p>
            <p className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-semibold leading-[1.4] text-slate-500">
              <span className="inline-flex items-center gap-2 text-[#00796B]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#008578]" aria-hidden="true" />
                Q&A open
              </span>
              <span aria-hidden="true">·</span>
              <span>Live session</span>
            </p>
          </div>
          <nav
            aria-label="Participant event sections"
            className="inline-flex w-fit max-w-full min-w-0 rounded-[16px] border border-slate-200 bg-white p-1 shadow-sm"
          >
            <Link
              aria-current="page"
              className="inline-flex min-h-11 items-center gap-2 rounded-[12px] bg-[#008578] px-4 text-base font-semibold leading-6 !text-white shadow-sm outline-none hover:bg-[#00796B] focus-visible:ring-2 focus-visible:ring-[#008578] focus-visible:ring-offset-2 sm:min-h-10"
              href={`/join/${joinCode}/qna`}
            >
              <MessageSquare aria-hidden="true" className="h-4 w-4" />
              Q&A
            </Link>
            <Link
              className="inline-flex min-h-11 items-center gap-2 rounded-[12px] px-4 text-base font-semibold leading-6 text-slate-600 outline-none transition-colors hover:bg-slate-50 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-[#008578] focus-visible:ring-offset-2 sm:min-h-10"
              href={`/join/${joinCode}/surveys`}
            >
              <BarChart3 aria-hidden="true" className="h-4 w-4" />
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
          questions={questions}
        />
      </div>
    </main>
  );
}
