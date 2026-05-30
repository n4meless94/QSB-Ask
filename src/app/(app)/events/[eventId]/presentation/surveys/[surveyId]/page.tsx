import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SurveyPresentationView } from "@/components/surveys/SurveyPresentationView";
import { Button } from "@/components/ui/Button";
import { E2E_AUTH_COOKIE, isE2EAuthEnabled } from "@/lib/auth/e2e";
import { getPresentationSurveyResults, type SurveyResult } from "@/lib/surveys/results";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SurveyPresentationPageProps = {
  params: Promise<{ eventId: string; surveyId: string }>;
};

export default async function SurveyPresentationPage({ params }: SurveyPresentationPageProps) {
  const { eventId, surveyId } = await params;
  const cookieStore = await cookies();

  if (isE2EAuthEnabled(cookieStore.get(E2E_AUTH_COOKIE)?.value)) {
    if (eventId === "denied") {
      return <SurveyPresentationAccessDenied />;
    }

    return (
      <SurveyPresentationView
        eventId={eventId}
        eventName="Quarterly Briefing"
        fixtureMode
        result={e2eSurveyResult(eventId, surveyId)}
      />
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  let presentation: Awaited<ReturnType<typeof getPresentationSurveyResults>>;

  try {
    presentation = await getPresentationSurveyResults(user.id, eventId, surveyId);
  } catch {
    return <SurveyPresentationAccessDenied />;
  }

  return (
    <SurveyPresentationView
      eventId={eventId}
      eventName={presentation.access.event.name}
      key={`${presentation.result.id}:${presentation.result.lastUpdated}:${presentation.result.responseCount}`}
      result={presentation.result}
    />
  );
}

function SurveyPresentationAccessDenied() {
  return (
    <div className="grid max-w-3xl gap-4">
      <h1 className="text-[28px] font-semibold leading-[1.2] text-slate-900">Survey presentation</h1>
      <div className="rounded-[6px] border border-red-700 bg-white p-4" role="alert">
        <p className="text-base font-semibold leading-6 text-red-700">
          You do not have access to survey presentation view for this event.
        </p>
        <p className="mt-1 text-sm leading-[1.4] text-slate-600">
          Ask the organiser to add you as a speaker, moderator, or organiser.
        </p>
      </div>
      <a href="/dashboard">
        <Button variant="secondary">Back to dashboard</Button>
      </a>
    </div>
  );
}

function e2eSurveyResult(eventId: string, surveyId: string): SurveyResult {
  return {
    id: surveyId,
    lastUpdated: "2026-05-30T00:13:00.000Z",
    presentationHref: `/events/${eventId}/presentation/surveys/${surveyId}`,
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
      {
        chartData: [
          { count: 1, label: "Budget", percentage: 50 },
          { count: 2, label: "Risks", percentage: 100 },
        ],
        id: "question-select",
        openTextResponses: [],
        options: [
          { id: "option-budget", label: "Budget", position: 0 },
          { id: "option-risks", label: "Risks", position: 1 },
        ],
        position: 1,
        prompt: "Which topics should we expand?",
        ratingScale: null,
        responseCount: 2,
        type: "multiple_select",
      },
      {
        chartData: [
          { count: 0, label: "Agree", percentage: 0 },
          { count: 0, label: "Disagree", percentage: 0 },
        ],
        id: "question-zero",
        openTextResponses: [],
        options: [
          { id: "option-agree", label: "Agree", position: 0 },
          { id: "option-disagree", label: "Disagree", position: 1 },
        ],
        position: 2,
        prompt: "Should we repeat this format?",
        ratingScale: null,
        responseCount: 0,
        type: "multiple_choice",
      },
    ],
  };
}
