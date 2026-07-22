"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import FollowerCard from "./FollowerCard";

type Person = {
  id: string;
  name: string;
  imageUrl: string | null;
  followBackStatus: "NONE" | "PENDING" | "ACCEPTED";
};

export default function FollowListModal({
  userId,
  mode,
  onClose,
}: {
  userId: string;
  mode: "followers" | "following";
  onClose: () => void;
}) {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const endpoint = mode === "followers" ? "get-followers" : "get-following";
      const res = await fetch(`/api/users/${userId}/${endpoint}`);
      const data = await res.json();
      setPeople(data);
      setLoading(false);
    }
    load();
  }, [userId, mode]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const filtered = people.filter((p) =>
    p.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[70vh] flex flex-col p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="font-bold text-lg capitalize">{mode}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="size-5" />
          </button>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${mode}...`}
          className="border rounded-lg px-3 py-2 mb-3 text-sm shrink-0"
        />

        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1">
          {loading ? (
            <p className="text-sm text-gray-400 px-1">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 px-1">No {mode} found.</p>
          ) : (
            filtered.map((p) => (
              <FollowerCard
                key={p.id}
                id={p.id}
                name={p.name}
                imageUrl={p.imageUrl}
                followBackStatus={p.followBackStatus}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
