"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, User, ImageOff, Pencil, EyeOff, Check, X } from "lucide-react";
import PostPhotoCarousel from "./PostPhotoCarousel";

type PostPhoto = { id: string; url: string };
type CollaboratorEntry = { user: { id: string; name: string; imageUrl: string | null } };

export type PostCardData = {
  id: string;
  description: string | null;
  createdAt: string | Date;
  owner: { id: string; name: string; imageUrl: string | null };
  photo: PostPhoto[];
  itinerary: {
    id: string;
    title: string;
    location: string;
    startDate: string | Date;
    endDate: string | Date;
    tripPhotos: PostPhoto[];
    collaborators?: CollaboratorEntry[];
  };
  postLike: { userId: string }[];
};

function PostCard({
  post,
  currentUserId,
  canManage = false,
}: {
  post: PostCardData;
  currentUserId: string;
  canManage?: boolean;
}) {
  const [liked, setLiked] = useState(post.postLike.some((l) => l.userId === currentUserId));
  const [likeCount, setLikeCount] = useState(post.postLike.length);
  const [pending, setPending] = useState(false);

  const [description, setDescription] = useState(post.description);
  const [isEditing, setIsEditing] = useState(false);
  const [draftDescription, setDraftDescription] = useState(post.description ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isTakingDown, setIsTakingDown] = useState(false);
  const [takenDown, setTakenDown] = useState(false);

  const photos = [...post.photo, ...post.itinerary.tripPhotos];
  const wentWith = (post.itinerary.collaborators ?? []).filter(
    (c) => c.user.id !== post.owner.id
  );

  const toggleLike = async () => {
    if (pending) return;
    setPending(true);
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((c) => c + (nextLiked ? 1 : -1));
    try {
      await fetch(`/api/posts/${post.id}/like`, {
        method: nextLiked ? "POST" : "DELETE",
      });
    } finally {
      setPending(false);
    }
  };

  const saveDescription = async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/itinerary/${post.itinerary.id}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: draftDescription }),
      });
      setDescription(draftDescription);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const takeDown = async () => {
    setIsTakingDown(true);
    try {
      await fetch(`/api/itinerary/${post.itinerary.id}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: false }),
      });
      setTakenDown(true);
    } finally {
      setIsTakingDown(false);
    }
  };

  if (takenDown) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative size-10 shrink-0 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {post.owner.imageUrl ? (
              <Image src={post.owner.imageUrl} alt={post.owner.name} fill className="object-cover" />
            ) : (
              <User className="size-5 text-gray-500" />
            )}
          </div>
          <div>
            <p className="font-semibold">{post.owner.name}</p>
            <p className="text-xs text-gray-500">
              {post.itinerary.title} · {post.itinerary.location}
            </p>
          </div>
        </div>

        {canManage && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setDraftDescription(description ?? "");
                setIsEditing(true);
              }}
              title="Edit caption"
              className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <Pencil className="size-4" />
            </button>
            <button
              onClick={takeDown}
              disabled={isTakingDown}
              title="Take down post"
              className="p-1.5 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
            >
              <EyeOff className="size-4" />
            </button>
          </div>
        )}
      </div>

      {wentWith.length > 0 && (
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
          <span>Went with</span>
          <div className="flex -space-x-2">
            {wentWith.map((c) => (
              <div
                key={c.user.id}
                title={c.user.name}
                className="relative size-6 rounded-full overflow-hidden border-2 border-white bg-gray-200 flex items-center justify-center"
              >
                {c.user.imageUrl ? (
                  <Image src={c.user.imageUrl} alt={c.user.name} fill className="object-cover" />
                ) : (
                  <User className="size-3 text-gray-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {photos.length > 0 ? (
        <PostPhotoCarousel photos={photos} />
      ) : (
        <div className="mt-4 flex flex-col items-center justify-center gap-1.5 py-8 rounded-lg bg-gray-50 text-gray-400">
          <ImageOff className="size-6" />
          <span className="text-xs">No photos</span>
        </div>
      )}

      {isEditing ? (
        <div className="mt-3 flex flex-col gap-2">
          <textarea
            value={draftDescription}
            onChange={(e) => setDraftDescription(e.target.value)}
            placeholder="Add a caption..."
            className="w-full border rounded-lg p-2 text-sm resize-none"
            rows={3}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={saveDescription}
              disabled={isSaving}
              className="flex items-center gap-1 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-full px-3 py-1.5 transition-colors disabled:opacity-50"
            >
              <Check className="size-3.5" />
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-full px-3 py-1.5 transition-colors"
            >
              <X className="size-3.5" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        description && <p className="mt-3 text-sm text-gray-700">{description}</p>
      )}

      <button
        onClick={toggleLike}
        className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-red-500 transition-colors"
      >
        <Heart className={`size-4 ${liked ? "fill-red-500 text-red-500" : ""}`} />
        {likeCount}
      </button>
    </div>
  );
}

export default PostCard;
