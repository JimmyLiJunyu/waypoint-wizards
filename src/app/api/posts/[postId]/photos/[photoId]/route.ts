import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getCurrUserId } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Params = { params: Promise<{ postId: string; photoId: string }> }

export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const userId = await getCurrUserId()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { postId, photoId } = await params

        const photo = await prisma.photo.findUnique({
            where: { id: photoId },
            include: { post: true }
        })
        if (!photo || photo.postId !== postId) {
            return NextResponse.json({ error: "Photo not found" }, { status: 404 })
        }

        if (photo.post.ownerId !== userId) {
            return NextResponse.json({ error: "Only the post owner can delete this photo" }, { status: 403 })
        }

        await prisma.photo.delete({ where: { id: photoId } })

        const { error: removeError } = await supabaseAdmin.storage
            .from("post-photos")
            .remove([`post/${userId}/${photoId}`])

        if (removeError) return NextResponse.json({ error: removeError.message }, { status: 400 })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 400 })
    }
}
