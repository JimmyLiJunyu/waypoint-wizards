jest.mock("@/lib/prisma", () => ({
  prisma: {
    follow: {
      create: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

import {
  followUser,
  unfollowUser,
  getFollowStatus,
  respondToFollowRequest,
  getFollowers,
  getNumFollowers,
  getNumFollowing,
  searchUsers,
} from "@/services/socialsServices";
import { prisma } from "@/lib/prisma";

const mockFollowCreate = prisma.follow.create as jest.Mock;
const mockFollowDelete = prisma.follow.delete as jest.Mock;
const mockFollowFindUnique = prisma.follow.findUnique as jest.Mock;
const mockFollowFindMany = prisma.follow.findMany as jest.Mock;
const mockFollowUpdate = prisma.follow.update as jest.Mock;
const mockFollowCount = prisma.follow.count as jest.Mock;
const mockUserFindMany = prisma.user.findMany as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

// followUser

describe("followUser", () => {
  it("creates a follow record with status PENDING", async () => {
    mockFollowCreate.mockResolvedValue({
      followerId: "user-a",
      followingId: "user-b",
      status: "PENDING",
    });
    const result = await followUser("user-a", "user-b");
    expect(mockFollowCreate).toHaveBeenCalledWith({
      data: { followerId: "user-a", followingId: "user-b", status: "PENDING" },
    });
    expect(result.status).toBe("PENDING");
  });
});

// unfollowUser

describe("unfollowUser", () => {
  it("calls delete with the correct compound key", async () => {
    mockFollowDelete.mockResolvedValue({});
    await unfollowUser("user-a", "user-b");
    expect(mockFollowDelete).toHaveBeenCalledWith({
      where: {
        followerId_followingId: { followerId: "user-a", followingId: "user-b" },
      },
    });
  });
});

// getFollowStatus

describe("getFollowStatus", () => {
  it("returns NONE when no follow record exists", async () => {
    mockFollowFindUnique.mockResolvedValue(null);
    const status = await getFollowStatus("user-a", "user-b");
    expect(status).toBe("NONE");
  });

  it("returns PENDING when follow record has status PENDING", async () => {
    mockFollowFindUnique.mockResolvedValue({ status: "PENDING" });
    const status = await getFollowStatus("user-a", "user-b");
    expect(status).toBe("PENDING");
  });

  it("returns ACCEPTED when follow record has status ACCEPTED", async () => {
    mockFollowFindUnique.mockResolvedValue({ status: "ACCEPTED" });
    const status = await getFollowStatus("user-a", "user-b");
    expect(status).toBe("ACCEPTED");
  });
});

// respondToFollowRequest

describe("respondToFollowRequest", () => {
  it("calls update with status ACCEPTED when action is ACCEPT", async () => {
    mockFollowUpdate.mockResolvedValue({ status: "ACCEPTED" });
    await respondToFollowRequest("user-a", "user-b", "ACCEPT");
    expect(mockFollowUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: "ACCEPTED" },
      })
    );
  });

  it("calls delete when action is REJECT", async () => {
    mockFollowDelete.mockResolvedValue({});
    await respondToFollowRequest("user-a", "user-b", "REJECT");
    expect(mockFollowDelete).toHaveBeenCalledWith({
      where: {
        followerId_followingId: { followerId: "user-a", followingId: "user-b" },
      },
    });
  });
});

// getFollowers

describe("getFollowers", () => {
  it("returns an array with follower details and followBackStatus", async () => {
    mockFollowFindMany.mockResolvedValue([
      {
        followerId: "user-b",
        following: { id: "user-b", name: "Bob", imageUrl: null },
      },
    ]);
    // getFollowStatus is called internally to mock findUnique for that call
    mockFollowFindUnique.mockResolvedValue({ status: "NONE" });

    const result = await getFollowers("user-a");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Bob");
    expect(result[0]).toHaveProperty("followBackStatus");
  });
});

// getNumFollowers

describe("getNumFollowers", () => {
  it("counts only ACCEPTED follows where followingId matches", async () => {
    mockFollowCount.mockResolvedValue(3);
    const count = await getNumFollowers("user-a");
    expect(mockFollowCount).toHaveBeenCalledWith({
      where: { followingId: "user-a", status: "ACCEPTED" },
    });
    expect(count).toBe(3);
  });
});

// getNumFollowing

describe("getNumFollowing", () => {
  it("counts only ACCEPTED follows where followerId matches", async () => {
    mockFollowCount.mockResolvedValue(5);
    const count = await getNumFollowing("user-a");
    expect(mockFollowCount).toHaveBeenCalledWith({
      where: { followerId: "user-a", status: "ACCEPTED" },
    });
    expect(count).toBe(5);
  });
});

// searchUsers

describe("searchUsers", () => {
  it("returns matching users with a followStatus field", async () => {
    mockUserFindMany.mockResolvedValue([
      { id: "user-b", name: "Alice", imageUrl: null },
    ]);
    mockFollowFindUnique.mockResolvedValue(null);

    const results = await searchUsers("alice", "user-a");
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Alice");
    expect(results[0]).toHaveProperty("followStatus");
    expect(results[0].followStatus).toBe("NONE");
  });
});
