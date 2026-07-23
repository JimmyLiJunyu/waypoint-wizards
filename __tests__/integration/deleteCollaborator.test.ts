jest.mock("@/lib/auth/session", () => ({
  getCurrUserId: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    collaborator: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { NextRequest } from "next/server";
import { DELETE } from "@/app/api/itinerary/[itineraryId]/collaborators/route";
import { getCurrUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const mockGetCurrUserId = getCurrUserId as jest.Mock;
const mockCollaboratorFindUnique = prisma.collaborator.findUnique as jest.Mock;
const mockCollaboratorDelete = prisma.collaborator.delete as jest.Mock;

const ITINERARY_ID = "itin-abc";

function makeRequest(body: object) {
  return new NextRequest(
    `http://localhost/api/itinerary/${ITINERARY_ID}/collaborators`,
    {
      method: "DELETE",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }
  );
}

const routeParams = { params: Promise.resolve({ itineraryId: ITINERARY_ID }) };

beforeEach(() => {
  jest.clearAllMocks();
});

describe("DELETE /api/itinerary/[itineraryId]/collaborators", () => {
  it("returns 401 when the request is unauthenticated", async () => {
    mockGetCurrUserId.mockResolvedValue(null);
    const res = await DELETE(makeRequest({ targetUserId: "user-b" }), routeParams);
    expect(res.status).toBe(401);
  });

  it("returns 403 when the caller is not the OWNER", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    // assertOwner check, make sure that caller is EDITOR, not OWNER
    mockCollaboratorFindUnique.mockResolvedValueOnce({ role: "EDITOR" });
    const res = await DELETE(makeRequest({ targetUserId: "user-b" }), routeParams);
    expect(res.status).toBe(403);
  });

  it("returns 404 when the target collaborator does not exist", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    // assertOwner check passes
    mockCollaboratorFindUnique.mockResolvedValueOnce({ role: "OWNER" });
    // target lookup returns null
    mockCollaboratorFindUnique.mockResolvedValueOnce(null);
    const res = await DELETE(makeRequest({ targetUserId: "user-b" }), routeParams);
    expect(res.status).toBe(404);
  });

  it("returns 400 when trying to remove the OWNER", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    // assertOwner check passes
    mockCollaboratorFindUnique.mockResolvedValueOnce({ role: "OWNER" });
    // target is also OWNER
    mockCollaboratorFindUnique.mockResolvedValueOnce({ role: "OWNER" });
    const res = await DELETE(makeRequest({ targetUserId: "user-b" }), routeParams);
    expect(res.status).toBe(400);
  });

  it("returns 200 and deletes the collaborator when OWNER removes an EDITOR", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    // assertOwner check passes
    mockCollaboratorFindUnique.mockResolvedValueOnce({ role: "OWNER" });
    // target is an EDITOR
    mockCollaboratorFindUnique.mockResolvedValueOnce({ role: "EDITOR" });
    mockCollaboratorDelete.mockResolvedValue({});

    const res = await DELETE(makeRequest({ targetUserId: "user-b" }), routeParams);
    expect(res.status).toBe(200);
    expect(mockCollaboratorDelete).toHaveBeenCalled();
  });
});
