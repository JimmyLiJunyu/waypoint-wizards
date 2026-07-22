"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";

export default function MessageButton({ otherUserId }: { otherUserId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId }),
      });
      if (res.ok) {
        const { conversation } = await res.json();
        router.push(`/messages/${conversation.id}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 font-medium text-sm transition-colors disabled:opacity-50"
    >
      <MessageCircle className="size-4" />
      {loading ? "Opening..." : "Message"}
    </button>
  );
}
