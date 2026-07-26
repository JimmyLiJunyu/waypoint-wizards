jest.mock("@/lib/auth/session", () => ({
  getCurrUserId: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    post: { findUnique: jest.fn(), upsert: jest.fn() },
    collaborator: { findUnique: jest.fn() },
  },
}));

import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/itinerary/[itineraryId]/posts/route";
import { getCurrUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const mockGetCurrUserId = getCurrUserId as jest.Mock;
const mockPostFindUnique = prisma.post.findUnique as jest.Mock;
const mockPostUpsert = prisma.post.upsert as jest.Mock;
const mockCollaboratorFindUnique = prisma.collaborator.findUnique as jest.Mock;

const ITINERARY_ID = "itin-abc";
const routeParams = { params: Promise.resolve({ itineraryId: ITINERARY_ID }) };

function makeGetRequest() {
  return new NextRequest(`http://localhost/api/itinerary/${ITINERARY_ID}/posts`);
}

function makePostRequest(body?: object) {
  return new NextRequest(`http://localhost/api/itinerary/${ITINERARY_ID}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/itinerary/[itineraryId]/posts", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetCurrUserId.mockResolvedValue(null);
    const res = await GET(makeGetRequest(), routeParams);
    expect(res.status).toBe(401);
  });

  it("returns the caller's own post (or null) for this trip", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockPostFindUnique.mockResolvedValue(null);
    const res = await GET(makeGetRequest(), routeParams);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.post).toBeNull();
    expect(mockPostFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId_itineraryId: { ownerId: "user-a", itineraryId: ITINERARY_ID } },
      })
    );
  });
});

describe("POST /api/itinerary/[itineraryId]/posts", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetCurrUserId.mockResolvedValue(null);
    const res = await POST(makePostRequest(), routeParams);
    expect(res.status).toBe(401);
  });

  it("returns 403 when the caller is not a collaborator", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockCollaboratorFindUnique.mockResolvedValue(null);
    const res = await POST(makePostRequest(), routeParams);
    expect(res.status).toBe(403);
  });

  it("with no body, upserts without touching published or description", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockCollaboratorFindUnique.mockResolvedValue({ userId: "user-a" });
    mockPostUpsert.mockResolvedValue({ id: "post-1", published: false });

    const res = await POST(makePostRequest(), routeParams);
    expect(res.status).toBe(201);
    expect(mockPostUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: { ownerId: "user-a", itineraryId: ITINERARY_ID },
        update: {},
      })
    );
  });

  it("with { published: true }, sets published on both create and update", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockCollaboratorFindUnique.mockResolvedValue({ userId: "user-a" });
    mockPostUpsert.mockResolvedValue({ id: "post-1", published: true });

    await POST(makePostRequest({ published: true }), routeParams);

    expect(mockPostUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: { ownerId: "user-a", itineraryId: ITINERARY_ID, published: true },
        update: { published: true },
      })
    );
  });

  it("with { description }, only sets description, not published", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockCollaboratorFindUnique.mockResolvedValue({ userId: "user-a" });
    mockPostUpsert.mockResolvedValue({ id: "post-1" });

    await POST(makePostRequest({ description: "Great trip!" }), routeParams);

    expect(mockPostUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: { ownerId: "user-a", itineraryId: ITINERARY_ID, description: "Great trip!" },
        update: { description: "Great trip!" },
      })
    );
  });
});
