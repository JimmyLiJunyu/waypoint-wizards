"use client";

import { useState, useEffect } from "react";
import FollowRequestCard from "./FollowRequestCard";

interface FollowerRequest {
  id: string;
  name: string;
  imageUrl: string;
}

export default function RequestList() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<FollowerRequest[]>([]);
  const [error, setError] = useState("");
  const [numReq, setNumReq] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function handleRequests() {
      try {
        const response = await fetch("/api/users/get-follow-requests");
        if (!response.ok) throw Error("Error getting follow requests!");

        const followRequests = await response.json();
        setData(followRequests);
        setNumReq(followRequests.length);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Error: Check console");
        }
        console.log(`Error: ${error}`);
      } finally {
        setLoading(false);
      }
    }

    handleRequests();
  }, [isOpen]);

  return (
    <>
      <div className="relative inline-block">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 font-medium"
        >
          Requests
        </button>
        {numReq > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full 2-5 h-5 flex items-center justify-center">
            {numReq}
          </span>
        )}
      </div>

      {isOpen && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl z-50 p-6 animate-in fade-in slide-in-from-top-8 duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Follow Requests</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              X
            </button>
          </div>

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <div className="overflow-y-auto max-h-96 flex flex-col gap-1">
            {loading ? (
              <h1>Loading...</h1>
            ) : (
              data.map((req) => (
                <FollowRequestCard
                  key={req.id}
                  id={req.id}
                  name={req.name}
                  imageUrl={req.imageUrl}
                  followStatus={"PENDING"}
                  onReject={(id: string) =>
                    setData((prev) => prev.filter((r) => r.id !== id))
                  }
                />
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
