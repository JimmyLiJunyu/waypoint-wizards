import { NextResponse } from "next/server"
import { getCurrUserId } from "@/lib/auth/session";
import { unfollowUser } from "@/services/socialsServices";

export async function DELETE(request: Request, context: { params: Promise<{ userId: string }> }) {
    try {
        const currUserId = await getCurrUserId();
        if (!currUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { userId: targetUserId } = await context.params;
        await unfollowUser(currUserId, targetUserId);
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 400 });
    }
}
