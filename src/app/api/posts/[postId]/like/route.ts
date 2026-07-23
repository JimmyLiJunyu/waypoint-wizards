import { NextRequest, NextResponse } from "next/server"
import { getCurrUserId } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ postId: string }> }

export async function POST(request: NextRequest, { params }: Params) {
    try {
        const userId = await getCurrUserId()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { postId } = await params

        const like = await prisma.postLike.upsert({
            where: { userId_postId: { userId, postId } },
            create: { userId, postId },
            update: {}
        })

        return NextResponse.json({ like }, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 400 })
    }
}

export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const userId = await getCurrUserId()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { postId } = await params

        const existing = await prisma.postLike.findUnique({
            where: { userId_postId: { userId, postId } }
        })
        if (!existing) return NextResponse.json({ success: true })

        await prisma.postLike.delete({
            where: { userId_postId: { userId, postId } }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 400 })
    }
}
