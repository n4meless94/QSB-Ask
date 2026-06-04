import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type LandingEventRow = Pick<
  Tables<"events">,
  "id" | "name" | "join_code" | "starts_at" | "ends_at" | "time_zone" | "status" | "created_by"
>;

export type LandingEventStatus = "live" | "starting-soon" | "upcoming" | "completed";

export type LandingEvent = LandingEventRow & {
  portalStatus: LandingEventStatus;
  startsAt: Date;
  endsAt: Date | null;
};

type EventMembershipRow = {
  events: LandingEventRow | LandingEventRow[] | null;
};

const STARTING_SOON_WINDOW_MS = 15 * 60 * 1000;

function toDate(value: string) {
  return new Date(value);
}

export function getLandingEventStatus(
  event: Pick<LandingEventRow, "starts_at" | "ends_at" | "status">,
  now = new Date(),
): LandingEventStatus | null {
  const startsAt = toDate(event.starts_at);
  const endsAt = event.ends_at ? toDate(event.ends_at) : null;

  if (event.status === "ended" || event.status === "archived" || (endsAt && endsAt <= now)) {
    return "completed";
  }

  if (event.status !== "active") {
    return null;
  }

  if (startsAt <= now && (!endsAt || endsAt > now)) {
    return "live";
  }

  const msUntilStart = startsAt.getTime() - now.getTime();

  if (msUntilStart > 0 && msUntilStart <= STARTING_SOON_WINDOW_MS) {
    return "starting-soon";
  }

  if (msUntilStart > STARTING_SOON_WINDOW_MS) {
    return "upcoming";
  }

  return null;
}

function decorateEvent(event: LandingEventRow, now: Date): LandingEvent | null {
  const portalStatus = getLandingEventStatus(event, now);

  if (!portalStatus) return null;

  return {
    ...event,
    portalStatus,
    startsAt: toDate(event.starts_at),
    endsAt: event.ends_at ? toDate(event.ends_at) : null,
  };
}

function statusRank(status: LandingEventStatus) {
  if (status === "live") return 0;
  if (status === "starting-soon") return 1;
  if (status === "upcoming") return 2;
  return 3;
}

export function splitLandingEvents(events: LandingEventRow[], now = new Date()) {
  const decorated = events.flatMap((event) => {
    const next = decorateEvent(event, now);
    return next ? [next] : [];
  });

  const activeUpcoming = decorated
    .filter((event) => event.portalStatus !== "completed")
    .sort((a, b) => {
      const statusDelta = statusRank(a.portalStatus) - statusRank(b.portalStatus);
      return statusDelta || a.startsAt.getTime() - b.startsAt.getTime();
    })
    .slice(0, 3);

  const recent = decorated
    .filter((event) => event.portalStatus === "completed")
    .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())
    .slice(0, 5);

  return { activeUpcoming, recent };
}

export async function listLandingEventsForUser(userId: string) {
  if (!userId) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("event_members")
    .select("events(id,name,join_code,starts_at,ends_at,time_zone,status,created_by)")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Events could not be loaded. Refresh the page or try again.");
  }

  return ((data ?? []) as EventMembershipRow[])
    .flatMap((row) => (Array.isArray(row.events) ? row.events : row.events ? [row.events] : []))
    .filter((event) => event.created_by === userId || Boolean(event.id));
}
