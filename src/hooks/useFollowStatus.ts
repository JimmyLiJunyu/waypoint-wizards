import { useState } from "react";

type FollowStatus = "NONE" | "PENDING" | "ACCEPTED";

export function useFollowStatus(id: string, initialStatus: string) {
    const [status, setStatus] = useState<FollowStatus>(initialStatus as FollowStatus);

    async function follow() {
        const res = await fetch(`/api/users/${id}/follow`, { method: "POST" });
        if (res.ok) setStatus("PENDING");
    }

    // Also cancels an outgoing PENDING request — both are just deleting the same Follow row.
    async function unfollow() {
        const res = await fetch(`/api/users/${id}/unfollow`, { method: "DELETE" });
        if (res.ok) setStatus("NONE");
    }

    return { status, setStatus, follow, unfollow };
}
