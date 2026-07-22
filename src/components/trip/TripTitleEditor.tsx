"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";

export default function TripTitleEditor({
  itineraryId,
  initialTitle,
}: {
  itineraryId: string;
  initialTitle: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(initialTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  function startEditing() {
    setDraft(title);
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setDraft(title);
  }

  async function commitRename() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === title) {
      cancelEditing();
      return;
    }

    const previousTitle = title;
    setTitle(trimmed);
    setIsEditing(false);

    try {
      const res = await fetch(`/api/itinerary/${itineraryId}/rename`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      if (!res.ok) throw new Error("Rename failed");
    } catch {
      setTitle(previousTitle);
    }
  }

  return (
    <div className="flex items-center h-[38px] bg-white border rounded-full px-4 shadow-md">
      {isEditing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") cancelEditing();
          }}
          className="text-sm font-semibold outline-none bg-transparent w-48"
        />
      ) : (
        <button
          onClick={startEditing}
          className="flex items-center gap-2 text-sm font-semibold text-gray-800 group"
          title="Rename trip"
        >
          <span className="truncate max-w-48">{title}</span>
          <Pencil className="size-3.5 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
        </button>
      )}
    </div>
  );
}
