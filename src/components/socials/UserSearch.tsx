"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import FollowerSearchCard from './FollowerSearchCard'

interface User {
    id: string,
    name: string,
    imageUrl: string
    followStatus: string
}

export default function UserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!query.trim()) return;
    const timer = setTimeout(async () => {
      const response = await fetch("/api/users/search-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      setResults(data);
      setShowPopup(true);
      return () => clearTimeout(timer);
    });
  }, [query]);

  function clearQuery() {
    setQuery("");
    setResults([]);
    setShowPopup(false);
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              if (!val.trim()) {
                setResults([]);
                setShowPopup(false);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                clearQuery();
                inputRef.current?.blur();
              }
            }}
            placeholder="Search users..."
            className="border rounded px-3 py-2 w-full pr-8"
          />
          {query && (
            <button
              onClick={clearQuery}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <button className="bg-blue-500 text-white px-4 py-2 rounded">
          Search
        </button>
      </div>

      {showPopup && results.length > 0 && (
        <div className="absolute top-full left-0 w-full bg-white border rounded shadow-lg z-10 mt-1 overflow-y-auto max-h-60">
          {results.map((user) => (
            <FollowerSearchCard
                key={user.id}
                id={user.id}
                name={user.name}
                imageUrl={user.imageUrl}
                followStatus={user.followStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
