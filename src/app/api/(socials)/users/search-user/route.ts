import { NextResponse } from 'next/server'
import { getCurrUserId } from '@/lib/auth/session'
import { searchUsers } from '@/services/socialsServices'

export async function POST(request: Request) {
    try {
        const userId = await getCurrUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { query } = await request.json();
        const users = await searchUsers(query, userId);
        return NextResponse.json(users, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 400 });
    }
}
