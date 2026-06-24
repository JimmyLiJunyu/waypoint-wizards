import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrUserId } from '@/lib/auth/tokens'

export async function GET(request: Request) {
    try {
        const userId = await getCurrUserId();
        if (!userId) return NextResponse.json({error: "Unauthorized"}, {status: 401})
        
        const data = await prisma.follow.findMany({
            where: {
                followingId: userId,
                status: "PENDING",
            }, 
            include: {
                following: {
                    select: {id: true, name: true, imageUrl: true}
            }
            }
        })
        console.log(data)
        return NextResponse.json(data.map(f => f.following), {status: 200})
    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json({error: error.message}, {status: 400})
        }
        return NextResponse.json({error: error}, {status: 400})
    }
}   