import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "202605220101_foundation_schema.sql",
);

const migration = readFileSync(migrationPath, "utf8").replace(/\s+/g, " ").toLowerCase();

const appTables = [
  "users",
  "events",
  "event_members",
  "participant_sessions",
  "questions",
  "question_versions",
  "question_votes",
  "moderation_actions",
  "surveys",
  "survey_questions",
  "survey_options",
  "survey_responses",
  "survey_answers",
  "login_attempts",
] as const;

function expectSql(fragment: string) {
  expect(migration).toContain(fragment.toLowerCase().replace(/\s+/g, " "));
}

describe("foundation Supabase schema migration", () => {
  it("defines all required v1 foundation tables", () => {
    for (const table of appTables) {
      expectSql(`create table public.${table}`);
    }
  });

  it("defines Phase 1 event fields and defaults", () => {
    for (const field of [
      "name text not null",
      "starts_at timestamptz not null",
      "time_zone text not null",
      "status public.event_status not null default 'draft'",
      "identity_mode public.identity_mode not null default 'anonymous'",
      "moderation_enabled boolean not null default true",
      "question_character_limit integer not null default 280",
      "duplicate_block_enabled boolean not null default true",
      "question_rate_limit_seconds integer not null default 30",
      "join_code text not null",
      "created_by uuid not null",
    ]) {
      expectSql(field);
    }
  });

  it("defines required uniqueness guarantees", () => {
    expectSql("constraint events_join_code_key unique (join_code)");
    expectSql("constraint question_votes_one_per_session unique (question_id, participant_session_id)");
    expectSql("constraint survey_responses_one_per_session unique (survey_id, participant_session_id)");
  });

  it("enables row level security on every application table", () => {
    for (const table of appTables) {
      expectSql(`alter table public.${table} enable row level security`);
    }
  });

  it("limits authenticated event reads to own or active member events", () => {
    expectSql("create policy events_select_for_members on public.events for select to authenticated");
    expectSql("public.is_active_event_member(events.id, auth.uid())");
    expectSql("events.created_by = auth.uid()");
  });

  it("does not expose pending, dismissed, or archived questions to public participant reads", () => {
    expectSql("create policy questions_participant_select_public_visible");
    expectSql("status in ('live', 'answered')");
    expect(migration).not.toMatch(/questions_participant_select_public_visible[^;]+pending/);
    expect(migration).not.toMatch(/questions_participant_select_public_visible[^;]+archived/);
    expect(migration).not.toMatch(/questions_participant_select_public_visible[^;]+dismissed/);
  });
});
