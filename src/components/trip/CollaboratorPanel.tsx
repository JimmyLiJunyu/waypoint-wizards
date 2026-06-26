"use client";

import { useState } from "react";
import Image from "next/image";

type CollaboratorUser = {
  id: string;
  name: string;
  imageUrl: string | null;
};

type CollaboratorRecord = {
  id: number;
  role: string;
  userId: string;
  user: CollaboratorUser;
};

type MutualFriend = {
  id: string;
  name: string;
  imageUrl: string | null;
};

export default function CollaboratorPanel({
  itineraryId,
  currentUserId,
  currentUserRole,
  initialCollaborators,
}: {
  itineraryId: string;
  currentUserId: string;
  currentUserRole: string;
  initialCollaborators: CollaboratorRecord[];
}) {
  const [collaborators, setCollaborators] = useState(initialCollaborators);
  const [mutualFriends, setMutualFriends] = useState<MutualFriend[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const isOwner = currentUserRole === "OWNER";

  async function openInvite() {
    if (showInvite) {
      setShowInvite(false);
      return;
    }
    const res = await fetch(
      `/api/users/${currentUserId}/mutual-friends?itineraryId=${itineraryId}`
    );
    if (res.ok) setMutualFriends(await res.json());
    setShowInvite(true);
  }

  async function invite(inviteeId: string) {
    setInviting(inviteeId);
    const res = await fetch(`/api/itinerary/${itineraryId}/collaborators`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteeId }),
    });
    if (res.ok) {
      const added = mutualFriends.find((f) => f.id === inviteeId)!;
      setCollaborators((prev) => [
        ...prev,
        { id: Date.now(), role: "EDITOR", userId: inviteeId, user: added },
      ]);
      setMutualFriends((prev) => prev.filter((f) => f.id !== inviteeId));
    }
    setInviting(null);
  }

  async function remove(targetUserId: string) {
    setRemoving(targetUserId);
    const res = await fetch(`/api/itinerary/${itineraryId}/collaborators`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId }),
    });
    if (res.ok) {
      setCollaborators((prev) => prev.filter((c) => c.userId !== targetUserId));
    }
    setRemoving(null);
  }

  return (
    <div className="border rounded-xl bg-white p-4 mb-3">
      <h3 className="font-bold text-lg mb-3">Collaborators</h3>

      <div className="flex flex-col gap-2">
        {collaborators.map((c) => (
          <div key={c.id} className="flex items-center gap-2">
            {c.user.imageUrl ? (
              <Image
                src={c.user.imageUrl}
                alt={c.user.name}
                width={28}
                height={28}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                {c.user.name[0].toUpperCase()}
              </div>
            )}
            <span className="flex-1 text-sm font-medium">{c.user.name}</span>
            <span className="text-xs text-gray-400">{c.role}</span>
            {isOwner && c.role !== "OWNER" && (
              <button
                onClick={() => remove(c.userId)}
                disabled={removing === c.userId}
                className="text-xs text-red-500 hover:text-red-700 ml-2"
              >
                {removing === c.userId ? "..." : "Remove"}
              </button>
            )}
          </div>
        ))}
      </div>

      {isOwner && (
        <div className="mt-3">
          <button
            onClick={openInvite}
            className="text-sm text-blue-500 hover:text-blue-700"
          >
            {showInvite ? "Cancel" : "+ Invite friend"}
          </button>

          {showInvite && mutualFriends.length === 0 && (
            <p className="text-xs text-gray-400 mt-2">No mutual friends to invite.</p>
          )}

          {showInvite &&
            mutualFriends.map((f) => (
              <div key={f.id} className="flex items-center gap-2 mt-2">
                {f.imageUrl ? (
                  <Image
                    src={f.imageUrl}
                    alt={f.name}
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                    {f.name[0].toUpperCase()}
                  </div>
                )}
                <span className="flex-1 text-sm">{f.name}</span>
                <button
                  onClick={() => invite(f.id)}
                  disabled={inviting === f.id}
                  className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {inviting === f.id ? "..." : "Invite"}
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
