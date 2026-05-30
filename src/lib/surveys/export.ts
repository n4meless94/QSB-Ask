import "server-only";

import { assertEventRole } from "@/lib/events/access";
import type { Json, Tables } from "@/lib/supabase/database.types";
import { EVENT_MANAGEMENT_ROLES } from "@/lib/supabase/rls";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const EXPORT_KINDS = ["questions", "moderation", "survey-responses"] as const;

export type ExportKind = (typeof EXPORT_KINDS)[number];

export type ExportCounts = Record<ExportKind, number>;

type CsvValue = boolean | number | string | null | undefined;

export type ExportPayload = {
  csv: string;
  filename: string;
  headers: string[];
  rows: Array<Record<string, CsvValue>>;
};

type ParticipantSession = Pick<
  Tables<"participant_sessions">,
  "display_name" | "email" | "id"
> & {
  session_token_hash?: string;
};

type QuestionRow = Tables<"questions"> & {
  participant_sessions?: ParticipantSession | ParticipantSession[] | null;
};

type QuestionVersionRow = Tables<"question_versions">;
type ModerationActionRow = Tables<"moderation_actions">;
type SurveyRow = Tables<"surveys"> & {
  survey_questions?: SurveyQuestionWithOptions[] | null;
};
type SurveyQuestionRow = Tables<"survey_questions">;
type SurveyOptionRow = Tables<"survey_options">;
type SurveyResponseRow = Tables<"survey_responses"> & {
  participant_sessions?: ParticipantSession | ParticipantSession[] | null;
};
type SurveyAnswerRow = Tables<"survey_answers">;

type SurveyQuestionWithOptions = SurveyQuestionRow & {
  survey_options?: SurveyOptionRow[] | null;
};

const FORMULA_LEADING_PATTERN = /^[\s]*[=+\-@]/;

const QUESTION_HEADERS = [
  "record_type",
  "question_id",
  "version_id",
  "participant_label",
  "status",
  "previous_status",
  "current_text",
  "version_number",
  "version_text",
  "submitted_at",
  "updated_at",
  "edited_by",
];

const MODERATION_HEADERS = [
  "action_id",
  "question_id",
  "actor_user_id",
  "action",
  "from_status",
  "to_status",
  "metadata",
  "created_at",
];

const SURVEY_RESPONSE_HEADERS = [
  "survey_id",
  "survey_title",
  "survey_status",
  "response_id",
  "participant_label",
  "submitted_at",
  "question_id",
  "question_prompt",
  "question_type",
  "answer",
];

export function isExportKind(kind: string): kind is ExportKind {
  return (EXPORT_KINDS as readonly string[]).includes(kind);
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function auditId(sessionId: string) {
  return sessionId.split("-")[0] || sessionId.slice(0, 8);
}

export function safeParticipantLabel(session: ParticipantSession | null | undefined) {
  const displayName = session?.display_name?.trim();
  if (displayName) {
    return displayName;
  }

  const email = session?.email?.trim();
  if (email) {
    return email;
  }

  return `Anonymous (session ${auditId(session?.id ?? "unknown")})`;
}

function hardenCell(value: CsvValue) {
  const text = String(value ?? "");
  return FORMULA_LEADING_PATTERN.test(text) ? `'${text}` : text;
}

function csvCell(value: CsvValue) {
  const text = hardenCell(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function serializeCsv(headers: string[], rows: Array<Record<string, CsvValue>>) {
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")),
  ].join("\n");
}

function jsonCell(value: Json) {
  return JSON.stringify(value ?? {});
}

function questionById(questions: QuestionRow[]) {
  return new Map(questions.map((question) => [question.id, question]));
}

function sortByPosition<T extends { position: number }>(rows: T[] | null | undefined) {
  return [...(rows ?? [])].sort((left, right) => left.position - right.position);
}

function buildQuestionsRows(questions: QuestionRow[], versions: QuestionVersionRow[]) {
  const questionsById = questionById(questions);
  const questionRecords = questions.map((question) => ({
    current_text: question.current_text,
    edited_by: "",
    participant_label: safeParticipantLabel(firstRelation(question.participant_sessions)),
    previous_status: question.previous_status,
    question_id: question.id,
    record_type: "question",
    status: question.status,
    submitted_at: question.submitted_at,
    updated_at: question.updated_at,
    version_id: "",
    version_number: "",
    version_text: "",
  }));
  const versionRecords = versions.map((version) => {
    const question = questionsById.get(version.question_id);

    return {
      current_text: question?.current_text ?? "",
      edited_by: version.edited_by ?? "",
      participant_label: safeParticipantLabel(firstRelation(question?.participant_sessions)),
      previous_status: question?.previous_status ?? "",
      question_id: version.question_id,
      record_type: "version",
      status: question?.status ?? "",
      submitted_at: question?.submitted_at ?? "",
      updated_at: version.created_at,
      version_id: version.id,
      version_number: version.version_number,
      version_text: version.text,
    };
  });

  return [...questionRecords, ...versionRecords];
}

function buildModerationRows(actions: ModerationActionRow[]) {
  return actions.map((action) => ({
    action: action.action,
    action_id: action.id,
    actor_user_id: action.actor_user_id,
    created_at: action.created_at,
    from_status: action.from_status,
    metadata: jsonCell(action.metadata),
    question_id: action.question_id,
    to_status: action.to_status,
  }));
}

function answerText(
  answer: SurveyAnswerRow,
  question: SurveyQuestionWithOptions | undefined,
) {
  if (question?.type === "multiple_choice" || question?.type === "multiple_select") {
    const optionsById = new Map((question.survey_options ?? []).map((option) => [option.id, option.label]));
    return (answer.selected_option_ids ?? [])
      .map((optionId) => optionsById.get(optionId) ?? optionId)
      .join("; ");
  }

  if (question?.type === "rating") {
    return answer.rating_value ?? "";
  }

  return answer.text_value ?? "";
}

function buildSurveyResponseRows(
  surveys: SurveyRow[],
  responses: SurveyResponseRow[],
  answers: SurveyAnswerRow[],
) {
  const surveysById = new Map(surveys.map((survey) => [survey.id, survey]));
  const responsesById = new Map(responses.map((response) => [response.id, response]));
  const questionsById = new Map<string, SurveyQuestionWithOptions>();

  for (const survey of surveys) {
    for (const question of survey.survey_questions ?? []) {
      questionsById.set(question.id, {
        ...question,
        survey_options: sortByPosition(question.survey_options),
      });
    }
  }

  return answers.map((answer) => {
    const response = responsesById.get(answer.survey_response_id);
    const survey = response ? surveysById.get(response.survey_id) : undefined;
    const question = questionsById.get(answer.survey_question_id);

    return {
      answer: answerText(answer, question),
      participant_label: safeParticipantLabel(firstRelation(response?.participant_sessions)),
      question_id: answer.survey_question_id,
      question_prompt: question?.prompt ?? "",
      question_type: question?.type ?? "",
      response_id: answer.survey_response_id,
      submitted_at: response?.submitted_at ?? "",
      survey_id: survey?.id ?? response?.survey_id ?? "",
      survey_status: survey?.status ?? "",
      survey_title: survey?.title ?? "",
    };
  });
}

async function loadQuestionExportRows(eventId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: questionData, error: questionError } = await supabase
    .from("questions")
    .select(
      "id,event_id,participant_session_id,current_text,status,previous_status,vote_count,is_edited,submitted_at,updated_at,participant_sessions(id,display_name,email)",
    )
    .eq("event_id", eventId)
    .order("submitted_at", { ascending: true });

  if (questionError) {
    throw new Error("Questions export could not be loaded.");
  }

  const questions = (questionData ?? []) as QuestionRow[];
  const questionIds = questions.map((question) => question.id);

  if (questionIds.length === 0) {
    return [];
  }

  const { data: versionData, error: versionError } = await supabase
    .from("question_versions")
    .select("id,question_id,version_number,text,edited_by,created_at")
    .in("question_id", questionIds)
    .order("version_number", { ascending: true });

  if (versionError) {
    throw new Error("Question version export could not be loaded.");
  }

  return buildQuestionsRows(questions, (versionData ?? []) as QuestionVersionRow[]);
}

async function loadModerationExportRows(eventId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("moderation_actions")
    .select("id,question_id,event_id,actor_user_id,action,from_status,to_status,metadata,created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Moderation export could not be loaded.");
  }

  return buildModerationRows((data ?? []) as ModerationActionRow[]);
}

async function loadSurveyResponseExportRows(eventId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: surveyData, error: surveyError } = await supabase
    .from("surveys")
    .select(
      "id,event_id,title,status,results_visible_to_participants,created_at,updated_at,created_by,survey_questions(id,survey_id,type,prompt,position,rating_scale,created_at,survey_options(id,survey_question_id,label,position))",
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (surveyError) {
    throw new Error("Survey export metadata could not be loaded.");
  }

  const surveys = (surveyData ?? []) as SurveyRow[];
  const surveyIds = surveys.map((survey) => survey.id);

  if (surveyIds.length === 0) {
    return [];
  }

  const { data: responseData, error: responseError } = await supabase
    .from("survey_responses")
    .select("id,survey_id,participant_session_id,submitted_at,participant_sessions(id,display_name,email)")
    .in("survey_id", surveyIds)
    .order("submitted_at", { ascending: true });

  if (responseError) {
    throw new Error("Survey response export could not be loaded.");
  }

  const responses = (responseData ?? []) as SurveyResponseRow[];
  const responseIds = responses.map((response) => response.id);

  if (responseIds.length === 0) {
    return [];
  }

  const { data: answerData, error: answerError } = await supabase
    .from("survey_answers")
    .select("id,survey_response_id,survey_question_id,selected_option_ids,rating_value,text_value")
    .in("survey_response_id", responseIds);

  if (answerError) {
    throw new Error("Survey answer export could not be loaded.");
  }

  return buildSurveyResponseRows(surveys, responses, (answerData ?? []) as SurveyAnswerRow[]);
}

async function loadRows(eventId: string, kind: ExportKind) {
  if (kind === "questions") {
    return {
      filename: "questions-and-versions",
      headers: QUESTION_HEADERS,
      rows: await loadQuestionExportRows(eventId),
    };
  }

  if (kind === "moderation") {
    return {
      filename: "moderation-history",
      headers: MODERATION_HEADERS,
      rows: await loadModerationExportRows(eventId),
    };
  }

  return {
    filename: "survey-responses",
    headers: SURVEY_RESPONSE_HEADERS,
    rows: await loadSurveyResponseExportRows(eventId),
  };
}

export async function getExportCsv(
  userId: string,
  eventId: string,
  kind: ExportKind,
): Promise<ExportPayload> {
  await assertEventRole(userId, eventId, EVENT_MANAGEMENT_ROLES);

  const payload = await loadRows(eventId, kind);
  return {
    ...payload,
    csv: serializeCsv(payload.headers, payload.rows),
    filename: `qsb-ask-${eventId}-${payload.filename}.csv`,
  };
}

export async function getOrganiserExportCounts(
  userId: string,
  eventId: string,
): Promise<ExportCounts> {
  const [questions, moderation, surveyResponses] = await Promise.all([
    getExportCsv(userId, eventId, "questions"),
    getExportCsv(userId, eventId, "moderation"),
    getExportCsv(userId, eventId, "survey-responses"),
  ]);

  return {
    moderation: moderation.rows.length,
    questions: questions.rows.length,
    "survey-responses": surveyResponses.rows.length,
  };
}
