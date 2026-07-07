import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrUserId } from "@/lib/auth/session"

export async function GET() {
    const userId = await getCurrUserId()
    if (!userId) return NextResponse.json({error: "Unauthorized"}, {status: 401})
    
    const user = await prisma.user.findUnique({
        where: {id: userId},
        select: {id: true, name: true, email: true, imageUrl: true}
    })

    if (!user) return NextResponse.json({error: "User not found"}, {status: 404})
    
    return NextResponse.json(user); 
}