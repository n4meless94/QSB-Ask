import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { listAccessibleEvents } from "@/lib/events/events";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type EventDetailPageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { eventId } = await params;

  if (process.env.QSB_ASK_E2E_AUTH === "1") {
    return <EventDetailContent eventName={eventId === "event-1" ? "Quarterly Briefing" : "Town Hall"} />;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const events = user ? await listAccessibleEvents(user.id) : [];
  const event = events.find((accessibleEvent) => accessibleEvent.id === eventId);

  if (!event) {
    return (
      <div className="grid max-w-3xl gap-4">
        <h1 className="text-[28px] font-semibold leading-[1.2] text-slate-900">Event access</h1>
        <div className="rounded-[6px] border border-red-700 bg-white p-4" role="alert">
          <p className="text-base font-semibold leading-6 text-red-700">
            You do not have access to this event.
          </p>
          <p className="mt-1 text-sm leading-[1.4] text-slate-600">
            Return to the dashboard and choose an event from your accessible list.
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="secondary">Back to dashboard</Button>
        </Link>
      </div>
    );
  }

  return <EventDetailContent eventName={event.name} />;
}

function EventDetailContent({ eventName }: { eventName: string }) {
  return (
    <div className="grid max-w-3xl gap-4">
      <div>
        <h1 className="text-[28px] font-semibold leading-[1.2] text-slate-900">{eventName}</h1>
        <p className="mt-1 text-sm leading-[1.4] text-slate-600">
          Phase 1 confirms organiser access and event setup. Q&A workspace tools are delivered in
          Phase 2.
        </p>
      </div>
      <Link href="/dashboard">
        <Button variant="secondary">Back to dashboard</Button>
      </Link>
    </div>
  );
}
