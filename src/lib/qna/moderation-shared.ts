import type { Json } from "@/lib/supabase/database.types";
import type { ModerationAction, QuestionStatus } from "@/types/app";

export const STALE_MODERATION_MESSAGE =
  "This question was updated by another moderator. Review the latest version before taking action.";

export type ModerationQueueStatus = QuestionStatus;
export type ModerationSort = "most_recent" | "oldest" | "most_votes";

export type ModerationQuestion = {
  current_text: string;
  id: string;
  is_edited: boolean;
  participantEmail: string | null;
  participantIdentity: string;
  previous_status: QuestionStatus | null;
  status: QuestionStatus;
  submitted_at: string;
  updated_at: string;
  vote_count: number;
};

export type ModerationHistoryEntry = {
  action: ModerationAction;
  actor_user_id: string;
  created_at: string;
  from_status: QuestionStatus | null;
  id: string;
  metadata: Json;
  question_id: string;
  to_status: QuestionStatus | null;
};
