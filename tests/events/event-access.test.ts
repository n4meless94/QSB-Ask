import { beforeEach, describe, expect, it, vi } from "vitest";

import { inviteMemberAction, removeMemberAction } from "@/app/(app)/events/[eventId]/access-actions";
import {
  assertEventRole,
  getModeratorEventAccess,
  getPresenterEventAccess,
  inviteEventMember,
  listEventMembersForOrganiser,
  removeEventMember,
} from "@/lib/events/access";

const revalidatePathMock = vi.hoisted(() => vi.fn());
const getUserMock = vi.hoisted(() => vi.fn());
const fromMock = vi.hoisted(() => vi.fn());
const adminFromMock = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: vi.fn(() => null),
  })),
  cookies: vi.fn(async () => ({
    get: vi.fn(() => undefined),
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser: getUserMock,
    },
    from: fromMock,
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(() => ({
    from: adminFromMock,
  })),
}));

type MemberFixture = {
  created_at?: string;
  event_id?: string;
  id: string;
  invited_email?: string | null;
  role: "organiser" | "moderator" | "speaker";
  status: "invited" | "active" | "removed";
  user_id?: string | null;
  users?: { display_name: string; email: string } | null;
};

const eventFixture = {
  id: "event-1",
  name: "Quarterly Briefing",
  join_code: "QSB2X9ZA",
  starts_at: "2099-06-01T01:00:00.000Z",
  time_zone: "Asia/Kuala_Lumpur",
  status: "draft",
  identity_mode: "name_required",
  moderation_enabled: true,
  question_character_limit: 280,
  duplicate_block_enabled: true,
  question_rate_limit_seconds: 30,
  created_by: "organiser-1",
};

function form(values: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}

function makeQueryFixtures({
  actorMember,
  members = [],
  memberToRemove,
}: {
  actorMember?: MemberFixture | null;
  members?: MemberFixture[];
  memberToRemove?: MemberFixture | null;
}) {
  const inserts: unknown[] = [];
  const updates: unknown[] = [];

  function eventMembersQuery() {
    return {
      select: vi.fn((selectClause?: string) => ({
        eq: vi.fn((column: string, value: string) => {
          if (column === "event_id" && value === eventFixture.id && selectClause?.includes("users")) {
            return {
              order: vi.fn(async () => ({ data: members, error: null })),
            };
          }

          if (column === "event_id" && value === eventFixture.id) {
            return {
              eq: vi.fn((nextColumn: string, nextValue: string) => {
                if (nextColumn === "user_id") {
                  return {
                    in: vi.fn(async () => ({ data: actorMember ? [actorMember] : [], error: null })),
                    eq: vi.fn(() => ({
                      single: vi.fn(async () => ({ data: actorMember ?? null, error: actorMember ? null : { message: "No rows" } })),
                    })),
                  };
                }

                if (nextColumn === "id" && nextValue === memberToRemove?.id) {
                  return {
                    single: vi.fn(async () => ({ data: memberToRemove, error: null })),
                  };
                }

                return {
                  single: vi.fn(async () => ({ data: null, error: { message: "No rows" } })),
                };
              }),
            };
          }

          return {
            eq: vi.fn(() => ({
              single: vi.fn(async () => ({ data: null, error: { message: "No rows" } })),
            })),
          };
        }),
      })),
      insert: vi.fn((payload: unknown) => {
        inserts.push(payload);
        return {
          select: vi.fn(() => ({
            single: vi.fn(async () => ({
              data: {
                id: "member-new",
                event_id: eventFixture.id,
                user_id: null,
                invited_email: "speaker@qsb.com",
                role: "speaker",
                status: "invited",
                created_at: "2026-05-22T00:00:00.000Z",
              },
              error: null,
            })),
          })),
        };
      }),
      update: vi.fn((payload: unknown) => {
        updates.push(payload);
        return {
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(async () => ({
                  data: memberToRemove ? { ...memberToRemove, status: "removed" } : null,
                  error: memberToRemove ? null : { message: "No rows" },
                })),
              })),
            })),
          })),
        };
      }),
    };
  }

  function eventsQuery() {
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => ({ data: eventFixture, error: null })),
        })),
      })),
    };
  }

  fromMock.mockImplementation((table: string) => {
    if (table === "events") return eventsQuery();
    if (table === "event_members") return eventMembersQuery();
    throw new Error(`Unexpected table: ${table}`);
  });

  return { inserts, updates };
}

function makeAdminInvitationClaimFixture(invitation: MemberFixture | null, claimedMember: MemberFixture | null = invitation) {
  const upserts: unknown[] = [];
  const updates: unknown[] = [];

  adminFromMock.mockImplementation((table: string) => {
    if (table === "users") {
      return {
        upsert: vi.fn(async (payload: unknown) => {
          upserts.push(payload);
          return { data: null, error: null };
        }),
      };
    }

    if (table === "event_members") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn(() => ({
                  order: vi.fn(() => ({
                    limit: vi.fn(() => ({
                      maybeSingle: vi.fn(async () => ({ data: invitation, error: null })),
                    })),
                  })),
                })),
              })),
            })),
          })),
        })),
        update: vi.fn((payload: unknown) => {
          updates.push(payload);
          return {
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({ data: claimedMember, error: null })),
                })),
              })),
            })),
          };
        }),
      };
    }

    throw new Error(`Unexpected admin table: ${table}`);
  });

  return { updates, upserts };
}

describe("D-01/D-03 event access helpers", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    process.env.APP_JOIN_URL_BASE = "http://localhost:3000/join";
    process.env.APP_SESSION_IDLE_TIMEOUT_SECONDS = "28800";
    vi.clearAllMocks();
    adminFromMock.mockReset();
    getUserMock.mockResolvedValue({
      data: { user: { id: "organiser-1", email: "organiser@qsb.com" } },
      error: null,
    });
  });

  it("D-01 allows organiser workspace access and organiser member listing", async () => {
    const organiserMember: MemberFixture = {
      id: "member-owner",
      event_id: eventFixture.id,
      user_id: "organiser-1",
      invited_email: null,
      role: "organiser",
      status: "active",
      users: { display_name: "Organiser", email: "organiser@qsb.com" },
    };
    makeQueryFixtures({ actorMember: organiserMember, members: [organiserMember] });

    const access = await assertEventRole("organiser-1", "event-1", ["organiser"]);
    const members = await listEventMembersForOrganiser("organiser-1", "event-1");

    expect(access.role).toBe("organiser");
    expect(access.event.name).toBe("Quarterly Briefing");
    expect(members).toEqual([
      expect.objectContaining({
        id: "member-owner",
        isOriginalOrganiser: true,
        role: "organiser",
      }),
    ]);
  });

  it("D-03 allows moderator moderation access but rejects organiser member management", async () => {
    const moderatorMember: MemberFixture = {
      id: "member-moderator",
      event_id: eventFixture.id,
      user_id: "moderator-1",
      invited_email: null,
      role: "moderator",
      status: "active",
    };
    makeQueryFixtures({ actorMember: moderatorMember });

    await expect(getModeratorEventAccess("moderator-1", "event-1")).resolves.toMatchObject({
      role: "moderator",
    });
    await expect(listEventMembersForOrganiser("moderator-1", "event-1")).rejects.toThrow(
      "You do not have organiser access to this event.",
    );
  });

  it("D-03 allows speaker presenter access but rejects moderation access", async () => {
    const speakerMember: MemberFixture = {
      id: "member-speaker",
      event_id: eventFixture.id,
      user_id: "speaker-1",
      invited_email: null,
      role: "speaker",
      status: "active",
    };
    makeQueryFixtures({ actorMember: speakerMember });

    await expect(getPresenterEventAccess("speaker-1", "event-1")).resolves.toMatchObject({
      role: "speaker",
    });
    await expect(getModeratorEventAccess("speaker-1", "event-1")).rejects.toThrow(
      "You do not have access to this event.",
    );
  });

  it("activates matching invited speaker access when the signed-in email matches", async () => {
    const claimedSpeaker: MemberFixture = {
      id: "member-speaker-invite",
      event_id: eventFixture.id,
      user_id: "speaker-1",
      invited_email: null,
      role: "speaker",
      status: "active",
    };
    const invitedSpeaker: MemberFixture = {
      ...claimedSpeaker,
      user_id: null,
      invited_email: "speaker@qsb.com",
      status: "invited",
    };
    makeQueryFixtures({ actorMember: null });
    const adminFixtures = makeAdminInvitationClaimFixture(invitedSpeaker, claimedSpeaker);
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "speaker-1",
          email: "Speaker@QSB.com",
          user_metadata: { display_name: "Speaker Person" },
        },
      },
      error: null,
    });

    await expect(getPresenterEventAccess("speaker-1", "event-1")).resolves.toMatchObject({
      role: "speaker",
      membership: expect.objectContaining({
        id: "member-speaker-invite",
        status: "active",
        user_id: "speaker-1",
      }),
    });

    expect(adminFixtures.upserts[0]).toEqual({
      display_name: "Speaker Person",
      email: "speaker@qsb.com",
      id: "speaker-1",
    });
    expect(adminFixtures.updates[0]).toEqual({
      invited_email: null,
      status: "active",
      user_id: "speaker-1",
    });
  });

  it("activates one matching invitation deterministically when the email has multiple invited roles", async () => {
    const invitedModerator: MemberFixture = {
      id: "member-moderator-invite",
      event_id: eventFixture.id,
      user_id: null,
      invited_email: "speaker@qsb.com",
      role: "moderator",
      status: "invited",
    };
    const claimedModerator: MemberFixture = {
      ...invitedModerator,
      user_id: "speaker-1",
      invited_email: null,
      status: "active",
    };
    makeQueryFixtures({ actorMember: null });
    const adminFixtures = makeAdminInvitationClaimFixture(invitedModerator, claimedModerator);
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "speaker-1",
          email: "Speaker@QSB.com",
          user_metadata: {},
        },
      },
      error: null,
    });

    await expect(getPresenterEventAccess("speaker-1", "event-1")).resolves.toMatchObject({
      role: "moderator",
      membership: expect.objectContaining({
        id: "member-moderator-invite",
        status: "active",
        user_id: "speaker-1",
      }),
    });

    expect(adminFixtures.upserts).toHaveLength(1);
    expect(adminFixtures.updates).toHaveLength(1);
  });

  it("D-03 creates invited moderator/speaker rows and action copy describes activation, not email sent", async () => {
    const organiserMember: MemberFixture = {
      id: "member-owner",
      event_id: eventFixture.id,
      user_id: "organiser-1",
      invited_email: null,
      role: "organiser",
      status: "active",
    };
    const fixtures = makeQueryFixtures({ actorMember: organiserMember });

    const created = await inviteEventMember("organiser-1", "event-1", " Speaker@QSB.COM ", "speaker");
    const actionResult = await inviteMemberAction("event-1", form({ email: "Speaker@QSB.COM", role: "speaker" }));

    expect(fixtures.inserts[0]).toEqual({
      event_id: "event-1",
      invited_email: "speaker@qsb.com",
      role: "speaker",
      status: "invited",
    });
    expect(created).toMatchObject({ invited_email: "speaker@qsb.com", role: "speaker", status: "invited" });
    expect(actionResult.message).toContain("activate access");
    expect(actionResult.message).not.toMatch(/email sent|sent an email/i);
  });

  it("D-01 blocks original organiser removal", async () => {
    const organiserMember: MemberFixture = {
      id: "member-owner",
      event_id: eventFixture.id,
      user_id: "organiser-1",
      invited_email: null,
      role: "organiser",
      status: "active",
    };
    makeQueryFixtures({ actorMember: organiserMember, memberToRemove: organiserMember });

    await expect(removeEventMember("organiser-1", "event-1", "member-owner")).rejects.toThrow(
      "The original organiser cannot be removed.",
    );
    await expect(removeMemberAction("event-1", form({ memberId: "member-owner" }))).resolves.toMatchObject({
      ok: false,
      message: "The original organiser cannot be removed.",
    });
  });
});
