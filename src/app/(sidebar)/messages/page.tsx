import { getCurrUserId } from "@/lib/auth/session";
import { listConversations } from "@/services/messagingServices";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { User } from "lucide-react";

export default async function MessagesPage() {
  const currUserId = await getCurrUserId();
  if (!currUserId) redirect("/login");

  const conversations = await listConversations(currUserId);

  return (
    <main className="h-full bg-[#F9F9F9] p-8 flex flex-col overflow-hidden">
      <div className="max-w-2xl mx-auto w-full flex flex-col flex-1 min-h-0">
        <h1 className="text-4xl font-bold mb-8 shrink-0">Messages</h1>

        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1">
          {conversations.length === 0 && (
            <p className="text-gray-500 text-sm">
              No conversations yet. Visit a mutual follower&apos;s profile to start one.
            </p>
          )}
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/messages/${c.id}`}
              className="flex items-center gap-3 p-3 rounded-lg bg-white hover:bg-gray-50 border transition-colors"
            >
              <div className="relative size-11 shrink-0 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                {c.otherUser.imageUrl ? (
                  <Image src={c.otherUser.imageUrl} alt={c.otherUser.name} fill className="object-cover" />
                ) : (
                  <User className="size-5 text-gray-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{c.otherUser.name}</p>
                <p className="text-sm text-gray-500 truncate">
                  {c.lastMessage ? c.lastMessage.content : "Say hi!"}
                </p>
              </div>
              {c.unreadCount > 0 && (
                <span className="shrink-0 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                  {c.unreadCount > 9 ? "9+" : c.unreadCount}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
