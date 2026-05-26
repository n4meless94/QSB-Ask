import type { IdentityMode } from "@/types/app";

export type ParticipantIdentityInput = {
  display_name?: string;
  email?: string;
};

export type ParticipantIdentity = {
  display_name: string | null;
  email: string | null;
};

export function normaliseJoinCode(joinCode: string) {
  return joinCode.trim().toUpperCase();
}

export function validateParticipantIdentity(
  identityMode: IdentityMode,
  input: ParticipantIdentityInput,
): ParticipantIdentity {
  const displayName = input.display_name?.trim() ?? "";
  const email = input.email?.trim().toLowerCase() ?? "";

  if (identityMode === "anonymous") {
    return { display_name: null, email: null };
  }

  if (!displayName) {
    throw new Error("Display name is required for this event.");
  }

  if (identityMode === "name_email_required") {
    if (!email) {
      throw new Error("Email is required for this event.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Enter a valid email address.");
    }
  }

  return {
    display_name: displayName,
    email: identityMode === "name_email_required" ? email : null,
  };
}
