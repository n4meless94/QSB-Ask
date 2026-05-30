import type { SurveyQuestionType } from "@/types/app";

export type SurveyQuestionDraft = {
  id?: string;
  type: SurveyQuestionType;
  prompt: string;
  options?: string[];
  ratingScale?: number | null;
};

export type SurveyDraftInput = {
  surveyId: string;
  title: string;
  questions: SurveyQuestionDraft[];
};

export type NormalisedSurveyQuestionDraft = {
  id?: string;
  type: SurveyQuestionType;
  prompt: string;
  options: string[];
  ratingScale: 5 | 10 | null;
};

export type NormalisedSurveyDraft = {
  surveyId: string;
  title: string;
  questions: NormalisedSurveyQuestionDraft[];
};

export type SurveyValidationErrors = {
  title?: string;
  questions?: string[];
};

const QUESTION_TYPES = ["multiple_choice", "multiple_select", "rating", "open_text"] as const;

function isQuestionType(value: string): value is SurveyQuestionType {
  return QUESTION_TYPES.includes(value as SurveyQuestionType);
}

function normaliseOptions(question: SurveyQuestionDraft) {
  if (question.type !== "multiple_choice" && question.type !== "multiple_select") {
    return [];
  }

  return (question.options ?? []).map((option) => option.trim()).filter(Boolean);
}

export function normaliseSurveyDraft(input: SurveyDraftInput): NormalisedSurveyDraft {
  return {
    surveyId: input.surveyId,
    title: input.title.trim(),
    questions: input.questions.map((question) => ({
      id: question.id,
      options: normaliseOptions(question),
      prompt: question.prompt.trim(),
      ratingScale:
        question.type === "rating" && (question.ratingScale === 5 || question.ratingScale === 10)
          ? question.ratingScale
          : null,
      type: question.type,
    })),
  };
}

export function validateSurveyForSave(input: SurveyDraftInput): {
  draft?: NormalisedSurveyDraft;
  errors: SurveyValidationErrors;
  ok: boolean;
} {
  const errors: SurveyValidationErrors = {};
  const normalised = normaliseSurveyDraft(input);
  const questionErrors: string[] = [];

  if (!normalised.title) {
    errors.title = "Survey title is required.";
    questionErrors.push("Survey title is required.");
  }

  normalised.questions.forEach((question, index) => {
    const questionNumber = index + 1;

    if (!isQuestionType(question.type)) {
      questionErrors.push(`Question ${questionNumber} type is not supported.`);
    }

    if (!question.prompt) {
      questionErrors.push(`Question ${questionNumber} prompt is required.`);
    }

    if (
      (question.type === "multiple_choice" || question.type === "multiple_select") &&
      question.options.length < 2
    ) {
      questionErrors.push(`Question ${questionNumber} needs at least two answer options.`);
    }

    if (question.type === "rating" && question.ratingScale !== 5 && question.ratingScale !== 10) {
      questionErrors.push(`Question ${questionNumber} rating scale must be 5 or 10.`);
    }
  });

  if (questionErrors.length > 0) {
    errors.questions = questionErrors;
  }

  return {
    draft: Object.keys(errors).length === 0 ? normalised : undefined,
    errors,
    ok: Object.keys(errors).length === 0,
  };
}

export function validateSurveyForPublish(input: SurveyDraftInput): {
  draft?: NormalisedSurveyDraft;
  errors: SurveyValidationErrors;
  ok: boolean;
} {
  const result = validateSurveyForSave(input);
  const questionErrors = [...(result.errors.questions ?? [])];

  if (input.questions.length === 0) {
    questionErrors.push("Survey needs at least one question.");
  }

  if (questionErrors.length > 0) {
    result.errors.questions = questionErrors;
  }

  return {
    draft: Object.keys(result.errors).length === 0 ? result.draft : undefined,
    errors: result.errors,
    ok: Object.keys(result.errors).length === 0,
  };
}
