import {NextRequest, NextResponse} from "next/server"
import {getCurrUserId} from "@/lib/auth/session"
import {createClient} from "@supabase/supabase-js"
import {prisma} from "@/lib/prisma"

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(request: NextRequest, {params}: {params: Promise<{
    itineraryId: string,
    photoId: string
}>}) {

    const { itineraryId, photoId } = await params
    const user = await getCurrUserId()
    if (!user) return NextResponse.json({error: "Internal Server Error"}, {status: 401})
    
    const exists = await prisma.tripPhoto.findUnique({
        where: {id: photoId},
    })
    
    if (!exists) return NextResponse.json({error: "Photo does not exist in db"}, {status: 404})
    if (exists.uploadedBy !== user) return NextResponse.json({error: "Photo not uploaded by user"}, {status: 403})
    
    await prisma.tripPhoto.delete({
        where: {id: photoId}
    })

    const {error} = await supabaseAdmin.storage
                .from('trip-photos')
                .remove([`trip/${itineraryId}/${photoId}`])
    if (error) return NextResponse.json({error: error}, {status: 400})

    return NextResponse.json({success: true}, {status: 200})
}