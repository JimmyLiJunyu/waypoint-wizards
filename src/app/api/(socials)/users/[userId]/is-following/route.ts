import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrUserId } from '@/lib/auth/tokens'

export async function GET(request: Request, context: {params: Promise<{userId: string}>}) {

    try {
        const currUserId = await getCurrUserId()
        const {userId} = await context.params

        if (!currUserId || !userId) return NextResponse.json({error: "Unauthorized"}, {status: 401})

        const data = await prisma.follow.findUnique({
            where: {followerId_followingId: {followerId: currUserId, followingId: userId}}
        })

        return NextResponse.json({isFollowing: !!data}, {status: 200})

    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json({error: error.message}, {status: 400})
        }
        console.log(error)
    }
}