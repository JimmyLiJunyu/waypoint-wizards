"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function SignUpForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [error, setError] = useState("");
  const [valid, setValid] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError("");
    setIsGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      if (!valid) throw Error("Passwords do not match!");
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });
      const data = await response.json();
      if (response.ok) {
        router.replace("/login");
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full border border-gray-200 rounded-xl px-4 py-3 text-base bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-colors placeholder-gray-400";

  return (
    <div className="w-full max-w-md">
      {/* Brand */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">WayPoint Wizards</h1>
        <p className="text-gray-500 text-sm mt-1">Your collaborative trip planner</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h2>
        <p className="text-gray-500 text-sm mb-6">Start planning your first adventure</p>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100 mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Name</label>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setValid(e.target.value === verifyPassword || verifyPassword === "");
              }}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Confirm Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={verifyPassword}
              onChange={(e) => {
                setVerifyPassword(e.target.value);
                setValid(e.target.value === password);
              }}
              className={`${inputClass} ${!valid && verifyPassword ? "border-red-400 focus:ring-red-400" : ""}`}
            />
            {!valid && verifyPassword && (
              <p className="text-xs text-red-500 mt-0.5">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !valid}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 text-base mt-1"
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="flex items-center gap-3 text-xs text-gray-400 my-5">
          <div className="flex-1 border-t" />
          or continue with
          <div className="flex-1 border-t" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
        >
          <svg className="size-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.52 12.27c0-.82-.07-1.42-.22-2.05H12v3.72h6.6c-.13 1.09-.85 2.73-2.45 3.83l-.02.15 3.56 2.7.25.02c2.27-2.06 3.58-5.09 3.58-8.37" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.05 7.93-2.86l-3.78-2.87c-1.01.69-2.37 1.17-4.15 1.17-3.17 0-5.86-2.06-6.82-4.92l-.14.01-3.7 2.8-.05.13C3.25 21.3 7.31 24 12 24" />
            <path fill="#FBBC05" d="M5.18 14.52A6.9 6.9 0 0 1 4.8 12c0-.87.15-1.72.37-2.52l-.01-.17-3.75-2.83-.12.06A11.93 11.93 0 0 0 0 12c0 1.93.47 3.76 1.29 5.46z" />
            <path fill="#EA4335" d="M12 4.76c2.25 0 3.77.94 4.64 1.73l3.38-3.24C17.94 1.2 15.24 0 12 0 7.31 0 3.25 2.7 1.29 6.54l3.87 2.94C6.14 6.82 8.83 4.76 12 4.76" />
          </svg>
          {isGoogleLoading ? "Redirecting..." : "Sign up with Google"}
        </button>
      </div>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-red-500 hover:text-red-600 font-semibold">
          Log in
        </Link>
      </p>
    </div>
  );
}

export default SignUpForm;
