"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, redirect } from "next/navigation";

function LoginForm() {

    const router = useRouter();
    
    // consider hashing for pw and regex validation for email
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ email, password }),

        });
            const data = await response.json();

            if (response.ok) {
                alert("Logged in successfully!");
                router.replace('/new-trip');
            } else {
                alert("Invalid credentials.");
                setError(data.error || 'Invalid Credentials.');
            }                
        } catch (e) {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col flex-1 items-center justify center ">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-8 max-w-sm mx-auto">
                
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
                
                <button type="submit" disabled={isLoading} className="bg-red-600 hover:bg-red-750 text-white p-2 rounded transition-colors disabled:bg-red-350">
                    {isLoading ? "Logging in..." : "Log In"}
                </button>
            </form>

            <Link href="/sign-up" className='ml-auto pr-8'>
                <h4 className='text-blue-500 underline'>Sign up here</h4>
            </Link>
        </div>
    )
}

export default LoginForm