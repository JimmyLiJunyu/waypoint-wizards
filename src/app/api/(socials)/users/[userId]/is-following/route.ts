import { NextResponse } from 'next/server'
import { getCurrUserId } from '@/lib/auth/tokens'
import { getFollowStatus } from '@/services/socialsServices'

export async function GET(request: Request, context: { params: Promise<{ userId: string }> }) {
    try {
        const currUserId = await getCurrUserId();
        const { userId } = await context.params;

        if (!currUserId || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const status = await getFollowStatus(currUserId, userId);
        return NextResponse.json({ isFollowing: status === "ACCEPTED", status }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 400 });
    }
}
