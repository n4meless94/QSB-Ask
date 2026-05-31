import { cookies } from "next/headers";
import Link from "next/link";
import type { ReactNode } from "react";

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
  if (joinCode.toUpperCase() !== "QSB2X9ZA") return null;

  return {
    id: "event-1",
    identity_mode: "name_required",
    join_code: "QSB2X9ZA",
    name: "Quarterly Briefing",
    status: "active",
  };
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
    <section className="rounded-[6px] border border-amber-700 bg-white p-4" role="status">
      <h2 className="text-[20px] font-semibold leading-[1.25] text-slate-900">{title}</h2>
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
      <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6">
        <div className="mx-auto grid max-w-[760px] gap-4">
          <h1 className="text-[28px] font-semibold leading-[1.2] text-slate-900">Event surveys</h1>
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
          <h1 className="text-[28px] font-semibold leading-[1.2] text-slate-900">{event.name}</h1>
          <p className="text-base leading-6 text-slate-600">
            Submit the active event survey from this public participant view.
          </p>
          <nav aria-label="Participant event sections" className="flex min-w-0 flex-wrap gap-2 pt-2">
            <Link
              className="inline-flex min-h-11 items-center rounded-[6px] border border-slate-300 bg-white px-3 text-base font-semibold leading-6 text-slate-700 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 sm:min-h-10"
              href={`/join/${joinCode}/qna`}
            >
              Q&A
            </Link>
            <Link
              aria-current="page"
              className="inline-flex min-h-11 items-center rounded-[6px] border border-teal-700 bg-white px-3 text-base font-semibold leading-6 text-teal-700 outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 sm:min-h-10"
              href={`/join/${joinCode}/surveys`}
            >
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
            <div className="grid gap-2">
              <h2 className="text-[20px] font-semibold leading-[1.25] text-slate-900" id="survey-title">
                {surveyState.survey.title}
              </h2>
              {surveyState.results.visible ? (
                <p className="text-sm leading-[1.4] text-slate-600">
                  Survey results are available to participants.
                </p>
              ) : (
                <p className="text-sm font-semibold leading-[1.4] text-amber-700">
                  Results are hidden by the organiser.
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
