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
    collaborator: { findUnique: jest.fn() },
    tripPhoto: { findMany: jest.fn(), create: jest.fn() },
  },
}));

import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/itinerary/[itineraryId]/trip-photos/route";
import { getCurrUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const mockGetCurrUserId = getCurrUserId as jest.Mock;
const mockCollaboratorFindUnique = prisma.collaborator.findUnique as jest.Mock;
const mockTripPhotoFindMany = prisma.tripPhoto.findMany as jest.Mock;
const mockTripPhotoCreate = prisma.tripPhoto.create as jest.Mock;

const ITINERARY_ID = "itin-abc";
const routeParams = { params: Promise.resolve({ itineraryId: ITINERARY_ID }) };

function makeGetRequest() {
  return new NextRequest(`http://localhost/api/itinerary/${ITINERARY_ID}/trip-photos`);
}

function makePostRequest(formData?: FormData) {
  return new NextRequest(`http://localhost/api/itinerary/${ITINERARY_ID}/trip-photos`, {
    method: "POST",
    body: formData,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/itinerary/[itineraryId]/trip-photos", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetCurrUserId.mockResolvedValue(null);
    const res = await GET(makeGetRequest(), routeParams);
    expect(res.status).toBe(401);
  });

  it("returns 403 when the caller is not a collaborator", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockCollaboratorFindUnique.mockResolvedValue(null);
    const res = await GET(makeGetRequest(), routeParams);
    expect(res.status).toBe(403);
  });

  it("returns 200 with the trip's photos for a collaborator", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockCollaboratorFindUnique.mockResolvedValue({ userId: "user-a", itineraryId: ITINERARY_ID });
    mockTripPhotoFindMany.mockResolvedValue([{ id: "photo-1", url: "http://x/1.jpg" }]);

    const res = await GET(makeGetRequest(), routeParams);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.photos).toHaveLength(1);
  });
});

describe("POST /api/itinerary/[itineraryId]/trip-photos", () => {
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

  it("returns 400 when no file is attached", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockCollaboratorFindUnique.mockResolvedValue({ userId: "user-a" });
    const res = await POST(makePostRequest(new FormData()), routeParams);
    expect(res.status).toBe(400);
  });

  it("returns 500 when the storage upload fails", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockCollaboratorFindUnique.mockResolvedValue({ userId: "user-a" });
    mockUpload.mockResolvedValue({ error: { message: "upload failed" } });

    const formData = new FormData();
    formData.set("file", new File(["x"], "photo.jpg", { type: "image/jpeg" }));

    const res = await POST(makePostRequest(formData), routeParams);
    expect(res.status).toBe(500);
  });

  it("returns 201 and creates a TripPhoto row on success", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockCollaboratorFindUnique.mockResolvedValue({ userId: "user-a" });
    mockUpload.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: "http://x/photo.jpg" } });
    mockTripPhotoCreate.mockResolvedValue({ id: "photo-1", url: "http://x/photo.jpg" });

    const formData = new FormData();
    formData.set("file", new File(["x"], "photo.jpg", { type: "image/jpeg" }));

    const res = await POST(makePostRequest(formData), routeParams);
    expect(res.status).toBe(201);
    expect(mockTripPhotoCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ itineraryId: ITINERARY_ID, uploadedBy: "user-a" }),
      })
    );
  });
});
