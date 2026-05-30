import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/202605300302_survey_submission_rpc.sql", "utf8");
const foundation = readFileSync("supabase/migrations/202605220101_foundation_schema.sql", "utf8");

describe("survey submission rpc migration", () => {
  it("defines an atomic submit_survey_response rpc for response and answer rows", () => {
    expect(migration).toMatch(/create or replace function public\.submit_survey_response/i);
    expect(migration).toMatch(/insert into public\.survey_responses/i);
    expect(migration).toMatch(/insert into public\.survey_answers/i);
    expect(migration).toMatch(/returns table \(\s*already_submitted boolean,\s*response_id uuid\s*\)/i);
  });

  it("keeps one response per participant session intact", () => {
    expect(foundation).toContain("constraint survey_responses_one_per_session unique (survey_id, participant_session_id)");
    expect(migration).toMatch(/on conflict on constraint survey_responses_one_per_session/i);
  });

  it("limits rpc execution to the server-side service role", () => {
    expect(migration).toMatch(/revoke execute on function public\.submit_survey_response\(uuid, uuid, jsonb\) from public, anon, authenticated/i);
    expect(migration).toMatch(/grant execute on function public\.submit_survey_response\(uuid, uuid, jsonb\) to service_role/i);
  });
});
