"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import FollowRequestCard from "./FollowRequestCard";

interface FollowerRequest {
  id: string;
  name: string;
  imageUrl: string;
}

export default function RequestList({onAccept} : {onAccept: () => void}) {
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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 font-medium transition-colors"
      >
        <Bell className="size-4" />
        Requests
        {numReq > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold shadow">
            {numReq > 9 ? "9+" : numReq}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 animate-in fade-in slide-in-from-top-8 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Follow Requests</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="size-5" />
              </button>
            </div>

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <div className="overflow-y-auto max-h-96 flex flex-col gap-1">
              {loading ? (
                <p className="text-sm text-gray-400">Loading...</p>
              ) : data.length === 0 ? (
                <p className="text-sm text-gray-400">No pending requests.</p>
              ) : (
                data.map((req) => (
                  <FollowRequestCard
                    key={req.id}
                    id={req.id}
                    name={req.name}
                    imageUrl={req.imageUrl}
                    followStatus={"PENDING"}
                    onReject={(id: string) => setData(prev => prev.filter(r => r.id !== id))}
                    onAccept={onAccept}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
