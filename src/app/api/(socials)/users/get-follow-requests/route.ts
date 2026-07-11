import { NextResponse } from 'next/server'
import { getCurrUserId } from '@/lib/auth/session'
import { getFollowRequests } from '@/services/socialsServices'

export async function GET(request: Request) {
    try {
        const userId = await getCurrUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const requests = await getFollowRequests(userId);
        return NextResponse.json(requests, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 400 });
    }
}
