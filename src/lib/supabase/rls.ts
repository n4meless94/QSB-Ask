import type { EventRole, QuestionStatus, SurveyStatus } from "@/types/app";

export const EVENT_MANAGEMENT_ROLES = ["organiser"] as const satisfies readonly EventRole[];
export const MODERATION_ROLES = ["organiser", "moderator"] as const satisfies readonly EventRole[];
export const PRESENTER_ROLES = ["organiser", "moderator", "speaker"] as const satisfies readonly EventRole[];

export const PUBLIC_QUESTION_STATUSES = ["live", "answered"] as const satisfies readonly QuestionStatus[];
export const PARTICIPANT_SURVEY_STATUSES = ["published"] as const satisfies readonly SurveyStatus[];

export type PublicQuestionStatus = (typeof PUBLIC_QUESTION_STATUSES)[number];

export function isPublicQuestionStatus(status: QuestionStatus): status is PublicQuestionStatus {
  return PUBLIC_QUESTION_STATUSES.includes(status as PublicQuestionStatus);
}
