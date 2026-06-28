jest.mock("@/services/userServices", () => ({
  verifyUser: jest.fn(),
}));

import { POST } from "@/app/api/auth/login/route";
import { verifyUser } from "@/services/userServices";

const mockVerifyUser = verifyUser as jest.Mock;

function makeRequest(body: object) {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/auth/login", () => {
  it("returns 200 with a Set-Cookie header when credentials are valid", async () => {
    mockVerifyUser.mockResolvedValue({ token: "mock_token" });
    const res = await POST(makeRequest({ email: "a@b.com", password: "correct" }));
    expect(res.status).toBe(200);
    // The cookie is set on the response, check headers
    expect(res.headers.get("set-cookie")).toContain("token=");
  });

  it("returns 401 when verifyUser throws Invalid Email", async () => {
    mockVerifyUser.mockRejectedValue(new Error("Invalid Email"));
    const res = await POST(makeRequest({ email: "ghost@b.com", password: "pass" }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Invalid Email");
  });

  it("returns 401 when verifyUser throws Invalid Credentials", async () => {
    mockVerifyUser.mockRejectedValue(new Error("Invalid Credentials"));
    const res = await POST(makeRequest({ email: "a@b.com", password: "wrong" }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Invalid Credentials");
  });

  it("returns 500 on unexpected errors", async () => {
    mockVerifyUser.mockRejectedValue(new Error("Database connection lost"));
    const res = await POST(makeRequest({ email: "a@b.com", password: "pass" }));
    expect(res.status).toBe(500);
  });
});
