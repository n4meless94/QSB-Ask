import { inviteMemberAction, removeMemberAction } from "@/app/(app)/events/[eventId]/access-actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import type { EventMemberSummary } from "@/lib/events/access";
import type { EventRole, MemberStatus } from "@/types/app";

type EventAccessPanelProps = {
  eventId: string;
  members: EventMemberSummary[];
  role: EventRole;
};

const roleLabels: Record<EventRole, string> = {
  organiser: "Organiser",
  moderator: "Moderator",
  speaker: "Speaker",
};

const statusLabels: Record<MemberStatus, string> = {
  active: "Active",
  invited: "Invited",
  removed: "Removed",
};

function badgeClass(value: EventRole | MemberStatus) {
  if (value === "organiser" || value === "active") {
    return "border-teal-700 text-teal-700";
  }

  if (value === "removed") {
    return "border-slate-400 bg-slate-100 text-slate-700";
  }

  return "border-slate-300 text-slate-700";
}

export function EventAccessPanel({ eventId, members, role }: EventAccessPanelProps) {
  const inviteAction = inviteMemberAction.bind(null, eventId);
  const removeAction = removeMemberAction.bind(null, eventId);
  const canManageAccess = role === "organiser";

  return (
    <section
      aria-labelledby="event-access-heading"
      className="grid gap-4 rounded-[6px] border border-slate-300 bg-white p-4 sm:p-6"
      id="access"
    >
      <div className="grid gap-1">
        <h2
          className="text-[20px] font-semibold leading-[1.25] text-slate-900"
          id="event-access-heading"
        >
          Event access
        </h2>
        <p className="text-sm leading-[1.4] text-slate-600">
          Invite email delivery is not active yet. This member record is ready for manual account
          onboarding.
        </p>
      </div>

      {canManageAccess ? (
        <form action={inviteAction} className="grid gap-4 border-b border-slate-200 pb-4">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
            <Field
              autoComplete="email"
              helperText="Use the staff email that will be matched during manual account onboarding."
              label="Invite email"
              name="email"
              type="email"
            />
            <div className="grid gap-2">
              <label className="text-sm font-semibold leading-[1.4] text-slate-900" htmlFor="role">
                Role
              </label>
              <select
                className="min-h-11 rounded-[6px] border border-slate-300 bg-white px-3 text-base leading-6 text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 sm:min-h-10"
                defaultValue="moderator"
                id="role"
                name="role"
              >
                <option value="moderator">Moderator</option>
                <option value="speaker">Speaker</option>
              </select>
            </div>
          </div>
          <div>
            <Button type="submit">Invite member</Button>
          </div>
        </form>
      ) : (
        <div className="rounded-[6px] border border-slate-300 bg-slate-50 p-4">
          <p className="text-base font-semibold leading-6 text-slate-900">
            Only organisers can manage event access.
          </p>
          <p className="mt-1 text-sm leading-[1.4] text-slate-600">
            Your assigned role can open the workspace areas needed for this event.
          </p>
        </div>
      )}

      <div className="grid gap-3">
        {members.length === 0 ? (
          <div className="rounded-[6px] border border-slate-300 bg-white p-4">
            <h3 className="text-[20px] font-semibold leading-[1.25] text-slate-900">
              No moderators or speakers yet
            </h3>
            <p className="mt-1 text-sm leading-[1.4] text-slate-600">
              Invite a moderator to review questions or a speaker to use Presenter View.
            </p>
          </div>
        ) : (
          members.map((member) => {
            const isRemoved = member.status === "removed";

            return (
              <div
                className="grid gap-3 rounded-[6px] border border-slate-300 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
                key={member.id}
              >
                <div className="min-w-0">
                  <p className="break-words text-base font-semibold leading-6 text-slate-900">
                    {member.displayName}
                  </p>
                  <p className="break-words text-sm leading-[1.4] text-slate-600">{member.email}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`rounded-[6px] border px-2 py-1 text-sm font-semibold leading-[1.4] ${badgeClass(
                        member.role,
                      )}`}
                    >
                      {roleLabels[member.role]}
                    </span>
                    <span
                      className={`rounded-[6px] border px-2 py-1 text-sm font-semibold leading-[1.4] ${badgeClass(
                        member.status,
                      )}`}
                    >
                      {statusLabels[member.status]}
                    </span>
                    {member.isOriginalOrganiser ? (
                      <span className="rounded-[6px] border border-slate-300 px-2 py-1 text-sm font-semibold leading-[1.4] text-slate-700">
                        Original organiser
                      </span>
                    ) : null}
                  </div>
                </div>

                {canManageAccess ? (
                  <form action={removeAction} className="grid gap-2 sm:justify-items-end">
                    <input name="memberId" type="hidden" value={member.id} />
                    <Button
                      aria-label={`Remove access for ${member.email || member.displayName}`}
                      disabled={member.isOriginalOrganiser || isRemoved}
                      type="submit"
                      variant="destructive"
                    >
                      Remove access
                    </Button>
                    {member.isOriginalOrganiser ? (
                      <p className="max-w-56 text-sm leading-[1.4] text-slate-600">
                        Original organiser access is protected.
                      </p>
                    ) : (
                      <p className="max-w-56 text-sm leading-[1.4] text-slate-600">
                        Remove access? This person will no longer be able to open this event.
                      </p>
                    )}
                  </form>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
