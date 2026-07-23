"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Send, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type OtherUser = { id: string; name: string; imageUrl: string | null };

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
};

export default function ChatThread({
  conversationId,
  currentUserId,
  otherUser,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  otherUser: OtherUser;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Message",
          filter: `conversationId=eq.${conversationId}`,
        },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;
    setDraft("");
    setSending(true);
    try {
      const res = await fetch(`/api/messages/conversations/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const { message } = await res.json();
        setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="h-full bg-[#F9F9F9] flex flex-col overflow-hidden">
      <div className="max-w-2xl mx-auto w-full flex flex-col flex-1 min-h-0 p-8">
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <Link href="/messages" className="p-1.5 rounded-full hover:bg-gray-200 transition-colors">
            <ArrowLeft className="size-5" />
          </Link>
          <div className="relative size-10 shrink-0 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {otherUser.imageUrl ? (
              <Image src={otherUser.imageUrl} alt={otherUser.name} fill className="object-cover" />
            ) : (
              <User className="size-5 text-gray-500" />
            )}
          </div>
          <p className="font-semibold text-lg">{otherUser.name}</p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 pr-2">
          {messages.length === 0 && (
            <p className="text-gray-400 text-sm text-center mt-8">Say hi to {otherUser.name}!</p>
          )}
          {messages.map((m) => {
            const isMine = m.senderId === currentUserId;
            return (
              <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm break-words ${
                    isMine ? "bg-red-500 text-white rounded-br-sm" : "bg-white border rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="flex items-center gap-2 mt-4 shrink-0">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border rounded-full px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-red-400"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="p-2.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 shrink-0"
          >
            <Send className="size-4" />
          </button>
        </form>
      </div>
    </main>
  );
}
