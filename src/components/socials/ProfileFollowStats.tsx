"use client";

import { useState } from "react";
import FollowListModal from "./FollowListModal";

export default function ProfileFollowStats({
  userId,
  numFollowers,
  numFollowing,
}: {
  userId: string;
  numFollowers: number;
  numFollowing: number;
}) {
  const [modalMode, setModalMode] = useState<"followers" | "following" | null>(null);

  return (
    <>
      <div className="flex gap-6 mt-2 text-gray-500 text-sm">
        <button onClick={() => setModalMode("followers")} className="hover:underline">
          <strong className="text-black">{numFollowers}</strong> followers
        </button>
        <button onClick={() => setModalMode("following")} className="hover:underline">
          <strong className="text-black">{numFollowing}</strong> following
        </button>
      </div>

      {modalMode && (
        <FollowListModal userId={userId} mode={modalMode} onClose={() => setModalMode(null)} />
      )}
    </>
  );
}
