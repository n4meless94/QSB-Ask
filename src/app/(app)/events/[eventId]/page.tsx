import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { EventAccessPanel } from "@/components/events/EventAccessPanel";
import { EventSettingsPanel } from "@/components/events/EventSettingsPanel";
import { EventWorkspace } from "@/components/events/EventWorkspace";
import { ModeratorQueue } from "@/components/qna/ModeratorQueue";
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
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PRESENTER_ROLES } from "@/lib/supabase/rls";
import type { EventRole } from "@/types/app";

type EventDetailPageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { eventId } = await params;
  const cookieStore = await cookies();

  if (isE2EAuthEnabled(cookieStore.get(E2E_AUTH_COOKIE)?.value)) {
    return (
      <EventDetailContent
        access={e2eAccess(eventId)}
        fixtureMode
        history={e2eModerationHistory()}
        members={e2eMembers()}
        moderationQuestions={e2eModerationQuestions()}
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
  let members: EventMemberSummary[];
  let moderationQuestions: ModerationQuestion[] = [];
  let history: ModerationHistoryEntry[] = [];

  try {
    access = await assertEventRole(user.id, eventId, PRESENTER_ROLES);
    members = access.role === "organiser" ? await listEventMembersForOrganiser(user.id, eventId) : [];
    if (canModerate(access.role)) {
      const [pending, live, answered, archived, actionHistory] = await Promise.all([
        listModerationQuestions(user.id, eventId, { sort: "most_recent", status: "pending" }),
        listModerationQuestions(user.id, eventId, { sort: "most_recent", status: "live" }),
        listModerationQuestions(user.id, eventId, { sort: "most_recent", status: "answered" }),
        listModerationQuestions(user.id, eventId, { sort: "most_recent", status: "archived" }),
        listModerationHistory(user.id, eventId),
      ]);
      moderationQuestions = [...pending, ...live, ...answered, ...archived];
      history = actionHistory;
    }
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
      history={history}
      members={members}
      moderationQuestions={moderationQuestions}
    />
  );
}

function EventDetailContent({
  access,
  fixtureMode = false,
  history,
  members,
  moderationQuestions,
}: {
  access: EventAccessContext;
  fixtureMode?: boolean;
  history: ModerationHistoryEntry[];
  members: EventMemberSummary[];
  moderationQuestions: ModerationQuestion[];
}) {
  return (
    <EventWorkspace
      access={access}
      accessPanel={<EventAccessPanel eventId={access.event.id} members={members} role={access.role} />}
      qnaPanel={
        canModerate(access.role) ? (
          <ModeratorQueue
            eventId={access.event.id}
            fixtureMode={fixtureMode}
            history={history}
            key={moderationQuestions.map((question) => `${question.id}:${question.updated_at}:${question.status}`).join("|")}
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
      settingsPanel={<EventSettingsPanel event={access.event} role={access.role} />}
    />
  );
}

function canModerate(role: EventRole) {
  return role === "organiser" || role === "moderator";
}

function e2eAccess(eventId: string): EventAccessContext {
  const id = eventId || "event-1";

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
      role: "organiser",
      status: "active",
      user_id: "organiser-1",
    },
    role: "organiser",
  };
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
