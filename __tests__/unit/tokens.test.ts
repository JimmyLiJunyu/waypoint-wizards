import { signJWT, verifyJWT } from "@/lib/auth/tokens";

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

process.env.JWT_SECRET = "test_secret_key_for_unit_tests";

describe("signJWT", () => {
  it("returns a non-empty string token", async () => {
    const token = await signJWT({ userId: "user-1", email: "a@b.com" });
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
  });
});

describe("verifyJWT", () => {
  it("returns the correct payload for a valid token", async () => {
    const token = await signJWT({ userId: "user-1", email: "a@b.com" });
    const payload = await verifyJWT(token);
    expect(payload?.userId).toBe("user-1");
    expect(payload?.email).toBe("a@b.com");
  });

  it("returns null for a tampered token", async () => {
    const token = await signJWT({ userId: "user-1", email: "a@b.com" });
    const result = await verifyJWT(token + "tampered");
    expect(result).toBeNull();
  });

  it("returns null for an empty string", async () => {
    const result = await verifyJWT("");
    expect(result).toBeNull();
  });

  it("returns null for a completely invalid string", async () => {
    const result = await verifyJWT("not.a.jwt");
    expect(result).toBeNull();
  });
});
