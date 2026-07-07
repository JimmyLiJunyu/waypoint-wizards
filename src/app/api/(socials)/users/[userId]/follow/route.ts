import { NextResponse } from "next/server"
import { getCurrUserId } from "@/lib/auth/session";
import { followUser } from "@/services/socialsServices";

export async function POST(request: Request, context: { params: Promise<{ userId: string }> }) {
    try {
        const currUserId = await getCurrUserId();
        if (!currUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { userId: targetUserId } = await context.params;
        const follow = await followUser(currUserId, targetUserId);
        return NextResponse.json(follow, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 400 });
    }
}
