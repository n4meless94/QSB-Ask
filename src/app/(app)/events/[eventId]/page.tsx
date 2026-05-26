import Link from "next/link";
import { redirect } from "next/navigation";

import { EventAccessPanel } from "@/components/events/EventAccessPanel";
import { EventWorkspace } from "@/components/events/EventWorkspace";
import { Button } from "@/components/ui/Button";
import {
  assertEventRole,
  listEventMembersForOrganiser,
  type EventAccessContext,
  type EventMemberSummary,
} from "@/lib/events/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PRESENTER_ROLES } from "@/lib/supabase/rls";

type EventDetailPageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { eventId } = await params;

  if (process.env.QSB_ASK_E2E_AUTH === "1") {
    return <EventDetailContent access={e2eAccess(eventId)} members={e2eMembers()} />;
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

  try {
    access = await assertEventRole(user.id, eventId, PRESENTER_ROLES);
    members = access.role === "organiser" ? await listEventMembersForOrganiser(user.id, eventId) : [];
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

  return <EventDetailContent access={access} members={members} />;
}

function EventDetailContent({
  access,
  members,
}: {
  access: EventAccessContext;
  members: EventMemberSummary[];
}) {
  return (
    <EventWorkspace
      access={access}
      accessPanel={<EventAccessPanel eventId={access.event.id} members={members} role={access.role} />}
    />
  );
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
