jest.mock("@/lib/auth/session", () => ({
  getCurrUserId: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    itinerary: { count: jest.fn() },
  },
}));

jest.mock("@/services/tripServices", () => ({
  createItinerary: jest.fn(),
}));

import { POST } from "@/app/api/new-trip/route";
import { getCurrUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { createItinerary } from "@/services/tripServices";

const mockGetCurrUserId = getCurrUserId as jest.Mock;
const mockItineraryCount = prisma.itinerary.count as jest.Mock;
const mockCreateItinerary = createItinerary as jest.Mock;

function makeRequest(body: object) {
  return new Request("http://localhost/api/new-trip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/new-trip", () => {
  const validBody = {
    destination: "Tokyo, Japan",
    startDate: "2026-08-01",
    endDate: "2026-08-10",
  };

  it("returns 401 when unauthenticated", async () => {
    mockGetCurrUserId.mockResolvedValue(null);
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(401);
    expect(mockCreateItinerary).not.toHaveBeenCalled();
  });

  it("returns 400 when the end date is before the start date", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    const res = await POST(
      makeRequest({ destination: "Tokyo, Japan", startDate: "2026-08-10", endDate: "2026-08-01" })
    );
    expect(res.status).toBe(400);
    expect(mockCreateItinerary).not.toHaveBeenCalled();
  });

  it("returns 400 when the end date equals the start date minus a day (still before)", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    const res = await POST(
      makeRequest({ destination: "Tokyo, Japan", startDate: "2026-08-05", endDate: "2026-08-04" })
    );
    expect(res.status).toBe(400);
  });

  it("allows the end date to equal the start date (single-day trip)", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockItineraryCount.mockResolvedValue(0);
    mockCreateItinerary.mockResolvedValue({ id: "itin-1" });

    const res = await POST(
      makeRequest({ destination: "Tokyo, Japan", startDate: "2026-08-05", endDate: "2026-08-05" })
    );
    expect(res.status).toBe(201);
  });

  it("creates the itinerary and returns 201 for a valid date range", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockItineraryCount.mockResolvedValue(0);
    mockCreateItinerary.mockResolvedValue({ id: "itin-1", title: "New Trip" });

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(201);
    expect(mockCreateItinerary).toHaveBeenCalledWith(
      expect.objectContaining({ title: "New Trip", userId: "user-a" })
    );
  });

  it("numbers the default title for a user's later trips", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockItineraryCount.mockResolvedValue(2);
    mockCreateItinerary.mockResolvedValue({ id: "itin-3" });

    await POST(makeRequest(validBody));
    expect(mockCreateItinerary).toHaveBeenCalledWith(
      expect.objectContaining({ title: "New Trip 3" })
    );
  });
});
