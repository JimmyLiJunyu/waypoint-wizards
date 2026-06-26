import { NextRequest, NextResponse } from "next/server"
import { getCurrUserId } from "@/lib/auth/tokens"
import { prisma } from "@/lib/prisma"
import { liveblocks } from "@/lib/liveblocks"


export async function POST(request: NextRequest) {
    const userId = await getCurrUserId()
    if (!userId) return NextResponse.json({error: "Unauthorized"}, {status: 401})
    
    const { room: itineraryId } = await request.json()
    if (!itineraryId) return NextResponse.json({error: "Missing Room"}, {status: 400})
    
    const collaborator = await prisma.collaborator.findUnique({
        where: { userId_itineraryId: {userId, itineraryId}}
    })
    if (!collaborator) return NextResponse.json({error: "Forbidden"}, {status: 403})
    
    const user = await prisma.user.findUnique({
        where: {id: userId},
        select: {name: true, imageUrl: true}
    })

    const session = liveblocks.prepareSession(userId, {
        userInfo: {
            name: user?.name ?? "Anonymous",
            imageUrl: user?.imageUrl ?? null,
        }
    })

    session.allow(itineraryId, ["room:write"])

    const { status, body } = await session.authorize();
    return new Response(body, { status })
}