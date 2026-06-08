/**
 * Timezone-aware conversion between UTC instants and HTML
 * `datetime-local` wall-clock strings (`YYYY-MM-DDTHH:mm`).
 *
 * `datetime-local` inputs are zoneless: the browser neither knows nor cares
 * which timezone the value represents. The event timezone (`event.time_zone`,
 * e.g. `Asia/Kuala_Lumpur`) is the source of truth, so all conversion goes
 * through these helpers instead of `Date#toISOString` (which assumes UTC) or
 * `new Date(localString)` (which assumes the server's local zone).
 */

/**
 * Returns the offset (in minutes) of `timeZone` at the given UTC instant.
 * Positive means ahead of UTC (e.g. +480 for UTC+8).
 */
function timeZoneOffsetMinutes(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const lookup: Record<string, number> = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      lookup[part.type] = Number(part.value);
    }
  }

  // The wall-clock time the zone shows for this UTC instant, treated as if UTC.
  const asUtc = Date.UTC(
    lookup.year,
    lookup.month - 1,
    lookup.day,
    lookup.hour === 24 ? 0 : lookup.hour,
    lookup.minute,
    lookup.second,
  );

  return Math.round((asUtc - date.getTime()) / 60000);
}

/**
 * Convert a UTC ISO instant into a `datetime-local` string (`YYYY-MM-DDTHH:mm`)
 * representing the wall-clock time in `timeZone`.
 *
 * Use for populating `<input type="datetime-local">` default values so the
 * field shows the same wall-clock time as zone-aware displays elsewhere.
 */
export function utcToZonedDatetimeLocal(utcIso: string, timeZone: string): string {
  const date = new Date(utcIso);

  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const lookup: Record<string, string> = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      lookup[part.type] = part.value;
    }
  }

  const hour = lookup.hour === "24" ? "00" : lookup.hour;

  return `${lookup.year}-${lookup.month}-${lookup.day}T${hour}:${lookup.minute}`;
}

/**
 * Convert a `datetime-local` string (`YYYY-MM-DDTHH:mm`) interpreted as
 * wall-clock time in `timeZone` into a UTC ISO instant.
 *
 * Use when persisting form input so the stored `timestamptz` matches the
 * organiser's intended local time, independent of server zone.
 */
export function zonedDatetimeLocalToUtc(localString: string, timeZone: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(localString.trim());

  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match;

  // Treat the wall-clock components as if they were UTC, then correct by the
  // zone's offset at that instant. Two passes handle DST boundaries where the
  // offset depends on the instant we are computing.
  const naiveUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    second ? Number(second) : 0,
  );

  const firstOffset = timeZoneOffsetMinutes(new Date(naiveUtc), timeZone);
  const firstGuess = naiveUtc - firstOffset * 60000;
  const secondOffset = timeZoneOffsetMinutes(new Date(firstGuess), timeZone);
  const utcMs = naiveUtc - secondOffset * 60000;

  return new Date(utcMs).toISOString();
}
