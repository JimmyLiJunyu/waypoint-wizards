"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Trash2, Upload, Share2, Camera } from "lucide-react";

type TripPhoto = {
  id: string;
  url: string;
  uploadedBy: string;
};

type Photo = {
  id: string;
  url: string;
};

type Post = {
  id: string;
  published: boolean;
  photo: Photo[];
};

function TripPhotos({
  itineraryId,
  currentUserId,
}: {
  itineraryId: string;
  currentUserId: string;
}) {
  const [groupPhotos, setGroupPhotos] = useState<TripPhoto[]>([]);
  const [post, setPost] = useState<Post | null>(null);
  const [uploadingGroup, setUploadingGroup] = useState(false);
  const [uploadingMine, setUploadingMine] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const loadGroupPhotos = async () => {
    const res = await fetch(`/api/itinerary/${itineraryId}/trip-photos`);
    const data = await res.json();
    setGroupPhotos(data.photos ?? []);
  };

  const loadMyPost = async () => {
    const res = await fetch(`/api/itinerary/${itineraryId}/posts`);
    const data = await res.json();
    setPost(data.post ?? null);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadGroupPhotos();
    loadMyPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itineraryId]);

  // Creates a draft (unpublished) post on first use, so a photo has something to attach to.
  // Never touches `published` — publishing only happens via handleTogglePublish.
  const ensurePost = async (): Promise<Post | null> => {
    if (post) return post;
    const res = await fetch(`/api/itinerary/${itineraryId}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    setPost(data.post ?? null);
    return data.post ?? null;
  };

  const handleTogglePublish = async () => {
    setPublishing(true);
    try {
      const res = await fetch(`/api/itinerary/${itineraryId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !post?.published }),
      });
      const data = await res.json();
      setPost(data.post ?? null);
    } finally {
      setPublishing(false);
    }
  };

  const handleUploadGroup = async (file: File) => {
    setUploadingGroup(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await fetch(`/api/itinerary/${itineraryId}/trip-photos`, {
        method: "POST",
        body: formData,
      });
      await loadGroupPhotos();
    } finally {
      setUploadingGroup(false);
    }
  };

  const handleDeleteGroup = async (photoId: string) => {
    await fetch(`/api/itinerary/${itineraryId}/trip-photos/${photoId}`, {
      method: "DELETE",
    });
    await loadGroupPhotos();
  };

  const handleUploadMine = async (file: File) => {
    setUploadingMine(true);
    try {
      const currentPost = await ensurePost();
      if (!currentPost) return;
      const formData = new FormData();
      formData.append("file", file);
      await fetch(`/api/posts/${currentPost.id}/photos`, {
        method: "POST",
        body: formData,
      });
      await loadMyPost();
    } finally {
      setUploadingMine(false);
    }
  };

  const handleDeleteMine = async (photoId: string) => {
    if (!post) return;
    await fetch(`/api/posts/${post.id}/photos/${photoId}`, {
      method: "DELETE",
    });
    await loadMyPost();
  };

  return (
    <div className="mt-4 flex flex-col gap-6 overflow-y-auto flex-1">
      <button
        onClick={handleTogglePublish}
        disabled={publishing}
        className={`flex items-center justify-center gap-2 py-2 rounded-full text-sm font-semibold transition-colors disabled:opacity-50 ${
          post?.published
            ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
            : "bg-red-500 text-white hover:bg-red-600"
        }`}
      >
        <Share2 className="size-4" />
        {publishing
          ? "Updating..."
          : post?.published
          ? "Posted to Socials — Tap to Remove"
          : "Post Trip to Socials"}
      </button>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-sm">Group Photos</h2>
          <div className="flex items-center gap-3">
            <label className="md:hidden cursor-pointer text-xs font-semibold text-red-500 hover:text-red-600 flex items-center gap-1">
              <Camera className="size-3.5" />
              {uploadingGroup ? "Uploading..." : "Camera"}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                disabled={uploadingGroup}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadGroup(file);
                  e.target.value = "";
                }}
              />
            </label>
            <label className="cursor-pointer text-xs font-semibold text-red-500 hover:text-red-600 flex items-center gap-1">
              <Upload className="size-3.5" />
              {uploadingGroup ? "Uploading..." : "Add"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingGroup}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadGroup(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {groupPhotos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square rounded-lg overflow-hidden group"
            >
              <Image src={photo.url} alt="Group photo" fill className="object-cover" />
              {photo.uploadedBy === currentUserId && (
                <button
                  onClick={() => handleDeleteGroup(photo.id)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="size-3" />
                </button>
              )}
            </div>
          ))}
          {groupPhotos.length === 0 && (
            <p className="col-span-3 text-xs text-gray-400">No group photos yet.</p>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-sm">My Photos</h2>
          <div className="flex items-center gap-3">
            <label className="md:hidden cursor-pointer text-xs font-semibold text-red-500 hover:text-red-600 flex items-center gap-1">
              <Camera className="size-3.5" />
              {uploadingMine ? "Uploading..." : "Camera"}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                disabled={uploadingMine}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadMine(file);
                  e.target.value = "";
                }}
              />
            </label>
            <label className="cursor-pointer text-xs font-semibold text-red-500 hover:text-red-600 flex items-center gap-1">
              <Upload className="size-3.5" />
              {uploadingMine ? "Uploading..." : "Add"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingMine}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadMine(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(post?.photo ?? []).map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square rounded-lg overflow-hidden group"
            >
              <Image src={photo.url} alt="My photo" fill className="object-cover" />
              <button
                onClick={() => handleDeleteMine(photo.id)}
                className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
          {(post?.photo ?? []).length === 0 && (
            <p className="col-span-3 text-xs text-gray-400">No photos yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default TripPhotos;
