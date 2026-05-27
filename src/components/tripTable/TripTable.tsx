"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (isUserLoading || !user) return;

    async function fetchUser() {
      try {
        if (!user) throw Error("Error rendering user data.");
        const res = await fetch(`/api/get-user-trips/${user.id}`);

        if (!res.ok) {
          throw new Error(`Failed to fetch trips: ${res.statusText}`);
        }
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

    fetchUser();
  }, [user, user?.id, isUserLoading]);

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
          <Link
            href={`/trip/${trip.id}?destination=${trip.location}&startDate=${trip.startDate}&endDate=${trip.endDate}`}
            key={trip.id}
          >
            <div className="bg-white border rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer">
              <h2 className="text-xl font-bold">{trip.title}</h2>
              <h3 className="text-gray-500 mt-2 text-sm">{trip.location}</h3>
              <p className="text-gray-500 mt-2 text-sm">
                Created {new Date(trip.createdAt).toDateString()}
              </p>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
