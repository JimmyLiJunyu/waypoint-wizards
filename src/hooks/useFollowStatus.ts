import { useState } from "react";

type FollowStatus = "NONE" | "PENDING" | "ACCEPTED";

export function useFollowStatus(id: string, initialStatus: string) {
    const [status, setStatus] = useState<FollowStatus>(initialStatus as FollowStatus);

    async function follow() {
        const res = await fetch(`/api/users/${id}/follow`, { method: "POST" });
        if (res.ok) setStatus("PENDING");
    }

    return { status, setStatus, follow };
}
