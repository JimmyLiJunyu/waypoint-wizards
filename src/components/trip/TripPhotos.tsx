"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Trash2, Upload } from "lucide-react";

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

  const loadGroupPhotos = async () => {
    const res = await fetch(`/api/itinerary/${itineraryId}/trip-photos`);
    const data = await res.json();
    setGroupPhotos(data.photos ?? []);
  };

  const loadMyPost = async () => {
    const upsertRes = await fetch(`/api/itinerary/${itineraryId}/posts`, {
      method: "POST",
    });
    const data = await upsertRes.json();
    setPost(data.post ?? null);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadGroupPhotos();
    loadMyPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itineraryId]);

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
    if (!post) return;
    setUploadingMine(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await fetch(`/api/posts/${post.id}/photos`, {
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
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-sm">Group Photos</h2>
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
          <label className="cursor-pointer text-xs font-semibold text-red-500 hover:text-red-600 flex items-center gap-1">
            <Upload className="size-3.5" />
            {uploadingMine ? "Uploading..." : "Add"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingMine || !post}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadMine(file);
                e.target.value = "";
              }}
            />
          </label>
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
