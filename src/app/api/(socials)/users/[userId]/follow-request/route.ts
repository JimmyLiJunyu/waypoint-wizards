import { NextResponse } from "next/server"
import { getCurrUserId } from "@/lib/auth/tokens"
import { respondToFollowRequest } from "@/services/socialsServices"

export async function PATCH(request: Request, context: { params: Promise<{ userId: string }> }) {
    try {
        const currUserId = await getCurrUserId();
        if (!currUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { action } = await request.json();
        const { userId: requestedFrom } = await context.params;

        await respondToFollowRequest(requestedFrom, currUserId, action);
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 400 });
    }
}
