import { NextRequest, NextResponse } from "next/server"
import { getCurrUserId } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ itineraryId: string}>}

async function assertOwner(callerId: string, itineraryId: string) {
    const record = await prisma.collaborator.findUnique({
        where: { userId_itineraryId: {userId: callerId, itineraryId}}
    })
    return record?.role === "OWNER"
}

export async function POST(request: NextRequest, { params }: Params) {
    try {
        const callerId = await getCurrUserId();
        if (!callerId) return NextResponse.json({error: "Unauthorized"}, {status: 401})

        const { itineraryId } = await params;
        const { inviteeId } = await request.json()

        if (!(await assertOwner(callerId, itineraryId))) {
            return NextResponse.json({ error: "Only the OWNER can add collaborators"}, {status: 403})
        }
        const [aToB, bToA] = await Promise.all([
        prisma.follow.findUnique({
            where: {followerId_followingId: {followerId: callerId, followingId: inviteeId}}
        }),
        prisma.follow.findUnique({
            where: {followerId_followingId: {followerId: inviteeId, followingId: callerId}}
        })
    ])

        if (aToB?.status !== "ACCEPTED" || bToA?.status !== "ACCEPTED") {
            return NextResponse.json({ error: "Invitee is not a mutual friend"}, {status: 403})
        }

        const collaborator = await prisma.collaborator.upsert({
            where: {userId_itineraryId: {userId: inviteeId, itineraryId}},
            create: {userId: inviteeId, itineraryId, role: "EDITOR"},
            update: {}
        })

        return NextResponse.json(collaborator, { status: 201 });
    } catch (error) {
        return NextResponse.json({error: String(error)}, {status: 400})
    }

    
}

export async function DELETE(request: NextRequest, {params}: Params) {
    try {
        const callerId = await getCurrUserId()
        if (!callerId) return NextResponse.json({error: "Unauthorized"}, {status: 401})
        
        const { itineraryId } = await params
        const { targetUserId } = await request.json()

        if (!(await assertOwner(callerId, itineraryId))) {
            return NextResponse.json({ error: "Only the OWNER can remove collaborators"}, {status: 403})
        }

        const target = await prisma.collaborator.findUnique({
            where: {userId_itineraryId: { userId: targetUserId, itineraryId}}
        })

        if (!target) return NextResponse.json({error: "Collaborator not found"}, {status: 404})
        
        if (target.role === "OWNER") return NextResponse.json({error: "Cannot remove the OWNER"}, {status: 400})
        
        await prisma.collaborator.delete({
            where: {userId_itineraryId: {userId: targetUserId, itineraryId}}
        })
        return NextResponse.json({success: true})
    } catch (error) {
        return NextResponse.json({error: String(error)}, {status: 400})
    }
}