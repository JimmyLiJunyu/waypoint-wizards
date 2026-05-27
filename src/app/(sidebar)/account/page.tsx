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

  if (isUserLoading) return <p>Loading profile...</p>;
  if (!user) return <p>Server error.</p>;

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
    <main className="min-h-screen bg-gray-50 flex items-start justify-center pt-12 px-4 font-sans text-slate-900">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="bg-red-500 p-8 flex flex-col items-center border-b border-slate-100">
          <div className="relative size-24 rounded-full overflow-hidden bg-white border-4 border-white shadow-md mb-4">
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
          <p className="text-gray-300 text-sm">
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
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none bg-slate-50/50 focus:bg-white text-slate-800"
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
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none bg-slate-50/50 focus:bg-white text-slate-800"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1 flex items-center gap-2">
              <ImageIcon className="size-3" /> Image Upload
            </label>
            <input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              type="text"
              name="imageUrl"
              placeholder={user.imageUrl || "https://..."}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none bg-slate-50/50 focus:bg-white text-slate-800"
            />
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
