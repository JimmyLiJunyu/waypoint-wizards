"use client";

import { useState, useEffect } from "react";

interface User {
    id: string,
    name: string,
    imageUrl: string
}

export default function UserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [showPopup, setShowPopup] = useState(false);

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

  return (
    <div className="relative">
      <div className="flex gap-2">
        <input
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
          placeholder="Search users..."
          className="border rounded px-3 py-2 w-full"
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded">
          Search
        </button>
      </div>

      {showPopup && results.length > 0 && (
        <div className="absolute top-full left-0 w-full bg-white border rounded shadow-lg z-10 mt-1">
          {results.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer"
            >
              {user.imageUrl && (
                `<img src={user.imageUrl} className="w-8 h-8 rounded-full" />`
              )}
              <span>{user.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
