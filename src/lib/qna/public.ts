import "server-only";

import { PUBLIC_QUESTION_STATUSES } from "@/lib/supabase/rls";
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

export async function listPublicQuestions(eventId: string): Promise<PublicQuestion[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("questions")
    .select("id,current_text,status,vote_count,is_edited,submitted_at,updated_at")
    .eq("event_id", eventId)
    .in("status", PUBLIC_QUESTION_STATUSES)
    .order("vote_count", { ascending: false });

  if (error) {
    throw new Error("Approved questions could not be loaded.");
  }

  return (data ?? []) as PublicQuestion[];
}
