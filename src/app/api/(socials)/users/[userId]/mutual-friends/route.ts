import { NextRequest, NextResponse } from "next/server"
import { getCurrUserId } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, {params}: {params: Promise<{userId: string}>}) {
    try {
        const callerId = await getCurrUserId()
        if (!callerId) return NextResponse.json({error: "Unauthorized"}, {status: 401})
        
        const { userId } = await params;
        if (userId !== callerId) {
            return NextResponse.json({error : "Forbidden"}, {status: 403})
        }

        const itineraryId = request.nextUrl.searchParams.get('itineraryId') ?? undefined
        const mutualFriends = await prisma.user.findMany({
            where: {
                AND: [
                    // callerId follows them: Follow(followerId=callerId, followingId=them)
                    // lives in them.following (Follow records where followingId=them.id)
                    {following: {some: {followerId: callerId, status: "ACCEPTED"}}},
                    // they follow callerId: Follow(followerId=them, followingId=callerId)
                    // lives in them.followers (Follow records where followerId=them.id)
                    {followers: {some: {followingId: callerId, status: "ACCEPTED"}}},
                    {id : { not: callerId }},
                    ...(itineraryId
                        ? [{itinearies: {none: {itineraryId}}}]
                        : []
                    ),
                ]
            },
            select: {id: true, name: true, imageUrl: true}
        })

        return NextResponse.json(mutualFriends);
    } catch (error) {
        return NextResponse.json({error: String(error)}, {status: 400})
    }
}