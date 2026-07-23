import { getCurrUserId } from "@/lib/auth/session";
import { getMessages, isParticipant } from "@/services/messagingServices";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import ChatThread from "@/components/messages/ChatThread";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const currUserId = await getCurrUserId();
  if (!currUserId) redirect("/login");

  if (!(await isParticipant(conversationId, currUserId))) return notFound();

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      userA: { select: { id: true, name: true, imageUrl: true } },
      userB: { select: { id: true, name: true, imageUrl: true } },
    },
  });
  if (!conversation) return notFound();

  const otherUser = conversation.userAId === currUserId ? conversation.userB : conversation.userA;
  const messages = await getMessages(conversationId, currUserId);

  return (
    <ChatThread
      conversationId={conversationId}
      currentUserId={currUserId}
      otherUser={otherUser}
      initialMessages={messages.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      }))}
    />
  );
}
