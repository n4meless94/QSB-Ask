import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const surveyRealtimeMigration = readFileSync(
  "supabase/migrations/202605300304_survey_realtime.sql",
  "utf8",
).toLowerCase();
const qnaRealtimeMigration = readFileSync(
  "supabase/migrations/202605220204_qna_realtime.sql",
  "utf8",
).toLowerCase();

describe("survey realtime publication migration", () => {
  it("adds survey result tables to the Supabase Realtime publication idempotently", () => {
    expect(surveyRealtimeMigration).toContain("pg_publication");
    expect(surveyRealtimeMigration).toContain("supabase_realtime");

    for (const table of ["surveys", "survey_responses", "survey_answers"]) {
      expect(surveyRealtimeMigration).toContain(`tablename = '${table}'`);
      expect(surveyRealtimeMigration).toContain(`alter publication supabase_realtime add table public.${table}`);
    }
  });

  it("keeps the existing Q&A realtime publication tables intact", () => {
    for (const table of ["questions", "question_votes", "moderation_actions"]) {
      expect(qnaRealtimeMigration).toContain(`tablename = '${table}'`);
      expect(qnaRealtimeMigration).toContain(`alter publication supabase_realtime add table public.${table}`);
      expect(surveyRealtimeMigration).not.toContain(`drop table public.${table}`);
      expect(surveyRealtimeMigration).not.toContain(`drop publication`);
    }
  });
});
