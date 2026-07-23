"use client";

import { useState } from "react";

type FollowStatus = "NONE" | "PENDING" | "ACCEPTED";

export default function FollowStatusButton({
  status,
  name,
  onFollow,
  onUnfollow,
  noneLabel = "Follow",
}: {
  status: FollowStatus;
  name: string;
  onFollow: () => void;
  onUnfollow: () => void;
  noneLabel?: string;
}) {
  const [confirming, setConfirming] = useState(false);

  if (status === "NONE") {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onFollow();
        }}
        className="text-sm px-3 py-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
      >
        {noneLabel}
      </button>
    );
  }

  if (status === "PENDING") {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onUnfollow();
        }}
        title="Cancel follow request"
        className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
      >
        Requested
      </button>
    );
  }

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setConfirming(true);
        }}
        className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
      >
        Following
      </button>

      {confirming && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
          onClick={(e) => {
            e.stopPropagation();
            setConfirming(false);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-80"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg mb-2">Unfollow {name}?</h3>
            <p className="text-sm text-gray-500 mb-5">
              You&apos;ll stop seeing {name}&apos;s posts in your feed.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirming(false);
                }}
                className="px-4 py-2 text-sm font-semibold rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirming(false);
                  onUnfollow();
                }}
                className="px-4 py-2 text-sm font-semibold rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Unfollow
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
