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

async function loadDashboardEvents() {
  if (process.env.QSB_ASK_E2E_AUTH === "1") {
    return { events: E2E_EVENTS };
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

async function DashboardContent() {
  const { error, events } = await loadDashboardEvents();

  return <EventDashboard error={error} events={events} />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<EventDashboard events={[]} loading />}>
      <DashboardContent />
    </Suspense>
  );
}
