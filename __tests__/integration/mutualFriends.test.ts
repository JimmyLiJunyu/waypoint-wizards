jest.mock("@/lib/auth/session", () => ({
  getCurrUserId: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
    },
  },
}));

import { NextRequest } from "next/server";
import { GET } from "@/app/api/(socials)/users/[userId]/mutual-friends/route";
import { getCurrUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const mockGetCurrUserId = getCurrUserId as jest.Mock;
const mockUserFindMany = prisma.user.findMany as jest.Mock;

const CALLER_ID = "user-a";

function makeRequest(userId: string, itineraryId?: string) {
  const url = itineraryId
    ? `http://localhost/api/users/${userId}/mutual-friends?itineraryId=${itineraryId}`
    : `http://localhost/api/users/${userId}/mutual-friends`;
  return new NextRequest(url, { method: "GET" });
}

const routeParams = (userId: string) => ({
  params: Promise.resolve({ userId }),
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/users/[userId]/mutual-friends", () => {
  it("returns 401 when the request is unauthenticated", async () => {
    mockGetCurrUserId.mockResolvedValue(null);
    const res = await GET(makeRequest(CALLER_ID), routeParams(CALLER_ID));
    expect(res.status).toBe(401);
  });

  it("returns 403 when userId param does not match the authenticated user", async () => {
    mockGetCurrUserId.mockResolvedValue(CALLER_ID);
    const res = await GET(makeRequest("different-user"), routeParams("different-user"));
    expect(res.status).toBe(403);
  });

  it("returns an array of mutual friends when they exist", async () => {
    mockGetCurrUserId.mockResolvedValue(CALLER_ID);
    mockUserFindMany.mockResolvedValue([
      { id: "user-b", name: "Bob", imageUrl: null },
    ]);
    const res = await GET(makeRequest(CALLER_ID), routeParams(CALLER_ID));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("Bob");
  });

  it("returns an empty array when there are no mutual friends", async () => {
    mockGetCurrUserId.mockResolvedValue(CALLER_ID);
    mockUserFindMany.mockResolvedValue([]);
    const res = await GET(makeRequest(CALLER_ID), routeParams(CALLER_ID));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(0);
  });

  it("calls findMany when an itineraryId query param is provided", async () => {
    mockGetCurrUserId.mockResolvedValue(CALLER_ID);
    mockUserFindMany.mockResolvedValue([]);
    await GET(makeRequest(CALLER_ID, "itin-1"), routeParams(CALLER_ID));
    expect(mockUserFindMany).toHaveBeenCalled();
  });
});
