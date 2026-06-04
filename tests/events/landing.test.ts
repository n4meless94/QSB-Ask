import { describe, expect, it, vi } from "vitest";

import { getLandingEventStatus, splitLandingEvents, type LandingEventRow } from "@/lib/events/landing";

vi.mock("server-only", () => ({}));

function event(overrides: Partial<LandingEventRow>): LandingEventRow {
  return {
    created_by: "user-1",
    ends_at: null,
    id: overrides.id ?? "event-1",
    join_code: "QSB2X9ZA",
    name: overrides.name ?? "Real event",
    starts_at: "2026-06-04T02:00:00.000Z",
    status: "active",
    time_zone: "Asia/Kuala_Lumpur",
    ...overrides,
  };
}

describe("landing event status", () => {
  const now = new Date("2026-06-04T02:00:00.000Z");

  it("marks active events in progress as live", () => {
    expect(
      getLandingEventStatus(
        event({
          ends_at: "2026-06-04T03:00:00.000Z",
          starts_at: "2026-06-04T01:00:00.000Z",
        }),
        now,
      ),
    ).toBe("live");
  });

  it("marks active events within 15 minutes as starting soon", () => {
    expect(
      getLandingEventStatus(
        event({
          starts_at: "2026-06-04T02:10:00.000Z",
        }),
        now,
      ),
    ).toBe("starting-soon");
  });

  it("marks active future events as upcoming", () => {
    expect(
      getLandingEventStatus(
        event({
          starts_at: "2026-06-04T04:00:00.000Z",
        }),
        now,
      ),
    ).toBe("upcoming");
  });

  it("marks ended events as completed", () => {
    expect(
      getLandingEventStatus(
        event({
          starts_at: "2026-06-03T02:00:00.000Z",
          status: "ended",
        }),
        now,
      ),
    ).toBe("completed");
  });

  it("sorts active events before starting soon and upcoming, then recent by newest first", () => {
    const result = splitLandingEvents(
      [
        event({ id: "upcoming", starts_at: "2026-06-04T05:00:00.000Z" }),
        event({ id: "completed-old", starts_at: "2026-06-01T05:00:00.000Z", status: "ended" }),
        event({ id: "live", ends_at: "2026-06-04T03:00:00.000Z", starts_at: "2026-06-04T01:00:00.000Z" }),
        event({ id: "starting", starts_at: "2026-06-04T02:05:00.000Z" }),
        event({ id: "completed-new", starts_at: "2026-06-03T05:00:00.000Z", status: "ended" }),
      ],
      now,
    );

    expect(result.activeUpcoming.map((item) => item.id)).toEqual(["live", "starting", "upcoming"]);
    expect(result.recent.map((item) => item.id)).toEqual(["completed-new", "completed-old"]);
  });
});
