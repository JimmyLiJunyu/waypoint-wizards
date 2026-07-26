"use client";

import { updateProfile } from "./action";
import { useUser } from "@/context/UserContext";
import { useState } from "react";
import Image from "next/image";
import {
  User,
  Mail,
  UserCircle,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";

function AccountPage() {
  const { user, setUser, isLoading: isUserLoading } = useUser();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [image, setImage] = useState(user?.imageUrl || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  if (isUserLoading) return <p>Loading profile...</p>;
  if (!user) return <p>Server error.</p>;

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setImagePreview(URL.createObjectURL(file))

    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch("/api/upload-avatar", {
      method: "POST",
      body: formData,
    })

    if (!res.ok) { setError("Image upload failed"); setImagePreview(null); return }

    const { publicUrl } = await res.json()
    setImage(publicUrl)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError("");
    setSuccess("");

    try {
      const data = {
        name: name,
        email: email,
        imageUrl: image,
      };
      const result = await updateProfile(user.id, data);

      if (!result.success) {
        console.log(result.error || "Error updating profile");
        setError(result.error as string);
      } else {
        setUser(result.user);
        const updatedUser = result.user;
        if (updatedUser) {
          setName(updatedUser.name as string);
          setEmail(updatedUser.email);
          setImage(updatedUser.imageUrl as string);
          setSuccess("Update Success!");
        }
      }
    } catch (error) {
      console.error(error);
      if (error instanceof Error) setError(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <main className="h-full overflow-y-auto bg-gray-50 flex items-start justify-center pt-12 px-4 font-sans text-slate-900">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="bg-gray-900 p-8 flex flex-col items-center border-b border-gray-700">
          <div className="relative size-24 rounded-full overflow-hidden bg-white border-4 border-gray-700 shadow-md mb-4">
            {user?.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt="Avatar"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-100">
                <User className="size-15 text-slate-400" />
              </div>
            )}
          </div>
          <h1 className="text-xl font-bold text-white">Account Details</h1>
          <p className="text-gray-400 text-sm">
            Update your personal information
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-2 rounded text-sm border border-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-600 p-2 rounded text-sm border border-green-200">
              {success}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1 flex items-center gap-2">
              <UserCircle className="size-3" /> Full Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              name="name"
              placeholder={user.name || "Your Name"}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-400 focus:ring-4 focus:ring-red-400/10 transition-all outline-none bg-slate-50/50 focus:bg-white text-slate-800"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1 flex items-center gap-2">
              <Mail className="size-3" /> Email Address
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              name="email"
              required
              placeholder={user.email || "Email"}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-400 focus:ring-4 focus:ring-red-400/10 transition-all outline-none bg-slate-50/50 focus:bg-white text-slate-800"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1 flex items-center gap-2">
              <ImageIcon className="size=3"/> Profile Picture
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:bg-slate-900 file:text-white hover:file:bg-slate-700 cursor-pointer"/>
              {imagePreview && (
                <div className="flex items-center gap-3 mt-2">
                  <img src={imagePreview} alt="Preview" className="size-12 rounded-full object-cover border-2 border-red-400" />
                  <p className="text-xs text-green-600">New photo ready to save</p>
                </div>
              )}
          </div>

          <button
            type="submit"
            disabled={isUpdating}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {isUpdating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}

export default AccountPage;
