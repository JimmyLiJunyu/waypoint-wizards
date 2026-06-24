import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { verifyJWT } from "@/lib/auth/tokens"

export async function DELETE(request: Request, context: {
    params: Promise<{
        userId: string
    }>
}) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('tokens')?.value
        if (!token) return NextResponse.json({error: "Unauthorized"}, {status: 401})
        
        const payload = await verifyJWT(token)
        if (!payload) return NextResponse.json({error: "Unauthorized"}, {status: 401})
        const userId = String(payload.userId)
    }
}