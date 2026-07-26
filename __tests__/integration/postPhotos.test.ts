const mockUpload = jest.fn();
const mockGetPublicUrl = jest.fn();

jest.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  }),
}));

jest.mock("@/lib/auth/session", () => ({
  getCurrUserId: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    post: { findUnique: jest.fn() },
    photo: { create: jest.fn() },
  },
}));

import { NextRequest } from "next/server";
import { POST } from "@/app/api/posts/[postId]/photos/route";
import { getCurrUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const mockGetCurrUserId = getCurrUserId as jest.Mock;
const mockPostFindUnique = prisma.post.findUnique as jest.Mock;
const mockPhotoCreate = prisma.photo.create as jest.Mock;

const POST_ID = "post-1";
const routeParams = { params: Promise.resolve({ postId: POST_ID }) };

function makeRequest(formData?: FormData) {
  return new NextRequest(`http://localhost/api/posts/${POST_ID}/photos`, {
    method: "POST",
    body: formData,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/posts/[postId]/photos", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetCurrUserId.mockResolvedValue(null);
    const res = await POST(makeRequest(), routeParams);
    expect(res.status).toBe(401);
  });

  it("returns 404 when the post does not exist", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockPostFindUnique.mockResolvedValue(null);
    const res = await POST(makeRequest(), routeParams);
    expect(res.status).toBe(404);
  });

  it("returns 403 when the caller is not the post owner", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockPostFindUnique.mockResolvedValue({ id: POST_ID, ownerId: "user-b" });
    const res = await POST(makeRequest(), routeParams);
    expect(res.status).toBe(403);
  });

  it("returns 400 when no file is attached", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockPostFindUnique.mockResolvedValue({ id: POST_ID, ownerId: "user-a" });
    const res = await POST(makeRequest(new FormData()), routeParams);
    expect(res.status).toBe(400);
  });

  it("returns 201 and creates a Photo row on success", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockPostFindUnique.mockResolvedValue({ id: POST_ID, ownerId: "user-a" });
    mockUpload.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: "http://x/photo.jpg" } });
    mockPhotoCreate.mockResolvedValue({ id: "photo-1", url: "http://x/photo.jpg" });

    const formData = new FormData();
    formData.set("file", new File(["x"], "photo.jpg", { type: "image/jpeg" }));

    const res = await POST(makeRequest(formData), routeParams);
    expect(res.status).toBe(201);
    expect(mockPhotoCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ postId: POST_ID }) })
    );
  });
});
