import "server-only";

import { getPresenterEventAccess, type EventAccessContext } from "@/lib/events/access";
import type { PublicQuestion } from "@/lib/qna/public";
import { PUBLIC_QUESTION_STATUSES } from "@/lib/supabase/rls";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PresenterQuestionsResult = {
  access: EventAccessContext;
  questions: PublicQuestion[];
};

const PRESENTER_QUESTION_SELECT =
  "id,current_text,status,vote_count,is_edited,submitted_at,updated_at";

export async function getPresenterQuestions(
  userId: string,
  eventId: string,
): Promise<PresenterQuestionsResult> {
  const access = await getPresenterEventAccess(userId, eventId);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("questions")
    .select(PRESENTER_QUESTION_SELECT)
    .eq("event_id", eventId)
    .in("status", PUBLIC_QUESTION_STATUSES)
    .order("vote_count", { ascending: false });

  if (error) {
    throw new Error("Presenter questions could not be loaded.");
  }

  return {
    access,
    questions: (data ?? []) as PublicQuestion[],
  };
}
