"use client";

import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import Image from "next/image";
import { useUser } from "@/context/UserContext";
import { useFollowStatus } from "@/hooks/useFollowStatus";
import FollowStatusButton from "./FollowStatusButton";

interface FollowerCardProps {
  id: string;
  name: string;
  imageUrl: string | null;
  followStatus: string;
}

export default function FollowerSearchCard({ id, name, imageUrl, followStatus }: FollowerCardProps) {
  const router = useRouter();
  const { user } = useUser();
  const { status, follow, unfollow } = useFollowStatus(id, followStatus);

  const isOwnAccount = user?.id === id;

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
        <FollowStatusButton status={status} name={name} onFollow={follow} onUnfollow={unfollow} />
      )}
    </div>
  );
}
