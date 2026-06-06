import { cookies } from "next/headers";
import Link from "next/link";
import type { ReactNode } from "react";
import { BarChart3, MessageSquare } from "lucide-react";

import { SurveySubmitForm } from "@/components/surveys/SurveySubmitForm";
import {
  getJoinableEventByCode,
  getParticipantCookieName,
  type JoinableEvent,
} from "@/lib/participants/session";
import {
  loadParticipantSurvey,
  type ParticipantSurvey,
  type ParticipantSurveyPageState,
} from "@/lib/surveys/participant";
import { getParticipantVisibleSurveyResults, type SurveyResult } from "@/lib/surveys/results";

type ParticipantSurveysPageProps = {
  params: Promise<{ joinCode: string }>;
  searchParams: Promise<{ fixture?: string }>;
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

function e2eSurvey(
  status: "published" | "draft" | "closed" = "published",
  resultsVisibleToParticipants = false,
): ParticipantSurvey {
  return {
    id: "survey-1",
    questions: [
      {
        id: "question-choice",
        options: [
          { id: "option-yes", label: "Yes", position: 0 },
          { id: "option-no", label: "No", position: 1 },
        ],
        position: 0,
        prompt: "Is the pace clear?",
        ratingScale: null,
        type: "multiple_choice",
      },
      {
        id: "question-select",
        options: [
          { id: "option-budget", label: "Budget", position: 0 },
          { id: "option-risks", label: "Risks", position: 1 },
        ],
        position: 1,
        prompt: "Which topics should we expand?",
        ratingScale: null,
        type: "multiple_select",
      },
      {
        id: "question-rating",
        options: [],
        position: 2,
        prompt: "Rate the session",
        ratingScale: 5,
        type: "rating",
      },
      {
        id: "question-text",
        options: [],
        position: 3,
        prompt: "What should we clarify next?",
        ratingScale: null,
        type: "open_text",
      },
    ],
    resultsVisibleToParticipants,
    status,
    title: "Pulse check",
  };
}

function e2eSurveyState(fixture?: string): ParticipantSurveyPageState {
  if (fixture === "draft") {
    return {
      completed: false,
      message: "No surveys are open",
      results: { visible: false },
      state: "unavailable",
      survey: null,
    };
  }

  if (fixture === "closed") {
    return {
      completed: false,
      message: "This survey is closed. New responses are no longer being accepted.",
      results: { visible: false },
      state: "closed",
      survey: e2eSurvey("closed"),
    };
  }

  if (fixture === "visible") {
    return {
      completed: true,
      message: "You have already submitted this survey.",
      results: { visible: true },
      state: "available",
      survey: e2eSurvey("published", true),
    };
  }

  return {
    completed: false,
    message: "",
    results: { visible: false },
    state: "available",
    survey: e2eSurvey(),
  };
}

function e2eVisibleSurveyResults(): SurveyResult[] {
  return [
    {
      id: "survey-1",
      lastUpdated: "2026-05-30T00:13:00.000Z",
      presentationHref: "/events/event-1/presentation/surveys/survey-1",
      responseCount: 3,
      resultsVisibleToParticipants: true,
      status: "published",
      title: "Pulse check",
      questions: [
        {
          chartData: [
            { count: 2, label: "Yes", percentage: 67 },
            { count: 1, label: "No", percentage: 33 },
          ],
          id: "question-choice",
          openTextResponses: [],
          options: [
            { id: "option-yes", label: "Yes", position: 0 },
            { id: "option-no", label: "No", position: 1 },
          ],
          position: 0,
          prompt: "Is the pace clear?",
          ratingScale: null,
          responseCount: 3,
          type: "multiple_choice",
        },
      ],
    },
  ];
}

function AlertPanel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-[16px] border border-amber-100 bg-white p-5 shadow-sm" role="status">
      <h2 className="text-[22px] font-semibold leading-[1.2] text-slate-950">{title}</h2>
      <div className="mt-2 text-base leading-6 text-slate-700">{children}</div>
    </section>
  );
}

export default async function ParticipantSurveysPage({
  params,
  searchParams,
}: ParticipantSurveysPageProps) {
  const { joinCode } = await params;
  const query = await searchParams;
  const event =
    process.env.QSB_ASK_E2E_AUTH === "1"
      ? e2eEvent(joinCode)
      : await getJoinableEventByCode(joinCode);

  let surveyState: ParticipantSurveyPageState | null = null;
  let visibleResults: SurveyResult[] = [];

  if (event && process.env.QSB_ASK_E2E_AUTH === "1") {
    surveyState = e2eSurveyState(query.fixture);
    visibleResults = query.fixture === "visible" ? e2eVisibleSurveyResults() : [];
  } else if (event) {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(getParticipantCookieName(event.id))?.value;

    if (rawToken) {
      surveyState = await loadParticipantSurvey(event.id, rawToken);
      if (surveyState.completed && surveyState.results.visible && surveyState.survey) {
        visibleResults = await getParticipantVisibleSurveyResults(event.id, rawToken, surveyState.survey.id);
      }
    } else {
      surveyState = {
        completed: false,
        message: "Join this event again before opening surveys.",
        results: { visible: false },
        state: "unavailable",
        survey: null,
      };
    }
  }

  if (!event) {
    return (
      <main className="min-h-screen bg-[#F6F8FB] px-4 py-8 text-slate-900 sm:px-6">
        <div className="mx-auto grid max-w-[860px] gap-4">
          <h1 className="text-[28px] font-semibold leading-[1.2] text-slate-950">Event surveys</h1>
          <div className="rounded-[16px] border border-red-100 bg-white p-5 shadow-sm" role="alert">
            <p className="text-base font-semibold leading-6 text-red-700">
              This event is not available right now.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F6F8FB] px-4 py-8 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto grid max-w-[860px] gap-7">
        <header className="grid gap-5">
          <div className="grid gap-3">
            <h1 className="text-[34px] font-semibold leading-[1.08] text-slate-950 sm:text-[44px]">
              {event.name} Surveys
            </h1>
            <p className="max-w-[720px] text-base leading-7 text-slate-600 sm:text-lg">
              Share quick feedback with the organiser. Your response helps shape the session.
            </p>
            <p className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-semibold leading-[1.4] text-slate-500">
              <span className="inline-flex items-center gap-2 text-[#00796B]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#008578]" aria-hidden="true" />
                Survey open
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
              className="inline-flex min-h-11 items-center gap-2 rounded-[12px] px-4 text-base font-semibold leading-6 text-slate-600 outline-none transition-colors hover:bg-slate-50 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-[#008578] focus-visible:ring-offset-2 sm:min-h-10"
              href={`/join/${joinCode}/qna`}
            >
              <MessageSquare aria-hidden="true" className="h-4 w-4" />
              Q&A
            </Link>
            <Link
              aria-current="page"
              className="inline-flex min-h-11 items-center gap-2 rounded-[12px] bg-[#008578] px-4 text-base font-semibold leading-6 !text-white shadow-sm outline-none hover:bg-[#00796B] focus-visible:ring-2 focus-visible:ring-[#008578] focus-visible:ring-offset-2 sm:min-h-10"
              href={`/join/${joinCode}/surveys`}
            >
              <BarChart3 aria-hidden="true" className="h-4 w-4" />
              Surveys
            </Link>
          </nav>
        </header>

        {!surveyState?.survey ? (
          <AlertPanel title={surveyState?.message ?? "No surveys are open"}>
            <p>Open surveys will appear here when the organiser publishes them.</p>
          </AlertPanel>
        ) : (
          <section className="grid gap-4" aria-labelledby="survey-title">
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <h2 className="text-[26px] font-semibold leading-[1.15] text-slate-950" id="survey-title">
                {surveyState.survey.title}
              </h2>
              {surveyState.results.visible ? (
                <p className="rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold leading-[1.4] text-[#00796B]">
                  Results visible
                </p>
              ) : (
                <p className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold leading-[1.4] text-amber-700">
                  Results hidden
                </p>
              )}
            </div>

            {surveyState.state === "available" ? (
              <SurveySubmitForm
                completed={surveyState.completed}
                eventId={event.id}
                joinCode={joinCode}
                result={visibleResults.find((result) => result.id === surveyState.survey?.id) ?? null}
                resultsVisible={surveyState.results.visible}
                survey={surveyState.survey}
              />
            ) : (
              <AlertPanel title={surveyState.message}>
                <p>{surveyState.message}</p>
              </AlertPanel>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
