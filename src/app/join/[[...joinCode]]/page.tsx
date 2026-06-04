import { AnonymousParticipantAutoJoinForm } from "@/components/participants/AnonymousParticipantAutoJoinForm";
import { ParticipantJoinForm } from "@/components/participants/ParticipantJoinForm";
import { getJoinableEventByCode, type JoinableEvent } from "@/lib/participants/session";

type JoinPageProps = {
  params: Promise<{ joinCode?: string[] }>;
  searchParams: Promise<{ join?: string }>;
};

function e2eEvent(code: string): JoinableEvent | null {
  if (code.toUpperCase() !== "QSB2X9ZA") return null;

  return {
    id: "event-1",
    identity_mode: "name_required",
    join_code: "QSB2X9ZA",
    name: "Quarterly Briefing",
    status: "active",
  };
}

export default async function JoinPage({ params, searchParams }: JoinPageProps) {
  const { joinCode } = await params;
  const query = await searchParams;
  const code = joinCode?.[0]?.trim().toUpperCase() ?? "";
  const event = code
    ? process.env.QSB_ASK_E2E_AUTH === "1"
      ? e2eEvent(code)
      : await getJoinableEventByCode(code)
    : null;
  const initialError = code && !event ? "We could not find an active event for that code." : undefined;

  if (event?.identity_mode === "anonymous" && query.join !== "manual") {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6">
        <AnonymousParticipantAutoJoinForm eventName={event.name} joinCode={event.join_code} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6">
      <ParticipantJoinForm
        eventName={event?.name}
        identityMode={event?.identity_mode}
        initialCode={code}
        initialError={initialError}
      />
    </main>
  );
}
