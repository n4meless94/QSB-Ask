export type EventStatus = "draft" | "active" | "ended" | "archived";

export type IdentityMode = "anonymous" | "name_required" | "name_email_required";

export type EventRole = "organiser" | "moderator" | "speaker";

export type MemberStatus = "invited" | "active" | "removed";

export type QuestionStatus = "pending" | "live" | "answered" | "archived";

export type ModerationAction = "approve" | "dismiss" | "edit" | "archive" | "restore" | "mark_answered";

export type SurveyStatus = "draft" | "published" | "closed";

export type SurveyQuestionType = "multiple_choice" | "multiple_select" | "rating" | "open_text";
