import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { ParticipantSectionNav } from "@/components/participants/ParticipantSectionNav";
import { SurveySubmitForm } from "@/components/surveys/SurveySubmitForm";
import {
  getJoinableEventByCode,
  getParticipantCookieName,
  type JoinableEvent,
} from "@/lib/participants/session";
import {
  loadParticipantSurveys,
  type ParticipantSurvey,
  type ParticipantSurveyListItem,
  type ParticipantSurveyListPageState,
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
      participant_realtime_enabled: true,
      status: "active",
    };
  }

  if (normalizedCode === "QSB7HALL") {
    return {
      id: "event-1",
      identity_mode: "anonymous",
      join_code: "QSB7HALL",
      name: "Town Hall",
      participant_realtime_enabled: true,
      status: "active",
    };
  }

  if (normalizedCode === "QSBEMAIL") {
    return {
      id: "event-1",
      identity_mode: "name_email_required",
      join_code: "QSBEMAIL",
      name: "Stakeholder Briefing",
      participant_realtime_enabled: true,
      status: "active",
    };
  }

  return null;
}

function e2eSurvey(
  id = "survey-1",
  title = "Pulse check",
  status: "published" | "draft" | "closed" = "published",
  resultsVisibleToParticipants = false,
): ParticipantSurvey {
  return {
    id,
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
    title,
  };
}

function e2eSurveyState(fixture?: string): ParticipantSurveyListPageState {
  if (fixture === "draft") {
    return {
      message: "No surveys are open",
      state: "unavailable",
      surveys: [],
    };
  }

  if (fixture === "closed") {
    return {
      message: "This survey is closed. New responses are no longer being accepted.",
      state: "unavailable",
      surveys: [],
    };
  }

  if (fixture === "visible") {
    return {
      message: "",
      state: "available",
      surveys: [
        {
          completed: true,
          results: { visible: true },
          survey: e2eSurvey("survey-1", "Pulse check", "published", true),
        },
      ],
    };
  }

  if (fixture === "multi") {
    return {
      message: "",
      state: "available",
      surveys: [
        {
          completed: false,
          results: { visible: false },
          survey: e2eSurvey("survey-1", "Pulse check"),
        },
        {
          completed: false,
          results: { visible: false },
          survey: e2eSurvey("survey-2", "Townhall follow-up"),
        },
      ],
    };
  }

  return {
    message: "",
    state: "available",
    surveys: [
      {
        completed: false,
        results: { visible: false },
        survey: e2eSurvey(),
      },
    ],
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
          openTextKeywords: [],
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

function surveyStatusLabel(survey: ParticipantSurveyListItem) {
  if (survey.completed) return "Submitted";
  return survey.results.visible ? "Results visible" : "Results hidden";
}

function SurveyQueue({
  eventId,
  joinCode,
  surveys,
  visibleResults,
}: {
  eventId: string;
  joinCode: string;
  surveys: ParticipantSurveyListItem[];
  visibleResults: SurveyResult[];
}) {
  const completedCount = surveys.filter((survey) => survey.completed).length;
  const firstUnansweredIndex = surveys.findIndex((survey) => !survey.completed);
  const openCountCopy = `${surveys.length} ${surveys.length === 1 ? "survey" : "surveys"} open`;

  return (
    <section className="grid gap-4" aria-labelledby="survey-queue-heading">
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="grid gap-1">
          <h2 className="text-[26px] font-semibold leading-[1.15] text-slate-950" id="survey-queue-heading">
            {surveys.length === 1 ? surveys[0].survey.title : "Event surveys"}
          </h2>
          {surveys.length > 1 ? (
            <p className="text-base leading-6 text-slate-600">
              {openCountCopy} · {completedCount} completed
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4">
        {surveys.map((entry, index) => {
          const shouldOpen = surveys.length === 1 || index === firstUnansweredIndex || entry.completed;
          const result = visibleResults.find((visibleResult) => visibleResult.id === entry.survey.id) ?? null;

          return (
            <details
              className="group grid gap-3"
              key={entry.survey.id}
              open={shouldOpen}
            >
              <summary className="grid cursor-pointer gap-2 rounded-[16px] border border-slate-200 bg-white px-5 py-4 shadow-sm outline-none marker:text-slate-500 focus-visible:ring-2 focus-visible:ring-[#008578] focus-visible:ring-offset-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-7">
                <span className="grid gap-1">
                  <span className="text-[22px] font-semibold leading-[1.2] text-slate-950">
                    {entry.survey.title}
                  </span>
                  <span className="text-sm font-semibold leading-[1.4] text-slate-600">
                    {entry.survey.questions.length}{" "}
                    {entry.survey.questions.length === 1 ? "question" : "questions"}
                  </span>
                </span>
                <span
                  className={
                    entry.completed
                      ? "w-fit rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold leading-[1.4] text-[#00796B]"
                      : entry.results.visible
                        ? "w-fit rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold leading-[1.4] text-[#00796B]"
                        : "w-fit rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold leading-[1.4] text-amber-700"
                  }
                >
                  {surveyStatusLabel(entry)}
                </span>
              </summary>
              <div>
                <SurveySubmitForm
                  completed={entry.completed}
                  eventId={eventId}
                  joinCode={joinCode}
                  result={result}
                  resultsVisible={entry.results.visible}
                  survey={entry.survey}
                />
              </div>
            </details>
          );
        })}
      </div>
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

  let surveyState: ParticipantSurveyListPageState | null = null;
  let visibleResults: SurveyResult[] = [];

  if (event && process.env.QSB_ASK_E2E_AUTH === "1") {
    surveyState = e2eSurveyState(query.fixture);
    visibleResults = query.fixture === "visible" ? e2eVisibleSurveyResults() : [];
  } else if (event) {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(getParticipantCookieName(event.id))?.value;

    if (rawToken) {
      surveyState = await loadParticipantSurveys(event.id, rawToken);
      visibleResults = (
        await Promise.all(
          surveyState.surveys
            .filter((survey) => survey.completed && survey.results.visible)
            .map((survey) => getParticipantVisibleSurveyResults(event.id, rawToken, survey.survey.id)),
        )
      ).flat();
    } else {
      surveyState = {
        message: "Join this event again before opening surveys.",
        state: "unavailable",
        surveys: [],
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

  const surveyCount = surveyState?.surveys.length ?? 0;
  const surveyStatusCopy =
    surveyCount > 0
      ? `${surveyCount} ${surveyCount === 1 ? "survey" : "surveys"} open`
      : "No surveys open";

  return (
    <main className="min-h-screen bg-[#F6F8FB] px-4 pb-[calc(6.25rem+env(safe-area-inset-bottom))] pt-8 text-slate-900 sm:px-6 sm:py-10">
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
                {surveyStatusCopy}
              </span>
              <span aria-hidden="true">·</span>
              <span>Live session</span>
            </p>
          </div>
          <ParticipantSectionNav
            activeSection="surveys"
            joinCode={joinCode}
            surveyCount={surveyCount}
          />
        </header>

        {!surveyState || surveyState.surveys.length === 0 ? (
          <AlertPanel title={surveyState?.message ?? "No surveys are open"}>
            <p>Open surveys will appear here when the organiser publishes them.</p>
          </AlertPanel>
        ) : (
          <SurveyQueue
            eventId={event.id}
            joinCode={joinCode}
            surveys={surveyState.surveys}
            visibleResults={visibleResults}
          />
        )}
      </div>
    </main>
  );
}
