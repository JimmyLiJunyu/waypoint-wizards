"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { User } from "lucide-react";
import Image from "next/image";
import { useFollowStatus } from "@/hooks/useFollowStatus";
import FollowStatusButton from "./FollowStatusButton";

interface FollowerCardProps {
  id: string,
  name: string,
  imageUrl: string | null,
  followStatus: string,
  onReject: (id: string) => void,
  onAccept: () => void
}

export default function FollowRequestCard({ id, name, imageUrl, followStatus, onReject, onAccept }: FollowerCardProps) {
  const router = useRouter();
  const [status, setStatus] = useState(followStatus);
  const [followedBack, setFollowedBack] = useState(false);
  const { status: followBackStatus, follow: followBack, unfollow: unfollowBack } = useFollowStatus(id, "NONE");
  const effectiveFollowBackStatus = followedBack ? "ACCEPTED" : followBackStatus;

  async function handleUnfollowBack() {
    await unfollowBack();
    setFollowedBack(false);
  }

  async function handleAccept(e: React.MouseEvent) {
    e.stopPropagation();
    const response = await fetch(`/api/users/${id}/follow-request`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ACCEPT" })
    });
    if (response.ok) {
      const check = await fetch(`/api/users/${id}/is-following`);
      const { isFollowing } = await check.json();
      setFollowedBack(isFollowing);
      setStatus("ACCEPTED");
      onAccept();
    }
  }

  async function handleReject(e: React.MouseEvent) {
    e.stopPropagation();
    const response = await fetch(`/api/users/${id}/follow-request`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "REJECT" })
    });
    if (response.ok) onReject(id);
  }

  return (
    <div
      onClick={() => router.push(`/users/${id}`)}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer"
    >
      {imageUrl ? (
        <Image src={imageUrl} alt={name} width={40} height={40} className="rounded-full object-cover" />
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
        <FollowStatusButton
          status={effectiveFollowBackStatus}
          name={name}
          onFollow={followBack}
          onUnfollow={handleUnfollowBack}
          noneLabel="Follow Back"
        />
      )}
    </div>
  );
}
