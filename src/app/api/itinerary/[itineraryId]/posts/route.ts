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

        const body = await request.json().catch(() => ({}))
        const published = typeof body.published === "boolean" ? body.published : undefined
        const description = typeof body.description === "string" ? body.description : undefined

        const post = await prisma.post.upsert({
            where: { ownerId_itineraryId: { ownerId: userId, itineraryId } },
            create: {
                ownerId: userId,
                itineraryId,
                ...(published !== undefined && { published }),
                ...(description !== undefined && { description }),
            },
            update: {
                ...(published !== undefined && { published }),
                ...(description !== undefined && { description }),
            },
            include: { photo: true }
        })

        return NextResponse.json({ post }, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 400 })
    }
}
