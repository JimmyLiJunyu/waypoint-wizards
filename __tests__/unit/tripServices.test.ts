jest.mock("@/lib/prisma", () => ({
  prisma: {
    itinerary: {
      create: jest.fn(),
    },
  },
}));

import { createItinerary } from "@/services/tripServices";
import { prisma } from "@/lib/prisma";

const mockItineraryCreate = prisma.itinerary.create as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("createItinerary", () => {
  const input = {
    title: "Tokyo Trip",
    userId: "user-1",
    destination: "Tokyo, Japan",
    startDate: new Date("2026-07-01"),
    endDate: new Date("2026-07-10"),
  };

  it("calls prisma.itinerary.create with the correct fields", async () => {
    mockItineraryCreate.mockResolvedValue({
      id: "itin-1",
      title: "Tokyo Trip",
      location: "Tokyo, Japan",
      startDate: input.startDate,
      endDate: input.endDate,
      collaborators: [{ userId: "user-1", role: "OWNER" }],
      destinations: [],
    });

    await createItinerary(input);

    expect(mockItineraryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Tokyo Trip",
          location: "Tokyo, Japan",
          startDate: input.startDate,
          endDate: input.endDate,
        }),
      })
    );
  });

  it("creates a Collaborator row with role OWNER for the given userId", async () => {
    mockItineraryCreate.mockResolvedValue({
      id: "itin-1",
      title: "Tokyo Trip",
      location: "Tokyo, Japan",
      startDate: input.startDate,
      endDate: input.endDate,
      collaborators: [{ userId: "user-1", role: "OWNER" }],
      destinations: [],
    });

    await createItinerary(input);

    expect(mockItineraryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          collaborators: {
            create: expect.objectContaining({
              userId: "user-1",
              role: "OWNER",
            }),
          },
        }),
      })
    );
  });

  it("returns an object that includes a collaborators array", async () => {
    mockItineraryCreate.mockResolvedValue({
      id: "itin-1",
      title: "Tokyo Trip",
      location: "Tokyo, Japan",
      startDate: input.startDate,
      endDate: input.endDate,
      collaborators: [{ userId: "user-1", role: "OWNER" }],
      destinations: [],
    });

    const result = await createItinerary(input);
    expect(result).toHaveProperty("collaborators");
    expect(Array.isArray(result.collaborators)).toBe(true);
  });
});
