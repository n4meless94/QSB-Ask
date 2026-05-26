import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { PresenterView } from "@/components/qna/PresenterView";
import { Button } from "@/components/ui/Button";
import { E2E_AUTH_COOKIE, isE2EAuthEnabled } from "@/lib/auth/e2e";
import type { PublicQuestion } from "@/lib/qna/public";
import { getPresenterQuestions } from "@/lib/qna/presenter";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PresenterPageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function PresenterPage({ params }: PresenterPageProps) {
  const { eventId } = await params;
  const cookieStore = await cookies();

  if (isE2EAuthEnabled(cookieStore.get(E2E_AUTH_COOKIE)?.value)) {
    if (eventId === "denied") {
      return <PresenterAccessDenied />;
    }

    return (
      <PresenterView
        eventId={eventId}
        eventName="Quarterly Briefing"
        fixtureMode
        key={e2ePresenterQuestions().map((question) => `${question.id}:${question.updated_at}:${question.vote_count}`).join("|")}
        questions={e2ePresenterQuestions()}
      />
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  let result: Awaited<ReturnType<typeof getPresenterQuestions>>;

  try {
    result = await getPresenterQuestions(user.id, eventId);
  } catch {
    return <PresenterAccessDenied />;
  }

  return (
    <PresenterView
      eventId={eventId}
      eventName={result.access.event.name}
      key={result.questions.map((question) => `${question.id}:${question.updated_at}:${question.vote_count}`).join("|")}
      questions={result.questions}
    />
  );
}

function PresenterAccessDenied() {
  return (
    <div className="grid max-w-3xl gap-4">
      <h1 className="text-[28px] font-semibold leading-[1.2] text-slate-900">Presenter View</h1>
      <div className="rounded-[6px] border border-red-700 bg-white p-4" role="alert">
        <p className="text-base font-semibold leading-6 text-red-700">
          You do not have presenter access to this event.
        </p>
        <p className="mt-1 text-sm leading-[1.4] text-slate-600">
          Ask the organiser to add you as a speaker, moderator, or organiser.
        </p>
      </div>
      <a href="/dashboard">
        <Button variant="secondary">Back to dashboard</Button>
      </a>
    </div>
  );
}

function e2ePresenterQuestions(): PublicQuestion[] {
  return [
    {
      current_text: "How will follow-up actions be shared?",
      id: "question-live-1",
      is_edited: false,
      status: "live",
      submitted_at: "2026-05-26T00:50:00.000Z",
      updated_at: "2026-05-26T00:50:00.000Z",
      vote_count: 8,
    },
    {
      current_text: "Who owns the next briefing?",
      id: "question-answered-1",
      is_edited: false,
      status: "answered",
      submitted_at: "2026-05-26T00:40:00.000Z",
      updated_at: "2026-05-26T00:45:00.000Z",
      vote_count: 3,
    },
  ];
}
