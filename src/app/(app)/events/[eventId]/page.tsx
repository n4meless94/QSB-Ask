import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { EventAccessPanel } from "@/components/events/EventAccessPanel";
import { EventSettingsPanel } from "@/components/events/EventSettingsPanel";
import { EventWorkspace } from "@/components/events/EventWorkspace";
import { ModeratorQueue } from "@/components/qna/ModeratorQueue";
import { ExportPanel } from "@/components/surveys/ExportPanel";
import { SurveyEditor } from "@/components/surveys/SurveyEditor";
import { SurveyList } from "@/components/surveys/SurveyList";
import { SurveyResultsPanel } from "@/components/surveys/SurveyResultsPanel";
import { Button } from "@/components/ui/Button";
import { E2E_AUTH_COOKIE, isE2EAuthEnabled } from "@/lib/auth/e2e";
import {
  assertEventRole,
  listEventMembersForOrganiser,
  type EventAccessContext,
  type EventMemberSummary,
} from "@/lib/events/access";
import {
  listModerationHistory,
  listModerationQuestions,
  type ModerationHistoryEntry,
  type ModerationQuestion,
} from "@/lib/qna/moderation";
import { getOrganiserExportCounts, type ExportCounts } from "@/lib/surveys/export";
import { getOrganiserSurveyResults, type SurveyResult } from "@/lib/surveys/results";
import { listSurveysForOrganiser, type SurveySummary } from "@/lib/surveys/management";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PRESENTER_ROLES } from "@/lib/supabase/rls";
import type { EventRole } from "@/types/app";

type EventDetailPageProps = {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{
    resultSurveyId?: string;
    surveyId?: string;
    tab?: string;
  }>;
};

type WorkspaceTab = "qa" | "surveys" | "results" | "exports" | "access" | "settings" | "presenter";

function workspaceTabFromQuery(value: string | undefined): WorkspaceTab {
  if (
    value === "surveys" ||
    value === "results" ||
    value === "exports" ||
    value === "access" ||
    value === "settings" ||
    value === "presenter"
  ) {
    return value;
  }

  return "qa";
}

export default async function EventDetailPage({ params, searchParams }: EventDetailPageProps) {
  const { eventId } = await params;
  const query = await searchParams;
  const cookieStore = await cookies();

  if (isE2EAuthEnabled(cookieStore.get(E2E_AUTH_COOKIE)?.value)) {
    return (
      <EventDetailContent
        access={e2eAccess(eventId)}
        fixtureMode
        history={e2eModerationHistory()}
        exportCounts={e2eExportCounts(eventId)}
        members={e2eMembers()}
        moderationQuestions={e2eModerationQuestions()}
        results={e2eSurveyResults(eventId)}
        resultSurveyId={query.resultSurveyId}
        selectedTab={workspaceTabFromQuery(query.tab)}
        surveyId={query.surveyId}
        surveys={e2eSurveys(eventId)}
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

  let access: EventAccessContext;
  let exportCounts: ExportCounts = zeroExportCounts();
  let members: EventMemberSummary[] = [];
  let moderationQuestions: ModerationQuestion[] = [];
  let history: ModerationHistoryEntry[] = [];
  let results: SurveyResult[] = [];
  let surveys: SurveySummary[] = [];

  try {
    access = await assertEventRole(user.id, eventId, PRESENTER_ROLES);

    const organiserLoaders =
      access.role === "organiser"
        ? Promise.all([
            listEventMembersForOrganiser(user.id, eventId),
            listSurveysForOrganiser(user.id, eventId),
            getOrganiserSurveyResults(user.id, eventId),
            getOrganiserExportCounts(user.id, eventId),
          ])
        : Promise.resolve([[], [], [], zeroExportCounts()] as [
            EventMemberSummary[],
            SurveySummary[],
            SurveyResult[],
            ExportCounts,
          ]);

    const moderationLoaders = canModerate(access.role)
      ? Promise.all([
          listModerationQuestions(user.id, eventId, { sort: "most_recent", status: "pending" }),
          listModerationQuestions(user.id, eventId, { sort: "most_recent", status: "live" }),
          listModerationQuestions(user.id, eventId, { sort: "most_recent", status: "answered" }),
          listModerationQuestions(user.id, eventId, { sort: "most_recent", status: "archived" }),
          listModerationHistory(user.id, eventId),
        ])
      : Promise.resolve([[], [], [], [], []] as [
          ModerationQuestion[],
          ModerationQuestion[],
          ModerationQuestion[],
          ModerationQuestion[],
          ModerationHistoryEntry[],
        ]);

    const [[loadedMembers, loadedSurveys, loadedResults, loadedExportCounts], [pending, live, answered, archived, actionHistory]] =
      await Promise.all([organiserLoaders, moderationLoaders]);

    members = loadedMembers;
    surveys = loadedSurveys;
    results = loadedResults;
    exportCounts = loadedExportCounts;
    moderationQuestions = [...pending, ...live, ...answered, ...archived];
    history = actionHistory;
  } catch {
    return (
      <div className="grid max-w-3xl gap-4">
        <h1 className="text-[28px] font-semibold leading-[1.2] text-slate-900">Event access</h1>
        <div className="rounded-[6px] border border-red-700 bg-white p-4" role="alert">
          <p className="text-base font-semibold leading-6 text-red-700">
            You do not have access to this event.
          </p>
          <p className="mt-1 text-sm leading-[1.4] text-slate-600">
            Return to the dashboard and choose an event from your accessible list.
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="secondary">Back to dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <EventDetailContent
      access={access}
      exportCounts={exportCounts}
      history={history}
      members={members}
      moderationQuestions={moderationQuestions}
      results={results}
      resultSurveyId={query.resultSurveyId}
      selectedTab={workspaceTabFromQuery(query.tab)}
      surveyId={query.surveyId}
      surveys={surveys}
    />
  );
}

function EventDetailContent({
  access,
  fixtureMode = false,
  exportCounts,
  history,
  members,
  moderationQuestions,
  results,
  resultSurveyId,
  selectedTab,
  surveyId,
  surveys,
}: {
  access: EventAccessContext;
  fixtureMode?: boolean;
  exportCounts: ExportCounts;
  history: ModerationHistoryEntry[];
  members: EventMemberSummary[];
  moderationQuestions: ModerationQuestion[];
  results: SurveyResult[];
  resultSurveyId?: string;
  selectedTab: WorkspaceTab;
  surveyId?: string;
  surveys: SurveySummary[];
}) {
  const selectedSurvey = surveys.find((survey) => survey.id === surveyId) ?? surveys[0];
  const selectedResult = results.find((result) => result.id === resultSurveyId) ?? results[0];

  return (
    <EventWorkspace
      access={access}
      accessPanel={<EventAccessPanel eventId={access.event.id} members={members} role={access.role} />}
      exportsPanel={
        access.role === "organiser" ? (
          <ExportPanel counts={exportCounts} eventId={access.event.id} />
        ) : (
          <section className="grid gap-2 rounded-[6px] border border-slate-300 bg-white p-4 sm:p-6">
            <h2 className="text-[20px] font-semibold leading-[1.25] text-slate-900">CSV exports</h2>
            <p className="text-base leading-6 text-slate-700">
              Only organisers can export event records.
            </p>
          </section>
        )
      }
      initialTab={selectedTab}
      qnaPanel={
        canModerate(access.role) ? (
          <ModeratorQueue
            eventId={access.event.id}
            fixtureMode={fixtureMode}
            history={history}
            questions={moderationQuestions}
          />
        ) : (
          <section className="grid gap-2 rounded-[6px] border border-slate-300 bg-white p-4 sm:p-6">
            <h2 className="text-[20px] font-semibold leading-[1.25] text-slate-900">Q&A workspace</h2>
            <p className="text-base leading-6 text-slate-700">
              Speakers use Presenter View for approved questions only. Moderation controls are not
              available to this role.
            </p>
          </section>
        )
      }
      resultsPanel={
        access.role === "organiser" ? (
          <SurveyResultsPanel
            eventId={access.event.id}
            results={results}
            selectedResultId={selectedResult?.id}
          />
        ) : (
          <section className="grid gap-2 rounded-[6px] border border-slate-300 bg-white p-4 sm:p-6">
            <h2 className="text-[20px] font-semibold leading-[1.25] text-slate-900">Results</h2>
            <p className="text-base leading-6 text-slate-700">
              Only organisers can view survey response counts and open text responses.
            </p>
          </section>
        )
      }
      settingsPanel={<EventSettingsPanel event={access.event} role={access.role} />}
      surveysPanel={
        access.role === "organiser" ? (
          <section
            aria-labelledby="surveys-workspace-heading"
            className="grid gap-5 rounded-[6px] border border-slate-300 bg-white p-4 sm:p-6"
          >
            <div className="grid gap-1">
              <h2
                className="text-[20px] font-semibold leading-[1.25] text-slate-900"
                id="surveys-workspace-heading"
              >
                Survey authoring
              </h2>
              <p className="text-sm leading-[1.4] text-slate-600">
                Organisers control survey drafts, lifecycle, and participant result visibility.
              </p>
            </div>
            <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
              <SurveyList
                eventId={access.event.id}
                selectedSurveyId={selectedSurvey?.id}
                surveys={surveys}
              />
              <SurveyEditor eventId={access.event.id} survey={selectedSurvey} />
            </div>
          </section>
        ) : (
          <section className="grid gap-2 rounded-[6px] border border-slate-300 bg-white p-4 sm:p-6">
            <h2 className="text-[20px] font-semibold leading-[1.25] text-slate-900">Surveys</h2>
            <p className="text-base leading-6 text-slate-700">
              Only organisers can create and manage surveys for this event.
            </p>
          </section>
        )
      }
    />
  );
}

function canModerate(role: EventRole) {
  return role === "organiser" || role === "moderator";
}

function zeroExportCounts(): ExportCounts {
  return {
    moderation: 0,
    questions: 0,
    "survey-responses": 0,
  };
}

function e2eAccess(eventId: string): EventAccessContext {
  const id = eventId || "event-1";
  const role = id === "event-moderator" ? "moderator" : id === "event-speaker" ? "speaker" : "organiser";

  return {
    event: {
      id,
      name: id === "event-1" ? "Quarterly Briefing" : "Town Hall",
      join_code: "QSB2X9ZA",
      starts_at: "2099-06-01T01:00:00.000Z",
      time_zone: "Asia/Kuala_Lumpur",
      status: "draft",
      identity_mode: "name_required",
      moderation_enabled: true,
      question_character_limit: 280,
      duplicate_block_enabled: true,
      question_rate_limit_seconds: 30,
      created_by: "organiser-1",
      joinLink: "http://127.0.0.1:3000/join/QSB2X9ZA",
    },
    membership: {
      created_at: "2026-05-22T00:00:00.000Z",
      event_id: id,
      id: "member-owner",
      invited_email: null,
      role,
      status: "active",
      user_id: `${role}-1`,
    },
    role,
  };
}

function e2eSurveys(eventId: string): SurveySummary[] {
  if (eventId === "event-moderator" || eventId === "event-speaker") {
    return [];
  }

  return [
    {
      created_at: "2026-05-30T00:00:00.000Z",
      event_id: eventId || "event-1",
      id: "survey-1",
      questions: [],
      results_visible_to_participants: false,
      status: "draft",
      title: "Pulse check",
      updated_at: "2026-05-30T00:00:00.000Z",
    },
  ];
}

function e2eExportCounts(eventId: string): ExportCounts {
  if (eventId === "event-moderator" || eventId === "event-speaker" || eventId === "event-empty-exports") {
    return zeroExportCounts();
  }

  if (eventId === "event-export") {
    return {
      moderation: 0,
      questions: 2,
      "survey-responses": 3,
    };
  }

  return {
    moderation: 1,
    questions: 2,
    "survey-responses": 2,
  };
}

function e2eSurveyResults(eventId: string): SurveyResult[] {
  if (eventId === "event-moderator" || eventId === "event-speaker") {
    return [];
  }

  return [
    {
      id: "survey-1",
      lastUpdated: "2026-05-30T00:13:00.000Z",
      presentationHref: `/events/${eventId || "event-1"}/presentation/surveys/survey-1`,
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
            { count: 0, label: "1", percentage: 0 },
            { count: 0, label: "2", percentage: 0 },
            { count: 0, label: "3", percentage: 0 },
            { count: 2, label: "4", percentage: 67 },
            { count: 1, label: "5", percentage: 33 },
          ],
          id: "question-rating",
          openTextResponses: [],
          options: [],
          position: 2,
          prompt: "Rate the session",
          ratingScale: 5,
          responseCount: 3,
          type: "rating",
        },
        {
          chartData: [],
          id: "question-text",
          openTextResponses: [
            {
              label: "Response 1",
              submittedAt: "2026-05-30T00:11:00.000Z",
              text: "Need more budget detail.",
            },
            {
              label: "Response 2",
              submittedAt: "2026-05-30T00:12:00.000Z",
              text: "Timeline please.",
            },
          ],
          options: [],
          position: 3,
          prompt: "What should we clarify next?",
          ratingScale: null,
          responseCount: 2,
          type: "open_text",
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
          position: 4,
          prompt: "Should we repeat this format?",
          ratingScale: null,
          responseCount: 0,
          type: "multiple_choice",
        },
      ],
    },
  ];
}

function e2eMembers(): EventMemberSummary[] {
  return [
    {
      created_at: "2026-05-22T00:00:00.000Z",
      displayName: "Organiser",
      email: "organiser@qsb.com",
      id: "member-owner",
      invited_email: null,
      isOriginalOrganiser: true,
      role: "organiser",
      status: "active",
      user_id: "organiser-1",
    },
    {
      created_at: "2026-05-22T00:01:00.000Z",
      displayName: "Moderator",
      email: "moderator@qsb.com",
      id: "member-moderator",
      invited_email: "moderator@qsb.com",
      isOriginalOrganiser: false,
      role: "moderator",
      status: "invited",
      user_id: null,
    },
  ];
}

function e2eModerationQuestions(): ModerationQuestion[] {
  return [
    {
      current_text: "Will slides be shared?",
      id: "question-pending-1",
      is_edited: false,
      participantEmail: "aina@qsb.com",
      participantIdentity: "Aina",
      previous_status: null,
      status: "pending",
      submitted_at: "2026-05-26T01:00:00.000Z",
      updated_at: "2026-05-26T01:00:00.000Z",
      vote_count: 4,
    },
    {
      current_text: "Can we get lunch timing?",
      id: "question-pending-2",
      is_edited: false,
      participantEmail: null,
      participantIdentity: "Anonymous",
      previous_status: null,
      status: "pending",
      submitted_at: "2026-05-26T01:02:00.000Z",
      updated_at: "2026-05-26T01:02:00.000Z",
      vote_count: 1,
    },
    {
      current_text: "How will follow-up actions be shared?",
      id: "question-live-1",
      is_edited: false,
      participantEmail: null,
      participantIdentity: "Anonymous",
      previous_status: null,
      status: "live",
      submitted_at: "2026-05-26T00:50:00.000Z",
      updated_at: "2026-05-26T00:50:00.000Z",
      vote_count: 8,
    },
    {
      current_text: "Who owns the next briefing?",
      id: "question-answered-1",
      is_edited: false,
      participantEmail: null,
      participantIdentity: "Anonymous",
      previous_status: null,
      status: "answered",
      submitted_at: "2026-05-26T00:40:00.000Z",
      updated_at: "2026-05-26T00:45:00.000Z",
      vote_count: 3,
    },
    {
      current_text: "Archived duplicate question",
      id: "question-archived-1",
      is_edited: false,
      participantEmail: null,
      participantIdentity: "Anonymous",
      previous_status: "pending",
      status: "archived",
      submitted_at: "2026-05-26T00:30:00.000Z",
      updated_at: "2026-05-26T00:35:00.000Z",
      vote_count: 0,
    },
  ];
}

function e2eModerationHistory(): ModerationHistoryEntry[] {
  return [
    {
      action: "archive",
      actor_user_id: "moderator-1",
      created_at: "2026-05-26T00:35:00.000Z",
      from_status: "pending",
      id: "history-1",
      metadata: {},
      question_id: "question-archived-1",
      to_status: "archived",
    },
  ];
}
