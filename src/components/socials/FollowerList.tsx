"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import FollowerCard from "./FollowerCard";

interface Followers {
  id: string;
  name: string;
  imageUrl: string;
  followBackStatus: "NONE" | "PENDING" | "ACCEPTED";
}

export default function FollowerList({ refreshToggle } : { refreshToggle: boolean}) {
  const { user, isLoading: isUserLoading } = useUser();
  const [followersData, setFollowersData] = useState<Followers[]>([]);
  const [error, setError] = useState("");
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (isUserLoading || !user) return;
    async function fetchFollowers() {
      try {
        if (!user) throw Error("Error rendering user data.");
        const response = await fetch(`/api/users/${user.id}/get-followers`);
        if (!response.ok) throw Error("Error fetching followers.");

        const followers = await response.json();
        setFollowersData(followers);
      } catch (error) {
        if (error instanceof Error) {
          console.log("Internal Server Error: ", error.message);
          setError(error.message);
        }
      } finally {
        setDataLoading(false);
      }
    }

    fetchFollowers();
  }, [user, user?.id, isUserLoading, refreshToggle]);

  return (
    <>
      {error && (
        <div className="bg-red-50 text-red-600 p-2 rounded text-sm border border-red-200">
          {error}
        </div>
      )}
      <div className="overflow-y-auto max-h-96 flex flex-col gap-1">
        {dataLoading ? (
          <h1>Loading...</h1>
        ) : (
          followersData.map((user) => (
            <FollowerCard
              key={user.id}
              id={user.id}
              name={user.name}
              imageUrl={user.imageUrl}
              followBackStatus={user.followBackStatus}
            />
          ))
        )}
      </div>
    </>
  );
}
