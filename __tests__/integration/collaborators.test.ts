// Integration tests for POST /api/itinerary/[itineraryId]/collaborators
//
// We mock getCurrUserId and Prisma so we can control the auth state and DB
// responses without needing a real database or real cookies. The goal is to
// verify that the route handler's logic — auth checks, role checks, friendship
// checks, and the final upsert — all behave correctly together.

jest.mock("@/lib/auth/tokens", () => ({
  getCurrUserId: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    collaborator: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    follow: {
      findUnique: jest.fn(),
    },
  },
}));

import { NextRequest } from "next/server";
import { POST } from "@/app/api/itinerary/[itineraryId]/collaborators/route";
import { getCurrUserId } from "@/lib/auth/tokens";
import { prisma } from "@/lib/prisma";

const mockGetCurrUserId = getCurrUserId as jest.Mock;
const mockCollaboratorFindUnique = prisma.collaborator.findUnique as jest.Mock;
const mockFollowFindUnique = prisma.follow.findUnique as jest.Mock;
const mockCollaboratorUpsert = prisma.collaborator.upsert as jest.Mock;

const ITINERARY_ID = "itin-abc";

function makeRequest(body: object) {
  return new NextRequest(
    `http://localhost/api/itinerary/${ITINERARY_ID}/collaborators`,
    {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }
  );
}

const routeParams = { params: Promise.resolve({ itineraryId: ITINERARY_ID }) };

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/itinerary/[itineraryId]/collaborators", () => {
  it("returns 401 when the request is unauthenticated", async () => {
    mockGetCurrUserId.mockResolvedValue(null);
    const res = await POST(makeRequest({ inviteeId: "user-b" }), routeParams);
    expect(res.status).toBe(401);
  });

  it("returns 403 when the caller is not the OWNER", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockCollaboratorFindUnique.mockResolvedValue({ role: "EDITOR" });
    const res = await POST(makeRequest({ inviteeId: "user-b" }), routeParams);
    expect(res.status).toBe(403);
  });

  it("returns 403 when the invitee is not a mutual friend", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockCollaboratorFindUnique.mockResolvedValue({ role: "OWNER" });
    // Both follow lookups return null — no mutual friendship
    mockFollowFindUnique.mockResolvedValue(null);
    const res = await POST(makeRequest({ inviteeId: "user-b" }), routeParams);
    expect(res.status).toBe(403);
  });

  it("returns 201 when OWNER successfully invites a mutual friend", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockCollaboratorFindUnique.mockResolvedValue({ role: "OWNER" });
    // Both directions of the follow are ACCEPTED
    mockFollowFindUnique.mockResolvedValue({ status: "ACCEPTED" });
    mockCollaboratorUpsert.mockResolvedValue({
      id: 1,
      role: "EDITOR",
      userId: "user-b",
      itineraryId: ITINERARY_ID,
    });
    const res = await POST(makeRequest({ inviteeId: "user-b" }), routeParams);
    expect(res.status).toBe(201);
  });
});
