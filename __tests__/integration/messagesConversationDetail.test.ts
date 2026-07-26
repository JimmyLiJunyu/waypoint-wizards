jest.mock("@/lib/auth/session", () => ({
  getCurrUserId: jest.fn(),
}));

jest.mock("@/services/messagingServices", () => ({
  getMessages: jest.fn(),
  isParticipant: jest.fn(),
  sendMessage: jest.fn(),
}));

import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/messages/conversations/[conversationId]/route";
import { getCurrUserId } from "@/lib/auth/session";
import { getMessages, isParticipant, sendMessage } from "@/services/messagingServices";

const mockGetCurrUserId = getCurrUserId as jest.Mock;
const mockGetMessages = getMessages as jest.Mock;
const mockIsParticipant = isParticipant as jest.Mock;
const mockSendMessage = sendMessage as jest.Mock;

const CONVERSATION_ID = "conv-1";
const routeParams = { params: Promise.resolve({ conversationId: CONVERSATION_ID }) };

function makeGetRequest() {
  return new NextRequest(`http://localhost/api/messages/conversations/${CONVERSATION_ID}`);
}

function makePostRequest(body: object) {
  return new NextRequest(`http://localhost/api/messages/conversations/${CONVERSATION_ID}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/messages/conversations/[conversationId]", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetCurrUserId.mockResolvedValue(null);
    const res = await GET(makeGetRequest(), routeParams);
    expect(res.status).toBe(401);
  });

  it("returns 403 when the caller is not a participant", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockIsParticipant.mockResolvedValue(false);
    const res = await GET(makeGetRequest(), routeParams);
    expect(res.status).toBe(403);
  });

  it("returns the conversation's messages for a participant", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockIsParticipant.mockResolvedValue(true);
    mockGetMessages.mockResolvedValue([{ id: "msg-1" }]);
    const res = await GET(makeGetRequest(), routeParams);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.messages).toHaveLength(1);
  });
});

describe("POST /api/messages/conversations/[conversationId]", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetCurrUserId.mockResolvedValue(null);
    const res = await POST(makePostRequest({ content: "hi" }), routeParams);
    expect(res.status).toBe(401);
  });

  it("returns 403 when the caller is not a participant", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockIsParticipant.mockResolvedValue(false);
    const res = await POST(makePostRequest({ content: "hi" }), routeParams);
    expect(res.status).toBe(403);
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it("returns 400 when the message content is empty", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockIsParticipant.mockResolvedValue(true);
    const res = await POST(makePostRequest({ content: "   " }), routeParams);
    expect(res.status).toBe(400);
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it("returns 201 and sends the trimmed message", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockIsParticipant.mockResolvedValue(true);
    mockSendMessage.mockResolvedValue({ id: "msg-1", content: "hi" });

    const res = await POST(makePostRequest({ content: "  hi  " }), routeParams);
    expect(res.status).toBe(201);
    expect(mockSendMessage).toHaveBeenCalledWith(CONVERSATION_ID, "user-a", "hi");
  });
});
