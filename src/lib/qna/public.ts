import "server-only";

import { validateParticipantSession } from "@/lib/participants/session";
import { PUBLIC_QUESTION_STATUSES } from "@/lib/supabase/rls";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PublicQuestion = {
  current_text: string;
  id: string;
  is_edited: boolean;
  status: "live" | "answered";
  submitted_at: string;
  updated_at: string;
  vote_count: number;
};

export type PublicQuestionSort = "popular" | "recent";

type ListPublicQuestionsOptions = {
  participantToken?: string;
  sort?: PublicQuestionSort;
};

function orderPublicQuestions(
  query: ReturnType<Awaited<ReturnType<typeof createSupabaseServerClient>>["from"]>,
  sort: PublicQuestionSort,
) {
  if (sort === "recent") {
    return query.order("submitted_at", { ascending: false });
  }

  const orderedByVotes = query.order("vote_count", { ascending: false });

  if (typeof orderedByVotes.order !== "function") {
    return orderedByVotes;
  }

  return orderedByVotes.order("submitted_at", { ascending: false });
}

export async function listPublicQuestions(
  eventId: string,
  options: ListPublicQuestionsOptions = {},
): Promise<PublicQuestion[]> {
  const supabase = options.participantToken
    ? createSupabaseAdminClient()
    : await createSupabaseServerClient();

  if (options.participantToken) {
    await validateParticipantSession(eventId, options.participantToken);
  }

  const query = supabase
    .from("questions")
    .select("id,current_text,status,vote_count,is_edited,submitted_at,updated_at")
    .eq("event_id", eventId)
    .in("status", PUBLIC_QUESTION_STATUSES);
  const { data, error } = await orderPublicQuestions(query, options.sort ?? "popular");

  if (error) {
    throw new Error("Approved questions could not be loaded.");
  }

  return (data ?? []) as PublicQuestion[];
}
