const mockExchangeCodeForSession = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: { exchangeCodeForSession: mockExchangeCodeForSession },
  })),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: jest.fn(), create: jest.fn() },
  },
}));

import { GET } from "@/app/auth/callback/route";
import { prisma } from "@/lib/prisma";

const mockUserFindUnique = prisma.user.findUnique as jest.Mock;
const mockUserCreate = prisma.user.create as jest.Mock;

function makeRequest(query: string) {
  return new Request(`http://localhost/auth/callback${query}`);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /auth/callback", () => {
  it("redirects to /login when there is no code param", async () => {
    const res = await GET(makeRequest(""));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/login");
  });

  it("redirects to /login when the code exchange errors", async () => {
    mockExchangeCodeForSession.mockResolvedValue({ data: {}, error: new Error("bad code") });
    const res = await GET(makeRequest("?code=abc"));
    expect(res.headers.get("location")).toBe("http://localhost/login");
  });

  it("redirects to /login when the OAuth user has no email (regression)", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: { id: "user-1", email: undefined, user_metadata: { full_name: "Alice" } } },
      error: null,
    });
    const res = await GET(makeRequest("?code=abc"));
    expect(res.headers.get("location")).toBe("http://localhost/login");
    expect(mockUserCreate).not.toHaveBeenCalled();
  });

  it("redirects to /dashboard and creates a User row for a first-time sign-in", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "alice@example.com",
          user_metadata: { full_name: "Alice", avatar_url: "http://x/avatar.jpg" },
        },
      },
      error: null,
    });
    mockUserFindUnique.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue({ id: "user-1" });

    const res = await GET(makeRequest("?code=abc"));
    expect(res.headers.get("location")).toBe("http://localhost/dashboard");
    expect(mockUserCreate).toHaveBeenCalledWith({
      data: {
        id: "user-1",
        email: "alice@example.com",
        name: "Alice",
        imageUrl: "http://x/avatar.jpg",
      },
    });
  });

  it("falls back to the email prefix when no name metadata is present", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: { id: "user-1", email: "bob@example.com", user_metadata: {} } },
      error: null,
    });
    mockUserFindUnique.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue({ id: "user-1" });

    await GET(makeRequest("?code=abc"));
    expect(mockUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ name: "bob" }) })
    );
  });

  it("appends a numeric suffix when the derived name is already taken", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: { id: "user-1", email: "alice@example.com", user_metadata: { full_name: "Alice" } } },
      error: null,
    });
    mockUserFindUnique
      .mockResolvedValueOnce(null) // findUnique by id -> no existing user
      .mockResolvedValueOnce({ id: "someone-else" }) // "Alice" taken
      .mockResolvedValueOnce(null); // "Alice1" free
    mockUserCreate.mockResolvedValue({ id: "user-1" });

    await GET(makeRequest("?code=abc"));
    expect(mockUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ name: "Alice1" }) })
    );
  });

  it("skips user creation entirely when the user already exists", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: { id: "user-1", email: "alice@example.com", user_metadata: {} } },
      error: null,
    });
    mockUserFindUnique.mockResolvedValue({ id: "user-1" });

    const res = await GET(makeRequest("?code=abc"));
    expect(mockUserCreate).not.toHaveBeenCalled();
    expect(res.headers.get("location")).toBe("http://localhost/dashboard");
  });
});
