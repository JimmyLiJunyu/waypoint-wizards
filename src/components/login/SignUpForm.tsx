"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, redirect } from "next/navigation";

function SignUpForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [error, setError] = useState("");
  const [valid, setValid] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!valid) throw Error("Passwords do not match!");
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Sign Up successful!");
        router.replace("/login");
      } else {
        alert("Error");
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify center">
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
          value={password}
          placeholder="Password"
          onChange={(e) => {
            setPassword(e.target.value);
            if (e.target.value != password) setValid(false);
            else setValid(true);
          }}
          className="border p-2 rounded"
        />

        <input
          type="password"
          value={verifyPassword}
          placeholder="Verify Password"
          onChange={(e) => {
            setVerifyPassword(e.target.value);
            if (e.target.value != password) setValid(false);
            else setValid(true);
          }}
          className="border p-2 rounded"
        />
        {!valid && (
          <div className="bg-red-50 text-red-600 p-2 rounded text-sm border border-red-200">
            Passwords do not match!
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="bg-red-600 hover:bg-red-750 text-white p-2 rounded transition-colors disabled:bg-red-350"
        >
          {isLoading ? "Signing up..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}

export default SignUpForm;
