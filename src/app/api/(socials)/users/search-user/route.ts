import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrUserId } from '@/lib/auth/tokens'

export async function POST(request: Request) {
    try {
        const userId = await getCurrUserId()
        if (!userId) return NextResponse.json({error: "Unauthorized"}, {status: 401})
        
        const { query } = await request.json()
        const users = await prisma.user.findMany({
            where: {name: {contains: query, mode: "insensitive"}},
            select: {id: true, name: true, imageUrl: true}
        })

        return NextResponse.json(users, {status: 201})
    } catch (error) {
        if (error instanceof Error) return NextResponse.json({error: error.message}, {status: 400})
        
        console.log(error)
    }
}