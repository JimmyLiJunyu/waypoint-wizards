// Mock Prisma so no real database is hit — we control what each query returns.
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock bcrypt so we don't do real hashing in unit tests.
jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashed_password"),
  compare: jest.fn(),
}));

// Mock signJWT so we don't need a real JWT secret here.
jest.mock("@/lib/auth/tokens", () => ({
  signJWT: jest.fn().mockResolvedValue("mock_token"),
}));

import { createUser, verifyUser } from "@/services/userServices";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

// Cast to jest mocks so TypeScript knows we can call .mockResolvedValue on them.
const mockFindUnique = prisma.user.findUnique as jest.Mock;
const mockCreate = prisma.user.create as jest.Mock;
const mockBcryptCompare = bcrypt.compare as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("createUser", () => {
  it("throws if email is already registered", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: "1", email: "test@test.com" });
    await expect(
      createUser({ email: "test@test.com", name: "Alice", password: "pass" })
    ).rejects.toThrow("Email already registered");
  });

  it("throws if username is already taken", async () => {
    mockFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "2", name: "alice" });
    await expect(
      createUser({ email: "new@test.com", name: "alice", password: "pass" })
    ).rejects.toThrow("Name already taken.");
  });

  it("normalises email to lowercase before saving", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: "3", email: "user@test.com", name: "Bob" });
    await createUser({ email: "USER@TEST.COM", name: "Bob", password: "pass" });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: "user@test.com" }),
      })
    );
  });

  it("does not store the plain-text password", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: "4", email: "x@test.com", name: "X" });
    await createUser({ email: "x@test.com", name: "X", password: "plaintext" });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ password: "hashed_password" }),
      })
    );
  });
});

describe("verifyUser", () => {
  it("throws Invalid Email when user does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(
      verifyUser({ email: "ghost@test.com", name: "", password: "pass" })
    ).rejects.toThrow("Invalid Email");
  });

  it("throws Invalid Credentials when password is wrong", async () => {
    mockFindUnique.mockResolvedValue({ id: "1", email: "a@b.com", password: "hashed" });
    mockBcryptCompare.mockResolvedValue(false);
    await expect(
      verifyUser({ email: "a@b.com", name: "", password: "wrong" })
    ).rejects.toThrow("Invalid Credentials");
  });

  it("returns a token on correct credentials", async () => {
    mockFindUnique.mockResolvedValue({ id: "1", email: "a@b.com", password: "hashed" });
    mockBcryptCompare.mockResolvedValue(true);
    const result = await verifyUser({ email: "a@b.com", name: "", password: "correct" });
    expect(result.token).toBe("mock_token");
  });
});
