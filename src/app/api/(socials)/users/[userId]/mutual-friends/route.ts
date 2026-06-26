import { NextRequest, NextResponse } from "next/server"
import { getCurrUserId } from "@/lib/auth/tokens"
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
                    {followers: {some: {followerId: callerId, status: "ACCEPTED"}}},
                    {following: {some: {followingId: callerId, status: "ACCEPTED"}}},
                    {id : { not: callerId }},
                    ...(itineraryId
                        ? [{itineraries: {none: {itineraryId}}}]
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