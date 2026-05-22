import { Suspense } from "react";

import { EventDashboard } from "@/components/events/EventDashboard";
import type { DashboardEvent } from "@/components/events/EventDashboard";
import { buildJoinLink, listAccessibleEvents } from "@/lib/events/events";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const E2E_EVENTS: DashboardEvent[] = [
  {
    id: "event-1",
    name: "Quarterly Briefing",
    join_code: "QSB2X9ZA",
    starts_at: "2099-06-01T01:00:00.000Z",
    time_zone: "Asia/Kuala_Lumpur",
    status: "draft",
    identity_mode: "name_required",
    moderation_enabled: true,
    question_character_limit: 280,
    duplicate_block_enabled: true,
    question_rate_limit_seconds: 30,
    created_by: "e2e-user",
    join_link: "http://127.0.0.1:3000/join/QSB2X9ZA",
  },
  {
    id: "event-2",
    name: "Town Hall",
    join_code: "QSB7HALL",
    starts_at: "2099-07-15T02:00:00.000Z",
    time_zone: "Asia/Kuala_Lumpur",
    status: "active",
    identity_mode: "anonymous",
    moderation_enabled: true,
    question_character_limit: 280,
    duplicate_block_enabled: true,
    question_rate_limit_seconds: 30,
    created_by: "e2e-user",
    join_link: "http://127.0.0.1:3000/join/QSB7HALL",
  },
];

function toDashboardEvents(events: Awaited<ReturnType<typeof listAccessibleEvents>>) {
  return events.map((event) => ({
    ...event,
    join_link: buildJoinLink(event.join_code),
  }));
}

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getStringParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function getE2ECreatedEvent(
  params: Record<string, string | string[] | undefined>,
): DashboardEvent | null {
  const createdName = getStringParam(params, "createdName")?.trim();
  const createdCode = getStringParam(params, "createdCode")?.trim();

  if (!createdName || !createdCode) return null;

  return {
    id: "event-created",
    name: createdName,
    join_code: createdCode,
    starts_at: "2099-08-20T02:30:00.000Z",
    time_zone: "Asia/Kuala_Lumpur",
    status: "draft",
    identity_mode: "name_email_required",
    moderation_enabled: true,
    question_character_limit: 280,
    duplicate_block_enabled: true,
    question_rate_limit_seconds: 30,
    created_by: "e2e-user",
    join_link: `http://127.0.0.1:3000/join/${createdCode}`,
  };
}

async function loadDashboardEvents(params: Record<string, string | string[] | undefined>) {
  if (process.env.QSB_ASK_E2E_AUTH === "1") {
    const createdEvent = getE2ECreatedEvent(params);
    return { events: createdEvent ? [createdEvent, ...E2E_EVENTS] : E2E_EVENTS };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { events: [], error: "Events could not be loaded. Refresh the page or try again." };
  }

  try {
    return { events: toDashboardEvents(await listAccessibleEvents(user.id)) };
  } catch (loadError) {
    return {
      events: [],
      error: loadError instanceof Error ? loadError.message : "Events could not be loaded.",
    };
  }
}

async function DashboardContent({ searchParams }: DashboardPageProps) {
  const params = (await searchParams) ?? {};
  const { error, events } = await loadDashboardEvents(params);

  return <EventDashboard error={error} events={events} />;
}

export default function DashboardPage({ searchParams }: DashboardPageProps) {
  return (
    <Suspense fallback={<EventDashboard events={[]} loading />}>
      <DashboardContent searchParams={searchParams} />
    </Suspense>
  );
}
