jest.mock("@/lib/auth/session", () => ({
  getCurrUserId: jest.fn(),
}));

jest.mock("@/services/feedServices", () => ({
  getFeedPosts: jest.fn(),
}));

import { GET } from "@/app/api/feed/route";
import { getCurrUserId } from "@/lib/auth/session";
import { getFeedPosts } from "@/services/feedServices";

const mockGetCurrUserId = getCurrUserId as jest.Mock;
const mockGetFeedPosts = getFeedPosts as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/feed", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetCurrUserId.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
    expect(mockGetFeedPosts).not.toHaveBeenCalled();
  });

  it("returns the caller's feed posts", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockGetFeedPosts.mockResolvedValue([{ id: "post-1" }]);

    const res = await GET();
    expect(res.status).toBe(200);
    expect(mockGetFeedPosts).toHaveBeenCalledWith("user-a");
    const body = await res.json();
    expect(body.posts).toHaveLength(1);
  });
});
