import "server-only";

import { buildJoinLink, type EventSummary } from "@/lib/events/events";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  EVENT_MANAGEMENT_ROLES,
  MODERATION_ROLES,
  PRESENTER_ROLES,
} from "@/lib/supabase/rls";
import type { Tables } from "@/lib/supabase/database.types";
import type { EventRole, MemberStatus } from "@/types/app";

const EVENT_SELECT =
  "id,name,join_code,starts_at,time_zone,status,identity_mode,moderation_enabled,participant_realtime_enabled,question_character_limit,duplicate_block_enabled,question_rate_limit_seconds,created_by";

type EventMemberRow = Tables<"event_members">;

type EventMemberWithUserRow = EventMemberRow & {
  users?: { display_name: string; email: string } | { display_name: string; email: string }[] | null;
};

export type EventAccessContext = {
  event: EventSummary & { joinLink: string };
  membership: EventMemberRow;
  role: EventRole;
};

export type EventMemberSummary = {
  created_at: string;
  email: string;
  displayName: string;
  id: string;
  invited_email: string | null;
  isOriginalOrganiser: boolean;
  role: EventRole;
  status: MemberStatus;
  user_id: string | null;
};

function normaliseEmail(email: string) {
  return email.trim().toLowerCase();
}

function accessDeniedMessage(allowedRoles: readonly EventRole[]) {
  if (allowedRoles.length === 1 && allowedRoles[0] === "organiser") {
    return "You do not have organiser access to this event.";
  }

  return "You do not have access to this event.";
}

function firstUser(row: EventMemberWithUserRow) {
  if (Array.isArray(row.users)) {
    return row.users[0] ?? null;
  }

  return row.users ?? null;
}

function displayNameFromEmail(email: string) {
  const localPart = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  return localPart || email;
}

function displayNameFromAuthUser(user: { email?: string | null; user_metadata?: { display_name?: unknown; full_name?: unknown } }) {
  const metadataName =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name
      : typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : "";

  return metadataName.trim() || displayNameFromEmail(user.email ?? "");
}

async function claimMatchingInvitation(
  eventId: string,
  userId: string,
  allowedRoles: readonly EventRole[],
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || user.id !== userId || !user.email) {
    return null;
  }

  const invitedEmail = normaliseEmail(user.email);
  const admin = createSupabaseAdminClient();

  const { data: invitation, error: invitationError } = await admin
    .from("event_members")
    .select("id,event_id,user_id,invited_email,role,status,created_at")
    .eq("event_id", eventId)
    .eq("invited_email", invitedEmail)
    .eq("status", "invited")
    .in("role", [...allowedRoles])
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (invitationError) {
    throw new Error("Invited access could not be activated. Ask the organiser to check your account.");
  }

  if (!invitation) {
    return null;
  }

  const { error: profileError } = await admin.from("users").upsert({
    display_name: displayNameFromAuthUser(user),
    email: invitedEmail,
    id: userId,
  });

  if (profileError) {
    throw new Error("Invited access could not be activated. Ask the organiser to check your account.");
  }

  const { data, error: updateError } = await admin
    .from("event_members")
    .update({
      invited_email: null,
      status: "active",
      user_id: userId,
    })
    .eq("id", invitation.id)
    .eq("status", "invited")
    .select("id,event_id,user_id,invited_email,role,status,created_at")
    .maybeSingle();

  if (updateError) {
    throw new Error("Invited access could not be activated. Ask the organiser to check your account.");
  }

  return data;
}

export async function assertEventRole(
  userId: string,
  eventId: string,
  allowedRoles: readonly EventRole[],
): Promise<EventAccessContext> {
  if (!userId) {
    throw new Error("Signed-in user is required.");
  }

  if (!eventId) {
    throw new Error("Event is required.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: memberships, error: memberError } = await supabase
    .from("event_members")
    .select("id,event_id,user_id,invited_email,role,status,created_at")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .in("role", allowedRoles);

  if (memberError) {
    throw new Error("Event access could not be verified. Refresh the page or try again.");
  }

  let membership = (memberships ?? []).find(
    (member) => member.status === "active" && allowedRoles.includes(member.role),
  );

  if (!membership) {
    const claimedMembership = await claimMatchingInvitation(eventId, userId, allowedRoles);
    if (claimedMembership && allowedRoles.includes(claimedMembership.role)) {
      membership = claimedMembership;
    }
  }

  if (!membership) {
    throw new Error(accessDeniedMessage(allowedRoles));
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    throw new Error("Event details could not be loaded. Refresh the page or return to the dashboard.");
  }

  return {
    event: {
      ...event,
      joinLink: buildJoinLink(event.join_code),
    },
    membership,
    role: membership.role,
  };
}

export async function listEventMembersForOrganiser(
  userId: string,
  eventId: string,
): Promise<EventMemberSummary[]> {
  const access = await assertEventRole(userId, eventId, EVENT_MANAGEMENT_ROLES);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("event_members")
    .select("id,event_id,user_id,invited_email,role,status,created_at,users(display_name,email)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Event members could not be loaded. Refresh the page or try again.");
  }

  return ((data ?? []) as EventMemberWithUserRow[]).map((member) => {
    const user = firstUser(member);
    const email = user?.email ?? member.invited_email ?? "";

    return {
      created_at: member.created_at,
      displayName: user?.display_name ?? (email ? displayNameFromEmail(email) : "Pending member"),
      email,
      id: member.id,
      invited_email: member.invited_email,
      isOriginalOrganiser: member.user_id === access.event.created_by && member.role === "organiser",
      role: member.role,
      status: member.status,
      user_id: member.user_id,
    };
  });
}

export async function inviteEventMember(
  userId: string,
  eventId: string,
  email: string,
  role: EventRole,
): Promise<EventMemberRow> {
  await assertEventRole(userId, eventId, EVENT_MANAGEMENT_ROLES);

  if (role !== "moderator" && role !== "speaker") {
    throw new Error("Choose Moderator or Speaker access.");
  }

  const invitedEmail = normaliseEmail(email);

  if (!invitedEmail || !invitedEmail.includes("@")) {
    throw new Error("Enter a valid email address.");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("event_members")
    .insert({
      event_id: eventId,
      invited_email: invitedEmail,
      role,
      status: "invited",
    })
    .select("id,event_id,user_id,invited_email,role,status,created_at")
    .single();

  if (error || !data) {
    throw new Error("Member access could not be created. Check the email and try again.");
  }

  return data;
}

export async function removeEventMember(
  userId: string,
  eventId: string,
  memberId: string,
): Promise<EventMemberRow> {
  const access = await assertEventRole(userId, eventId, EVENT_MANAGEMENT_ROLES);
  const supabase = await createSupabaseServerClient();
  const { data: member, error: memberError } = await supabase
    .from("event_members")
    .select("id,event_id,user_id,invited_email,role,status,created_at")
    .eq("event_id", eventId)
    .eq("id", memberId)
    .single();

  if (memberError || !member) {
    throw new Error("Member access could not be found.");
  }

  if (member.user_id === access.event.created_by && member.role === "organiser") {
    throw new Error("The original organiser cannot be removed.");
  }

  const { data, error } = await supabase
    .from("event_members")
    .update({ status: "removed" })
    .eq("event_id", eventId)
    .eq("id", memberId)
    .select("id,event_id,user_id,invited_email,role,status,created_at")
    .single();

  if (error || !data) {
    throw new Error("Member access could not be removed. Refresh the page and try again.");
  }

  return data;
}

export async function getPresenterEventAccess(userId: string, eventId: string) {
  return assertEventRole(userId, eventId, PRESENTER_ROLES);
}

export async function getModeratorEventAccess(userId: string, eventId: string) {
  return assertEventRole(userId, eventId, MODERATION_ROLES);
}
