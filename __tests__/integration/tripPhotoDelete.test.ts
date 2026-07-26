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
    tripPhoto: { findUnique: jest.fn(), delete: jest.fn() },
  },
}));

import { NextRequest } from "next/server";
import { DELETE } from "@/app/api/itinerary/[itineraryId]/trip-photos/[photoId]/route";
import { getCurrUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const mockGetCurrUserId = getCurrUserId as jest.Mock;
const mockTripPhotoFindUnique = prisma.tripPhoto.findUnique as jest.Mock;
const mockTripPhotoDelete = prisma.tripPhoto.delete as jest.Mock;

const ITINERARY_ID = "itin-abc";
const PHOTO_ID = "photo-1";
const routeParams = { params: Promise.resolve({ itineraryId: ITINERARY_ID, photoId: PHOTO_ID }) };

function makeRequest() {
  return new NextRequest(
    `http://localhost/api/itinerary/${ITINERARY_ID}/trip-photos/${PHOTO_ID}`,
    { method: "DELETE" }
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("DELETE /api/itinerary/[itineraryId]/trip-photos/[photoId]", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetCurrUserId.mockResolvedValue(null);
    const res = await DELETE(makeRequest(), routeParams);
    expect(res.status).toBe(401);
  });

  it("returns 404 when the photo does not exist", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockTripPhotoFindUnique.mockResolvedValue(null);
    const res = await DELETE(makeRequest(), routeParams);
    expect(res.status).toBe(404);
  });

  it("returns 403 when the caller did not upload the photo", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockTripPhotoFindUnique.mockResolvedValue({ id: PHOTO_ID, uploadedBy: "user-b" });
    const res = await DELETE(makeRequest(), routeParams);
    expect(res.status).toBe(403);
    expect(mockTripPhotoDelete).not.toHaveBeenCalled();
  });

  it("returns 200 and deletes when the caller is the uploader", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockTripPhotoFindUnique.mockResolvedValue({ id: PHOTO_ID, uploadedBy: "user-a" });
    mockTripPhotoDelete.mockResolvedValue({ id: PHOTO_ID });
    mockRemove.mockResolvedValue({ error: null });

    const res = await DELETE(makeRequest(), routeParams);
    expect(res.status).toBe(200);
    expect(mockTripPhotoDelete).toHaveBeenCalledWith({ where: { id: PHOTO_ID } });
  });

  it("returns 400 when storage removal fails", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockTripPhotoFindUnique.mockResolvedValue({ id: PHOTO_ID, uploadedBy: "user-a" });
    mockTripPhotoDelete.mockResolvedValue({ id: PHOTO_ID });
    mockRemove.mockResolvedValue({ error: { message: "storage error" } });

    const res = await DELETE(makeRequest(), routeParams);
    expect(res.status).toBe(400);
  });
});
