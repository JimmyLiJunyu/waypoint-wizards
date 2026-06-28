jest.mock("@/services/userServices", () => ({
  createUser: jest.fn(),
}));

import { POST } from "@/app/api/auth/signup/route";
import { createUser } from "@/services/userServices";

const mockCreateUser = createUser as jest.Mock;

function makeRequest(body: object) {
  return new Request("http://localhost/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("POST /api/auth/signup", () => {
  it("returns 200 with success true when user is created", async () => {
    mockCreateUser.mockResolvedValue({ id: "1", email: "a@b.com", name: "Alice" });
    const res = await POST(makeRequest({ email: "a@b.com", name: "Alice", password: "pass" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("returns 200 with an error message when email is missing", async () => {
    const res = await POST(makeRequest({ name: "Alice", password: "pass" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns 200 with an error message when name is missing", async () => {
    const res = await POST(makeRequest({ email: "a@b.com", password: "pass" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns 200 with an error message when password is missing", async () => {
    const res = await POST(makeRequest({ email: "a@b.com", name: "Alice" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns 500 when createUser throws an unexpected error", async () => {
    mockCreateUser.mockRejectedValue(new Error("Database error"));
    const res = await POST(makeRequest({ email: "a@b.com", name: "Alice", password: "pass" }));
    expect(res.status).toBe(500);
  });
});
