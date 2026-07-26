jest.mock("@/lib/prisma", () => ({
  prisma: {
    post: {
      findMany: jest.fn(),
    },
    follow: {
      findMany: jest.fn(),
    },
  },
}));

import { getUserPosts, getFeedPosts } from "@/services/feedServices";
import { prisma } from "@/lib/prisma";

const mockPostFindMany = prisma.post.findMany as jest.Mock;
const mockFollowFindMany = prisma.follow.findMany as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getUserPosts", () => {
  it("only queries published posts for the given owner", async () => {
    mockPostFindMany.mockResolvedValue([]);
    await getUserPosts("user-a");

    expect(mockPostFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId: "user-a", published: true },
      })
    );
  });

  it("includes owner, individual photos, likes, and trip itinerary with trip photos", async () => {
    mockPostFindMany.mockResolvedValue([]);
    await getUserPosts("user-a");

    const call = mockPostFindMany.mock.calls[0][0];
    expect(call.include).toHaveProperty("owner");
    expect(call.include).toHaveProperty("photo", true);
    expect(call.include).toHaveProperty("postLike");
    expect(call.include.itinerary.select).toHaveProperty("tripPhotos", true);
    expect(call.include.itinerary.select).toHaveProperty("collaborators");
  });

  it("returns whatever prisma resolves", async () => {
    const posts = [{ id: "post-1" }];
    mockPostFindMany.mockResolvedValue(posts);
    const result = await getUserPosts("user-a");
    expect(result).toBe(posts);
  });
});

describe("getFeedPosts", () => {
  it("scopes posts to users the caller follows with an ACCEPTED status", async () => {
    mockFollowFindMany.mockResolvedValue([{ followingId: "user-b" }, { followingId: "user-c" }]);
    mockPostFindMany.mockResolvedValue([]);

    await getFeedPosts("user-a");

    expect(mockFollowFindMany).toHaveBeenCalledWith({
      where: { followerId: "user-a", status: "ACCEPTED" },
      select: { followingId: true },
    });
    expect(mockPostFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId: { in: ["user-b", "user-c"] }, published: true },
        take: 20,
      })
    );
  });

  it("queries an empty ownerId list when the caller follows no one", async () => {
    mockFollowFindMany.mockResolvedValue([]);
    mockPostFindMany.mockResolvedValue([]);

    await getFeedPosts("user-a");

    expect(mockPostFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId: { in: [] }, published: true },
      })
    );
  });
});
