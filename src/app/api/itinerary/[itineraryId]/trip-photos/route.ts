import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getCurrUserId } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Params = { params: Promise<{ itineraryId: string }> }

async function isCollaborator(userId: string, itineraryId: string) {
    const record = await prisma.collaborator.findUnique({
        where: { userId_itineraryId: { userId, itineraryId } }
    })
    return record !== null
}

export async function GET(request: NextRequest, { params }: Params) {
    try {
        const userId = await getCurrUserId()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { itineraryId } = await params

        if (!(await isCollaborator(userId, itineraryId))) {
            return NextResponse.json({ error: "Not a collaborator on this trip" }, { status: 403 })
        }

        const photos = await prisma.tripPhoto.findMany({
            where: { itineraryId }
        })

        return NextResponse.json({ photos })
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 400 })
    }
}

export async function POST(request: NextRequest, { params }: Params) {
    try {
        const userId = await getCurrUserId()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { itineraryId } = await params

        if (!(await isCollaborator(userId, itineraryId))) {
            return NextResponse.json({ error: "Not a collaborator on this trip" }, { status: 403 })
        }

        const formData = await request.formData()
        const file = formData.get("file") as File
        if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

        const id = crypto.randomUUID()
        const path = `trip/${itineraryId}/${id}`

        const { error: uploadError } = await supabaseAdmin.storage
            .from("trip-photos")
            .upload(path, file)

        if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from("trip-photos")
            .getPublicUrl(path)

        const photo = await prisma.tripPhoto.create({
            data: { id, url: publicUrl, itineraryId, uploadedBy: userId }
        })

        return NextResponse.json({ photo }, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 400 })
    }
}
