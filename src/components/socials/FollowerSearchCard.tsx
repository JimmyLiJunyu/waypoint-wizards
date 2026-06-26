"use client";

import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import Image from "next/image";
import { useUser } from "@/context/UserContext";
import { useFollowStatus } from "@/hooks/useFollowStatus";

interface FollowerCardProps {
  id: string;
  name: string;
  imageUrl: string | null;
  followStatus: string;
}

export default function FollowerSearchCard({ id, name, imageUrl, followStatus }: FollowerCardProps) {
  const router = useRouter();
  const { user } = useUser();
  const { status, follow } = useFollowStatus(id, followStatus);

  const isOwnAccount = user?.id === id;

  const buttonLabel = status === "ACCEPTED" ? "Following" : status === "PENDING" ? "Requested" : "Follow";
  const buttonStyle = status === "NONE"
    ? "bg-blue-500 text-white hover:bg-blue-600"
    : "bg-gray-200 text-gray-500 cursor-not-allowed";

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
      {!isOwnAccount && (
        <button
          onClick={(e) => { e.stopPropagation(); follow(); }}
          disabled={status !== "NONE"}
          className={`text-sm px-3 py-1 rounded-full ${buttonStyle}`}
        >
          {buttonLabel}
        </button>
      )}
    </div>
  );
}
