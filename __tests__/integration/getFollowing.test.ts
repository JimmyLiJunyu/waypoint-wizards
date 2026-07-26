jest.mock("@/services/socialsServices", () => ({
  getFollowing: jest.fn(),
}));

import { GET } from "@/app/api/(socials)/users/[userId]/get-following/route";
import { getFollowing } from "@/services/socialsServices";

const mockGetFollowing = getFollowing as jest.Mock;
const routeParams = { params: Promise.resolve({ userId: "user-a" }) };

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/users/[userId]/get-following", () => {
  it("returns the list of people the user follows", async () => {
    mockGetFollowing.mockResolvedValue([{ id: "user-b", name: "Bob" }]);
    const res = await GET(new Request("http://localhost/api/users/user-a/get-following"), routeParams);
    expect(res.status).toBe(200);
    expect(mockGetFollowing).toHaveBeenCalledWith("user-a");
    const body = await res.json();
    expect(body).toHaveLength(1);
  });
});
