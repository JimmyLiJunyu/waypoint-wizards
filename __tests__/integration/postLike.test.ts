jest.mock("@/lib/auth/session", () => ({
  getCurrUserId: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    postLike: { upsert: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
  },
}));

import { NextRequest } from "next/server";
import { POST, DELETE } from "@/app/api/posts/[postId]/like/route";
import { getCurrUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const mockGetCurrUserId = getCurrUserId as jest.Mock;
const mockPostLikeUpsert = prisma.postLike.upsert as jest.Mock;
const mockPostLikeFindUnique = prisma.postLike.findUnique as jest.Mock;
const mockPostLikeDelete = prisma.postLike.delete as jest.Mock;

const POST_ID = "post-1";
const routeParams = { params: Promise.resolve({ postId: POST_ID }) };

function makeRequest(method: "POST" | "DELETE") {
  return new NextRequest(`http://localhost/api/posts/${POST_ID}/like`, { method });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/posts/[postId]/like", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetCurrUserId.mockResolvedValue(null);
    const res = await POST(makeRequest("POST"), routeParams);
    expect(res.status).toBe(401);
  });

  it("upserts a like idempotently and returns 201", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockPostLikeUpsert.mockResolvedValue({ userId: "user-a", postId: POST_ID });

    const res = await POST(makeRequest("POST"), routeParams);
    expect(res.status).toBe(201);
    expect(mockPostLikeUpsert).toHaveBeenCalledWith({
      where: { userId_postId: { userId: "user-a", postId: POST_ID } },
      create: { userId: "user-a", postId: POST_ID },
      update: {},
    });
  });
});

describe("DELETE /api/posts/[postId]/like", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetCurrUserId.mockResolvedValue(null);
    const res = await DELETE(makeRequest("DELETE"), routeParams);
    expect(res.status).toBe(401);
  });

  it("is a no-op (still succeeds) when there was no existing like", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockPostLikeFindUnique.mockResolvedValue(null);

    const res = await DELETE(makeRequest("DELETE"), routeParams);
    expect(res.status).toBe(200);
    expect(mockPostLikeDelete).not.toHaveBeenCalled();
  });

  it("deletes the like when one exists", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockPostLikeFindUnique.mockResolvedValue({ userId: "user-a", postId: POST_ID });
    mockPostLikeDelete.mockResolvedValue({});

    const res = await DELETE(makeRequest("DELETE"), routeParams);
    expect(res.status).toBe(200);
    expect(mockPostLikeDelete).toHaveBeenCalledWith({
      where: { userId_postId: { userId: "user-a", postId: POST_ID } },
    });
  });
});
