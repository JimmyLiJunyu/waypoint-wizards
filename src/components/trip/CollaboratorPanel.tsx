"use client";

import { useState, useRef, useEffect } from "react";
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

function Avatar({ user, size = 28 }: { user: CollaboratorUser; size?: number }) {
  return user.imageUrl ? (
    <Image
      src={user.imageUrl}
      alt={user.name}
      width={size}
      height={size}
      className="rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600"
      style={{ width: size, height: size }}
    >
      {user.name[0].toUpperCase()}
    </div>
  );
}

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
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const isOwner = currentUserRole === "OWNER";

  // close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function openInvite() {
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
    <>
      <div
        ref={panelRef}
        className="fixed top-3 left-16 z-40"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Dropdown — shown when hovered or clicked open */}
        {(open || hovered) && (
          <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border p-4">
            <h3 className="font-bold text-sm text-gray-700 mb-3">Collaborators</h3>
            <div className="flex flex-col gap-1 mb-3">
              {collaborators.map((c) => (
                <div key={c.id} className="flex items-center gap-2.5 py-2 border-b last:border-0">
                  <Avatar user={c.user} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.user.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{c.role.toLowerCase()}</p>
                  </div>
                  {isOwner && c.role !== "OWNER" && (
                    <button
                      onClick={() => remove(c.userId)}
                      disabled={removing === c.userId}
                      className="text-xs text-red-400 hover:text-red-600 font-medium disabled:opacity-50"
                    >
                      {removing === c.userId ? "..." : "Remove"}
                    </button>
                  )}
                </div>
              ))}
            </div>
            {isOwner && (
              <button
                onClick={openInvite}
                className="w-full py-2 text-sm font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                + Invite Friend
              </button>
            )}
          </div>
        )}

        {/* Avatar stack trigger — click to toggle */}
        <div
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-1 h-[38px] bg-white border rounded-full px-3 shadow-md cursor-pointer select-none hover:shadow-lg transition-shadow"
        >
          {collaborators.map((c) => (
            <Avatar key={c.id} user={c.user} size={22} />
          ))}
          <span className="text-xs text-gray-500 font-medium ml-1">
            {collaborators.length} {collaborators.length === 1 ? "member" : "members"}
          </span>
        </div>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-96 max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Invite a Friend</h3>
              <button
                onClick={() => setShowInvite(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>
            {mutualFriends.length === 0 ? (
              <p className="text-sm text-gray-400">No mutual friends to invite.</p>
            ) : (
              <div className="flex flex-col gap-2 overflow-y-auto">
                {mutualFriends.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <Avatar user={f} size={36} />
                    <span className="flex-1 text-sm font-medium">{f.name}</span>
                    <button
                      onClick={() => invite(f.id)}
                      disabled={inviting === f.id}
                      className="text-sm px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                    >
                      {inviting === f.id ? "Inviting..." : "Invite"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
