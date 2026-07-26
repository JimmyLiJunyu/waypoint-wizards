const mockRemove = jest.fn();

jest.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        remove: mockRemove,
      }),
    },
  }),
}));

jest.mock("@/lib/auth/session", () => ({
  getCurrUserId: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    photo: { findUnique: jest.fn(), delete: jest.fn() },
  },
}));

import { NextRequest } from "next/server";
import { DELETE } from "@/app/api/posts/[postId]/photos/[photoId]/route";
import { getCurrUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const mockGetCurrUserId = getCurrUserId as jest.Mock;
const mockPhotoFindUnique = prisma.photo.findUnique as jest.Mock;
const mockPhotoDelete = prisma.photo.delete as jest.Mock;

const POST_ID = "post-1";
const PHOTO_ID = "photo-1";
const routeParams = { params: Promise.resolve({ postId: POST_ID, photoId: PHOTO_ID }) };

function makeRequest() {
  return new NextRequest(`http://localhost/api/posts/${POST_ID}/photos/${PHOTO_ID}`, {
    method: "DELETE",
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("DELETE /api/posts/[postId]/photos/[photoId]", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetCurrUserId.mockResolvedValue(null);
    const res = await DELETE(makeRequest(), routeParams);
    expect(res.status).toBe(401);
  });

  it("returns 404 when the photo does not exist", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockPhotoFindUnique.mockResolvedValue(null);
    const res = await DELETE(makeRequest(), routeParams);
    expect(res.status).toBe(404);
  });

  it("returns 404 when the photo belongs to a different post", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockPhotoFindUnique.mockResolvedValue({
      id: PHOTO_ID,
      postId: "some-other-post",
      post: { ownerId: "user-a" },
    });
    const res = await DELETE(makeRequest(), routeParams);
    expect(res.status).toBe(404);
  });

  it("returns 403 when the caller is not the post owner", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockPhotoFindUnique.mockResolvedValue({
      id: PHOTO_ID,
      postId: POST_ID,
      post: { ownerId: "user-b" },
    });
    const res = await DELETE(makeRequest(), routeParams);
    expect(res.status).toBe(403);
    expect(mockPhotoDelete).not.toHaveBeenCalled();
  });

  it("returns 200 and deletes when the caller owns the post", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockPhotoFindUnique.mockResolvedValue({
      id: PHOTO_ID,
      postId: POST_ID,
      post: { ownerId: "user-a" },
    });
    mockPhotoDelete.mockResolvedValue({ id: PHOTO_ID });
    mockRemove.mockResolvedValue({ error: null });

    const res = await DELETE(makeRequest(), routeParams);
    expect(res.status).toBe(200);
    expect(mockPhotoDelete).toHaveBeenCalledWith({ where: { id: PHOTO_ID } });
  });
});
