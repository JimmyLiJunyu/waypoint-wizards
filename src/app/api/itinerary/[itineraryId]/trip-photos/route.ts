import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrUserId } from "@/lib/auth/session"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest, {params}: {params: Promise<{itineraryId: string}>}) {

    const { itineraryId } = await params
    const user = await getCurrUserId()

    if (!user) return NextResponse.json({error: "Internal Server Error"}, {status: 401})

    const isCollab = await prisma.collaborator.findUnique({
        where: {userId_itineraryId: {
            userId: user,
            itineraryId: itineraryId
        }}
    })
    if (!isCollab) return NextResponse.json({error: "User is not a collaborator"}, {status: 403})

    const photos = await prisma.tripPhoto.findMany({
        where: {itineraryId: itineraryId},
        select: {
            id: true, url: true
        },
        
    })

    return NextResponse.json({photos})
}

export async function POST(request: NextRequest, {params}: {params: Promise<{itineraryId: string}>}) {

    const { itineraryId } = await params
    const user = await getCurrUserId()
    if (!user) return NextResponse.json({error: "Internal Server Error"}, {status: 401})

    const isCollab = await prisma.collaborator.findUnique({
        where: {userId_itineraryId: {
            userId: user,
            itineraryId: itineraryId
        }}
    })
    if (!isCollab) return NextResponse.json({error: "User is not a collaborator"}, {status: 403})

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({error: "No File Uploaded"}, {status: 400})
    
    const id = crypto.randomUUID()
    const { error } = await supabaseAdmin.storage
                        .from("trip-photos")
                        .upload(`trip/${itineraryId}/${id}`, file)
    if (error) return NextResponse.json({error: "Error uploading trip photo"}, {status: 400})
    
    const { data: {publicUrl} } = supabaseAdmin.storage
                                .from('trip-photos')
                                .getPublicUrl(`trip/${itineraryId}/${id}`)
    
    const photo = await prisma.tripPhoto.create({data: {
        id: id, url: publicUrl, itineraryId: itineraryId, uploadedBy: user
    }})

    return NextResponse.json({photo}, {status: 201})
    
}

