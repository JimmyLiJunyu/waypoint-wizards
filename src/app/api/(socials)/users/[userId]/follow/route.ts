import { NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'
import { getCurrUserId } from "@/lib/auth/tokens";


interface FollowRequestParams {
    params: Promise<{
        targetId: string
    }>
}

export async function POST(request: Request, context: FollowRequestParams) {
    try {
        const currUserId = await getCurrUserId();
        if (!currUserId) return NextResponse.json({error: "Unauthorized"}, {status: 401})

        const { targetId: targetUserId } = await context.params
        const follow = await prisma.follow.create({
            data: {
                followerId: currUserId,
                followingId: targetUserId,
                status: "PENDING"
            }
        })
        return NextResponse.json(follow, {status: 201})
    } catch(error) {
        console.log(error)
        return NextResponse.json({error: error}, {status: 400})
    }

}