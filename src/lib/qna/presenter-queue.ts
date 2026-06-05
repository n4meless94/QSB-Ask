import type { QuestionStatus } from "@/types/app";

type PresenterQueueQuestion = {
  id: string;
  status: QuestionStatus;
  submitted_at: string;
};

function statusRank(status: QuestionStatus) {
  if (status === "live") return 0;
  if (status === "answered") return 1;
  return 2;
}

export function comparePresenterQueueQuestions(
  left: PresenterQueueQuestion,
  right: PresenterQueueQuestion,
) {
  return (
    statusRank(left.status) - statusRank(right.status) ||
    new Date(left.submitted_at).getTime() - new Date(right.submitted_at).getTime() ||
    left.id.localeCompare(right.id)
  );
}

export function isPresenterQueueStatus(status: QuestionStatus) {
  return status === "live" || status === "answered";
}
