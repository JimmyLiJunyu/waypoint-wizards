"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();

  // consider hashing for pw and regex validation for email
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError("");
    setIsGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setIsGoogleLoading(false);
    }
    // on success, Supabase redirects the browser to Google, so no further action here
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (response.ok) {
        // alert("Logged in successfully!");
        router.replace("/dashboard");
      } else {
        // alert("Invalid credentials.");
        setError(data.error || "Invalid Credentials.");
      }
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 p-8 max-w-sm mx-auto"
      >
        {error && (
          <div className="bg-red-50 text-red-600 p-2 rounded text-sm border border-red-200">
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="bg-red-600 hover:bg-red-750 text-white p-2 rounded transition-colors disabled:bg-red-350"
        >
          {isLoading ? "Logging in..." : "Log In"}
        </button>

        <div className="flex items-center gap-3 text-xs text-gray-400">
          <div className="flex-1 border-t" />
          or
          <div className="flex-1 border-t" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          className="flex items-center justify-center gap-2 border p-2 rounded font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <svg className="size-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.52 12.27c0-.82-.07-1.42-.22-2.05H12v3.72h6.6c-.13 1.09-.85 2.73-2.45 3.83l-.02.15 3.56 2.7.25.02c2.27-2.06 3.58-5.09 3.58-8.37"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.05 7.93-2.86l-3.78-2.87c-1.01.69-2.37 1.17-4.15 1.17-3.17 0-5.86-2.06-6.82-4.92l-.14.01-3.7 2.8-.05.13C3.25 21.3 7.31 24 12 24"
            />
            <path
              fill="#FBBC05"
              d="M5.18 14.52A6.9 6.9 0 0 1 4.8 12c0-.87.15-1.72.37-2.52l-.01-.17-3.75-2.83-.12.06A11.93 11.93 0 0 0 0 12c0 1.93.47 3.76 1.29 5.46z"
            />
            <path
              fill="#EA4335"
              d="M12 4.76c2.25 0 3.77.94 4.64 1.73l3.38-3.24C17.94 1.2 15.24 0 12 0 7.31 0 3.25 2.7 1.29 6.54l3.87 2.94C6.14 6.82 8.83 4.76 12 4.76"
            />
          </svg>
          {isGoogleLoading ? "Redirecting..." : "Sign in with Google"}
        </button>
      </form>

      <Link href="/sign-up" className="ml-auto pr-8">
        <h4 className="text-blue-500 underline">Sign up here</h4>
      </Link>
    </div>
  );
}

export default LoginForm;
