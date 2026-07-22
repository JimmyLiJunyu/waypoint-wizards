import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getCurrUserId } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Params = { params: Promise<{ itineraryId: string; photoId: string }> }

export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const userId = await getCurrUserId()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { itineraryId, photoId } = await params

        const photo = await prisma.tripPhoto.findUnique({ where: { id: photoId } })
        if (!photo) return NextResponse.json({ error: "Photo not found" }, { status: 404 })

        if (photo.uploadedBy !== userId) {
            return NextResponse.json({ error: "Only the uploader can delete this photo" }, { status: 403 })
        }

        await prisma.tripPhoto.delete({ where: { id: photoId } })

        const { error: removeError } = await supabaseAdmin.storage
            .from("trip-photos")
            .remove([`trip/${itineraryId}/${photoId}`])

        if (removeError) return NextResponse.json({ error: removeError.message }, { status: 400 })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 400 })
    }
}
