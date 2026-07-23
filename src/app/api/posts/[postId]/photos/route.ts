import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getCurrUserId } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Params = { params: Promise<{ postId: string }> }

export async function POST(request: NextRequest, { params }: Params) {
    try {
        const userId = await getCurrUserId()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { postId } = await params

        const post = await prisma.post.findUnique({ where: { id: postId } })
        if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 })

        if (post.ownerId !== userId) {
            return NextResponse.json({ error: "Only the post owner can add photos" }, { status: 403 })
        }

        const formData = await request.formData()
        const file = formData.get("file") as File
        if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

        const id = crypto.randomUUID()
        const path = `post/${userId}/${id}`

        const { error: uploadError } = await supabaseAdmin.storage
            .from("post-photos")
            .upload(path, file)

        if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from("post-photos")
            .getPublicUrl(path)

        const photo = await prisma.photo.create({
            data: { id, url: publicUrl, postId }
        })

        return NextResponse.json({ photo }, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 400 })
    }
}
