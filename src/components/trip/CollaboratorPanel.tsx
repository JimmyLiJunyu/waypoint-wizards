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
    <div className="flex flex-col items-end px-6 py-2 bg-white border-b shrink-0">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Collaborators</span>

      <div className="flex items-center gap-2">
        {collaborators.map((c) => (
          <div key={c.id} className="relative group">
            {c.user.imageUrl ? (
              <Image src={c.user.imageUrl} alt={c.user.name} width={28} height={28} className="rounded-full object-cover cursor-default" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-500 cursor-default">
                {c.user.name[0].toUpperCase()}
              </div>
            )}
            {/* Tooltip */}
            <div className="absolute top-9 left-1/2 -translate-x-1/2 z-50 hidden group-hover:flex flex-col items-center">
              <div className="bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 whitespace-nowrap shadow-lg">
                <p className="font-medium">{c.user.name}</p>
                <p className="text-gray-400">{c.role}</p>
                {isOwner && c.role !== "OWNER" && (
                  <button onClick={() => remove(c.userId)} disabled={removing === c.userId} className="text-red-400 hover:text-red-300 mt-1 w-full text-left">
                    {removing === c.userId ? "Removing..." : "Remove"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {isOwner && (
          <div className="relative">
            <button onClick={openInvite} className="w-7 h-7 rounded-full bg-blue-500 text-white text-lg flex items-center justify-center hover:bg-blue-600">
              {showInvite ? "×" : "+"}
            </button>
            {showInvite && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-2xl shadow-2xl p-6 w-96 max-h-[70vh] flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">Invite a Friend</h3>
                    <button onClick={() => setShowInvite(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
                  </div>
                  {mutualFriends.length === 0 ? (
                    <p className="text-sm text-gray-400">No mutual friends to invite.</p>
                  ) : (
                    <div className="flex flex-col gap-2 overflow-y-auto">
                      {mutualFriends.map((f) => (
                        <div key={f.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                          {f.imageUrl ? (
                            <Image src={f.imageUrl} alt={f.name} width={36} height={36} className="rounded-full object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-500">
                              {f.name[0].toUpperCase()}
                            </div>
                          )}
                          <span className="flex-1 text-sm font-medium">{f.name}</span>
                          <button onClick={() => invite(f.id)} disabled={inviting === f.id} className="text-sm px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50">
                            {inviting === f.id ? "Inviting..." : "Invite"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
