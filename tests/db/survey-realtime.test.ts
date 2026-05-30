import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const surveyRealtimeMigration = readFileSync(
  "supabase/migrations/202605300304_survey_realtime.sql",
  "utf8",
).toLowerCase();
const surveyRealtimeFixMigration = readFileSync(
  "supabase/migrations/202605300306_survey_review_fixes.sql",
  "utf8",
).toLowerCase();
const qnaRealtimeMigration = readFileSync(
  "supabase/migrations/202605220204_qna_realtime.sql",
  "utf8",
).toLowerCase();

describe("survey realtime publication migration", () => {
  it("keeps only sanitized survey metadata in the browser realtime publication", () => {
    expect(surveyRealtimeMigration).toContain("pg_publication");
    expect(surveyRealtimeMigration).toContain("supabase_realtime");
    expect(surveyRealtimeMigration).toContain("tablename = 'surveys'");
    expect(surveyRealtimeMigration).toContain("alter publication supabase_realtime add table public.surveys");

    for (const table of ["survey_responses", "survey_answers"]) {
      expect(surveyRealtimeFixMigration).toContain(`tablename = '${table}'`);
      expect(surveyRealtimeFixMigration).toContain(`alter publication supabase_realtime drop table public.${table}`);
    }
  });

  it("keeps the existing Q&A realtime publication tables intact", () => {
    for (const table of ["questions", "question_votes", "moderation_actions"]) {
      expect(qnaRealtimeMigration).toContain(`tablename = '${table}'`);
      expect(qnaRealtimeMigration).toContain(`alter publication supabase_realtime add table public.${table}`);
      expect(surveyRealtimeFixMigration).not.toContain(`drop table public.${table}`);
      expect(surveyRealtimeFixMigration).not.toContain(`drop publication`);
    }
  });
});
