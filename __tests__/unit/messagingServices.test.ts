jest.mock("@/lib/prisma", () => ({
  prisma: {
    conversation: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    message: {
      count: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock("@/services/socialsServices", () => ({
  getFollowStatus: jest.fn(),
}));

import {
  areMutualFollowers,
  getOrCreateConversation,
  isParticipant,
  listConversations,
  getMessages,
  sendMessage,
} from "@/services/messagingServices";
import { prisma } from "@/lib/prisma";
import { getFollowStatus } from "@/services/socialsServices";

const mockGetFollowStatus = getFollowStatus as jest.Mock;
const mockConversationUpsert = prisma.conversation.upsert as jest.Mock;
const mockConversationFindUnique = prisma.conversation.findUnique as jest.Mock;
const mockConversationFindMany = prisma.conversation.findMany as jest.Mock;
const mockMessageCount = prisma.message.count as jest.Mock;
const mockMessageFindMany = prisma.message.findMany as jest.Mock;
const mockMessageUpdateMany = prisma.message.updateMany as jest.Mock;
const mockTransaction = prisma.$transaction as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("areMutualFollowers", () => {
  it("returns true only when both directions are ACCEPTED", async () => {
    mockGetFollowStatus.mockResolvedValueOnce("ACCEPTED").mockResolvedValueOnce("ACCEPTED");
    expect(await areMutualFollowers("user-a", "user-b")).toBe(true);
  });

  it("returns false when only one direction is ACCEPTED", async () => {
    mockGetFollowStatus.mockResolvedValueOnce("ACCEPTED").mockResolvedValueOnce("PENDING");
    expect(await areMutualFollowers("user-a", "user-b")).toBe(false);
  });

  it("returns false when neither direction follows", async () => {
    mockGetFollowStatus.mockResolvedValueOnce("NONE").mockResolvedValueOnce("NONE");
    expect(await areMutualFollowers("user-a", "user-b")).toBe(false);
  });
});

describe("getOrCreateConversation", () => {
  it("throws when messaging yourself", async () => {
    await expect(getOrCreateConversation("user-a", "user-a")).rejects.toThrow(
      "Cannot message yourself"
    );
    expect(mockConversationUpsert).not.toHaveBeenCalled();
  });

  it("throws when the two users are not mutual followers", async () => {
    mockGetFollowStatus.mockResolvedValue("NONE");
    await expect(getOrCreateConversation("user-a", "user-b")).rejects.toThrow(
      "You can only message mutual followers"
    );
    expect(mockConversationUpsert).not.toHaveBeenCalled();
  });

  it("canonically sorts the two ids the same way regardless of who calls it", async () => {
    mockGetFollowStatus.mockResolvedValue("ACCEPTED");
    mockConversationUpsert.mockResolvedValue({ id: "conv-1", userAId: "user-a", userBId: "user-b" });

    await getOrCreateConversation("user-b", "user-a");

    expect(mockConversationUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userAId_userBId: { userAId: "user-a", userBId: "user-b" } },
        create: { userAId: "user-a", userBId: "user-b" },
      })
    );
  });
});

describe("isParticipant", () => {
  it("returns false when the conversation does not exist", async () => {
    mockConversationFindUnique.mockResolvedValue(null);
    expect(await isParticipant("conv-1", "user-a")).toBe(false);
  });

  it("returns true when the user is userA or userB", async () => {
    mockConversationFindUnique.mockResolvedValue({ userAId: "user-a", userBId: "user-b" });
    expect(await isParticipant("conv-1", "user-a")).toBe(true);
    expect(await isParticipant("conv-1", "user-b")).toBe(true);
  });

  it("returns false when the user is neither participant", async () => {
    mockConversationFindUnique.mockResolvedValue({ userAId: "user-a", userBId: "user-b" });
    expect(await isParticipant("conv-1", "user-c")).toBe(false);
  });
});

describe("listConversations", () => {
  it("resolves otherUser to whichever side the caller is not on", async () => {
    mockConversationFindMany.mockResolvedValue([
      {
        id: "conv-1",
        userAId: "user-a",
        userBId: "user-b",
        userA: { id: "user-a", name: "Alice" },
        userB: { id: "user-b", name: "Bob" },
        messages: [{ id: "msg-1", content: "hi" }],
      },
    ]);
    mockMessageCount.mockResolvedValue(0);

    const result = await listConversations("user-a");
    expect(result[0].otherUser).toEqual({ id: "user-b", name: "Bob" });
  });

  it("counts only unread messages from the other party", async () => {
    mockConversationFindMany.mockResolvedValue([
      {
        id: "conv-1",
        userAId: "user-a",
        userBId: "user-b",
        userA: { id: "user-a", name: "Alice" },
        userB: { id: "user-b", name: "Bob" },
        messages: [],
      },
    ]);
    mockMessageCount.mockResolvedValue(3);

    const result = await listConversations("user-a");
    expect(mockMessageCount).toHaveBeenCalledWith({
      where: { conversationId: "conv-1", senderId: { not: "user-a" }, readAt: null },
    });
    expect(result[0].unreadCount).toBe(3);
  });

  it("returns null lastMessage when there are no messages yet", async () => {
    mockConversationFindMany.mockResolvedValue([
      {
        id: "conv-1",
        userAId: "user-a",
        userBId: "user-b",
        userA: { id: "user-a", name: "Alice" },
        userB: { id: "user-b", name: "Bob" },
        messages: [],
      },
    ]);
    mockMessageCount.mockResolvedValue(0);

    const result = await listConversations("user-a");
    expect(result[0].lastMessage).toBeNull();
  });
});

describe("getMessages", () => {
  it("marks the other party's unread messages as read", async () => {
    mockMessageFindMany.mockResolvedValue([]);
    mockMessageUpdateMany.mockResolvedValue({ count: 2 });

    await getMessages("conv-1", "user-a");

    expect(mockMessageUpdateMany).toHaveBeenCalledWith({
      where: { conversationId: "conv-1", senderId: { not: "user-a" }, readAt: null },
      data: { readAt: expect.any(Date) },
    });
  });

  it("returns messages ordered oldest first", async () => {
    mockMessageFindMany.mockResolvedValue([]);
    mockMessageUpdateMany.mockResolvedValue({ count: 0 });

    await getMessages("conv-1", "user-a");

    expect(mockMessageFindMany).toHaveBeenCalledWith({
      where: { conversationId: "conv-1" },
      orderBy: { createdAt: "asc" },
    });
  });
});

describe("sendMessage", () => {
  it("creates the message and touches the conversation in one transaction", async () => {
    const created = { id: "msg-1", conversationId: "conv-1", senderId: "user-a", content: "hi" };
    mockTransaction.mockResolvedValue([created, { id: "conv-1" }]);

    const result = await sendMessage("conv-1", "user-a", "hi");

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockTransaction.mock.calls[0][0]).toHaveLength(2);
    expect(result).toBe(created);
  });
});
