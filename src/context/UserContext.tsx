'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface UserProfile {
    name: string | null,
    email: string | null,
    imageUrl: string | null,
    id: string
};

const UserContext = createContext<{
    user: UserProfile | null,
    isLoading: boolean,
} | undefined> (undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await fetch('api/user/me');
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                }
            } catch (error) {
                console.log("Error loading user context: ", error)
            } finally {
                setIsLoading(false);
            }
        }
        fetchUser();
    }, []);

    return (
        <UserContext.Provider value={{ user, isLoading }}>
            {children}
        </UserContext.Provider>
    )
}

export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used within a UserProvider")
    }
    return context;
}