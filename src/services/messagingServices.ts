import { prisma } from "@/lib/prisma";
import { getFollowStatus } from "./socialsServices";

export async function areMutualFollowers(userAId: string, userBId: string) {
    const [aToB, bToA] = await Promise.all([
        getFollowStatus(userAId, userBId),
        getFollowStatus(userBId, userAId),
    ]);
    return aToB === "ACCEPTED" && bToA === "ACCEPTED";
}

function orderIds(userAId: string, userBId: string): [string, string] {
    return userAId < userBId ? [userAId, userBId] : [userBId, userAId];
}

export async function getOrCreateConversation(callerId: string, otherUserId: string) {
    if (callerId === otherUserId) throw new Error("Cannot message yourself");
    if (!(await areMutualFollowers(callerId, otherUserId))) {
        throw new Error("You can only message mutual followers");
    }

    const [userAId, userBId] = orderIds(callerId, otherUserId);
    return await prisma.conversation.upsert({
        where: { userAId_userBId: { userAId, userBId } },
        create: { userAId, userBId },
        update: {},
    });
}

export async function isParticipant(conversationId: string, userId: string) {
    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    return conversation !== null && (conversation.userAId === userId || conversation.userBId === userId);
}

export async function listConversations(userId: string) {
    const conversations = await prisma.conversation.findMany({
        where: { OR: [{ userAId: userId }, { userBId: userId }] },
        include: {
            userA: { select: { id: true, name: true, imageUrl: true } },
            userB: { select: { id: true, name: true, imageUrl: true } },
            messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { updatedAt: "desc" },
    });

    return Promise.all(
        conversations.map(async (c) => {
            const otherUser = c.userAId === userId ? c.userB : c.userA;
            const unreadCount = await prisma.message.count({
                where: { conversationId: c.id, senderId: { not: userId }, readAt: null },
            });
            return {
                id: c.id,
                otherUser,
                lastMessage: c.messages[0] ?? null,
                unreadCount,
            };
        })
    );
}

export async function getMessages(conversationId: string, userId: string) {
    const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
    });

    await prisma.message.updateMany({
        where: { conversationId, senderId: { not: userId }, readAt: null },
        data: { readAt: new Date() },
    });

    return messages;
}

export async function sendMessage(conversationId: string, senderId: string, content: string) {
    const [message] = await prisma.$transaction([
        prisma.message.create({ data: { conversationId, senderId, content } }),
        prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }),
    ]);
    return message;
}
