"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { User } from "lucide-react";
import Image from "next/image";
import { useUser } from "@/context/UserContext";

interface FollowerCardProps {
  id: string,
  name: string,
  imageUrl: string | null,
  followStatus: string,
  onReject: (id: string) => void,
  onAccept: () => void
}

export default function FollowRequestCard({
  id,
  name,
  imageUrl,
  followStatus,
  onReject,
  onAccept
}: FollowerCardProps) {
  const router = useRouter();
  const { user } = useUser();
  const [status, setStatus] = useState(followStatus);
  const [followedBack, setFollowedBack] = useState(false)
  const [followedBackStatus, setFollowedBackStatus] = useState<"PENDING" | "NONE">("NONE")

  const isOwnAccount = user?.id === id;
  

  async function handleAccept(e: React.MouseEvent) {
    e.stopPropagation();
    const response = await fetch(`/api/users/${id}/follow-request`, {
      method: "PATCH",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({action: "ACCEPT"})
      
    });
    if (response.ok) {
      const check = await fetch(`/api/users/${id}/is-following`);
      const { isFollowing } = await check.json();
      setFollowedBack(isFollowing);
      setStatus('ACCEPTED')
      onAccept()
    }
  }

  async function handleReject(e: React.MouseEvent) {
    e.stopPropagation()
    const response = await fetch(`/api/users/${id}/follow-request`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({action: "REJECT"})
    });
    if (response.ok) onReject(id)
  }

  async function handleFollowBack(e: React.MouseEvent) {
    e.stopPropagation();
    const response = await fetch(`/api/users/${id}/follow`, {
      method: "POST",
    });
    if (response.ok) {
      setStatus("PENDING");
      setFollowedBackStatus("PENDING")
    }
  }

  return (
    <div
      onClick={() => router.push(`/users/${id}`)}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer"
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          width={40}
          height={40}
          className="rounded-full object-cover"
        />
      ) : (
        <User className="size-5" />
      )}
      <span className="font-medium flex-1">{name}</span>
      {status === "PENDING" && (
        <>
            <button onClick={handleAccept} className="text-sm px-3 py-1 rounded-full bg-green-500 text-white hover:bg-green-600">
                Accept
            </button>

            <button onClick={handleReject} className="text-sm px-3 py-1 rounded-full bg-red-500 text-white hover:bg-red-600">
                Reject
            </button>
        </>
      )}

      {status === "ACCEPTED" && (
        <>
          {status === "ACCEPTED" && (
            followedBack || followedBackStatus === "PENDING"
                 ? <span className="text-sm text-gray-400">{followedBack ? "Following" : "Requested"}</span>
                 : <button onClick={handleFollowBack} className="text-sm px-3 py-1 rounded-full bg-blue-500 text-white hover:bg-blue-600">
                  Follow Back
                 </button>
          )}
        </>
      )

      }
    </div>
  );
}
