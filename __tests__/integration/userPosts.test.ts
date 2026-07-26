jest.mock("@/services/feedServices", () => ({
  getUserPosts: jest.fn(),
}));

import { GET } from "@/app/api/(socials)/users/[userId]/posts/route";
import { getUserPosts } from "@/services/feedServices";

const mockGetUserPosts = getUserPosts as jest.Mock;
const routeParams = { params: Promise.resolve({ userId: "user-a" }) };

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/users/[userId]/posts", () => {
  it("returns the user's published posts", async () => {
    mockGetUserPosts.mockResolvedValue([{ id: "post-1" }]);
    const res = await GET(new Request("http://localhost/api/users/user-a/posts"), routeParams);
    expect(res.status).toBe(200);
    expect(mockGetUserPosts).toHaveBeenCalledWith("user-a");
    const body = await res.json();
    expect(body.posts).toHaveLength(1);
  });

  it("returns 400 if the service throws", async () => {
    mockGetUserPosts.mockRejectedValue(new Error("boom"));
    const res = await GET(new Request("http://localhost/api/users/user-a/posts"), routeParams);
    expect(res.status).toBe(400);
  });
});
