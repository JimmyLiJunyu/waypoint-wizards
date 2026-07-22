import { NextRequest, NextResponse } from "next/server"
import { getCurrUserId } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ itineraryId: string }> }

export async function GET(request: NextRequest, { params }: Params) {
    try {
        const userId = await getCurrUserId()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { itineraryId } = await params

        const post = await prisma.post.findUnique({
            where: { ownerId_itineraryId: { ownerId: userId, itineraryId } },
            include: { photo: true }
        })

        return NextResponse.json({ post })
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 400 })
    }
}

export async function POST(request: NextRequest, { params }: Params) {
    try {
        const userId = await getCurrUserId()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { itineraryId } = await params

        const collaborator = await prisma.collaborator.findUnique({
            where: { userId_itineraryId: { userId, itineraryId } }
        })
        if (!collaborator) {
            return NextResponse.json({ error: "Not a collaborator on this trip" }, { status: 403 })
        }

        const post = await prisma.post.upsert({
            where: { ownerId_itineraryId: { ownerId: userId, itineraryId } },
            create: { ownerId: userId, itineraryId },
            update: {},
            include: { photo: true }
        })

        return NextResponse.json({ post }, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 400 })
    }
}
