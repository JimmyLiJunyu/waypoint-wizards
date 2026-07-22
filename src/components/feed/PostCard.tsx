"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, User } from "lucide-react";

type PostPhoto = { id: string; url: string };
type CollaboratorEntry = { user: { id: string; name: string; imageUrl: string | null } };

export type PostCardData = {
  id: string;
  description: string | null;
  createdAt: string | Date;
  owner: { id: string; name: string; imageUrl: string | null };
  photo: PostPhoto[];
  itinerary: {
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
}: {
  post: PostCardData;
  currentUserId: string;
}) {
  const [liked, setLiked] = useState(post.postLike.some((l) => l.userId === currentUserId));
  const [likeCount, setLikeCount] = useState(post.postLike.length);
  const [pending, setPending] = useState(false);

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

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
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

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-1 mt-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden">
              <Image src={photo.url} alt="Trip photo" fill className="object-cover" />
            </div>
          ))}
        </div>
      )}

      {post.description && <p className="mt-3 text-sm text-gray-700">{post.description}</p>}

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
