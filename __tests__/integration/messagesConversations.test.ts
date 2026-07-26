jest.mock("@/lib/auth/session", () => ({
  getCurrUserId: jest.fn(),
}));

jest.mock("@/services/messagingServices", () => ({
  getOrCreateConversation: jest.fn(),
  listConversations: jest.fn(),
}));

import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/messages/conversations/route";
import { getCurrUserId } from "@/lib/auth/session";
import { getOrCreateConversation, listConversations } from "@/services/messagingServices";

const mockGetCurrUserId = getCurrUserId as jest.Mock;
const mockGetOrCreateConversation = getOrCreateConversation as jest.Mock;
const mockListConversations = listConversations as jest.Mock;

function makePostRequest(body: object) {
  return new NextRequest("http://localhost/api/messages/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/messages/conversations", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetCurrUserId.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns the caller's conversation list", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockListConversations.mockResolvedValue([{ id: "conv-1" }]);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.conversations).toHaveLength(1);
  });
});

describe("POST /api/messages/conversations", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetCurrUserId.mockResolvedValue(null);
    const res = await POST(makePostRequest({ otherUserId: "user-b" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when otherUserId is missing", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    const res = await POST(makePostRequest({}));
    expect(res.status).toBe(400);
    expect(mockGetOrCreateConversation).not.toHaveBeenCalled();
  });

  it("returns 400 when the two users are not mutual followers (service rejects)", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockGetOrCreateConversation.mockRejectedValue(new Error("You can only message mutual followers"));
    const res = await POST(makePostRequest({ otherUserId: "user-b" }));
    expect(res.status).toBe(400);
  });

  it("returns 201 with the conversation on success", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockGetOrCreateConversation.mockResolvedValue({ id: "conv-1" });
    const res = await POST(makePostRequest({ otherUserId: "user-b" }));
    expect(res.status).toBe(201);
    expect(mockGetOrCreateConversation).toHaveBeenCalledWith("user-a", "user-b");
  });
});
