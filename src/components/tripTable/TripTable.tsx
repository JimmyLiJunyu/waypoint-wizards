"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@/context/UserContext";
import Link from "next/link";

interface Trip {
  id: string;
  title: string;
  location: string;
  createdAt: string;
  startDate: string;
  endDate: string;
}

export default function TripTable() {
  const { user, isLoading: isUserLoading } = useUser();
  const [error, setError] = useState("");
  const [tripLoading, setTripLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isUserLoading || !user) return;

    async function fetchTrips() {
      try {
        if (!user) throw Error("Error rendering user data.");
        const res = await fetch(`/api/get-user-trips/${user.id}`);
        if (!res.ok) throw new Error(`Failed to fetch trips: ${res.statusText}`);
        const tripData = await res.json();
        setTrips(tripData.userTrips);
      } catch (error) {
        if (error instanceof Error) {
          console.log("Internal Server error: ", error.message);
          setError(error.message);
        }
      } finally {
        setTripLoading(false);
      }
    }

    fetchTrips();
  }, [user, user?.id, isUserLoading]);

  // focus the input when editing starts
  useEffect(() => {
    if (editingId) inputRef.current?.focus();
  }, [editingId]);

  function startEditing(trip: Trip, e: React.MouseEvent) {
    e.preventDefault(); // prevent link navigation
    e.stopPropagation();
    setEditingId(trip.id);
    setEditingTitle(trip.title);
  }

  async function commitRename(tripId: string) {
    const trimmed = editingTitle.trim();
    if (!trimmed) {
      cancelEditing();
      return;
    }

    setTrips((prev) =>
      prev.map((t) => (t.id === tripId ? { ...t, title: trimmed } : t))
    );
    setEditingId(null);

    try {
      const res = await fetch(`/api/itinerary/${tripId}/rename`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      if (!res.ok) throw new Error("Rename failed");
    } catch {
      // Revert on failure
      setTrips((prev) =>
        prev.map((t) =>
          t.id === tripId
            ? { ...t, title: trips.find((x) => x.id === tripId)?.title ?? t.title }
            : t
        )
      );
      setError("Failed to rename trip. Please try again.");
    }
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingTitle("");
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-2 rounded text-sm border border-red-200">
          {error}
        </div>
      )}
      {tripLoading ? (
        <p className="text-gray-500 mt-2 text-lg">Loading...</p>
      ) : (
        trips?.map((trip) => (
          <div key={trip.id} className="relative group">
            <Link
              href={`/trip/${trip.id}?destination=${trip.location}&startDate=${trip.startDate}&endDate=${trip.endDate}`}
            >
              <div className="bg-white border rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer">
                {/* title row */}
                <div className="flex items-center gap-2 pr-1">
                  {editingId === trip.id ? (
                    <input
                      ref={inputRef}
                      className="text-xl font-bold border-b-2 border-red-400 outline-none flex-1 bg-transparent"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onClick={(e) => e.preventDefault()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename(trip.id);
                        if (e.key === "Escape") cancelEditing();
                      }}
                      onBlur={() => commitRename(trip.id)}
                    />
                  ) : (
                    <>
                      <h2 className="text-xl font-bold flex-1 truncate">{trip.title}</h2>
                      <button
                        onClick={(e) => startEditing(trip, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 shrink-0"
                        title="Rename trip"
                        aria-label="Rename trip"
                      >
                        {/* Pencil icon */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-gray-400 hover:text-gray-600"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
                <h3 className="text-gray-500 mt-2 text-sm">{trip.location}</h3>
                <p className="text-gray-500 mt-2 text-sm">
                  Created {new Date(trip.createdAt).toDateString()}
                </p>
              </div>
            </Link>
          </div>
        ))
      )}
    </div>
  );
}