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

        const usersWithStatus = await Promise.all(users.map(async (user) => {
            const follow = await prisma.follow.findUnique({
                where: {followerId_followingId: {
                    followerId: userId, followingId: user.id
                }}
            })
            return {
                ...user,
                followStatus: follow?.status ?? "NONE"
            }
        }))

        return NextResponse.json(usersWithStatus, {status: 201})
    } catch (error) {
        if (error instanceof Error) return NextResponse.json({error: error.message}, {status: 400})
        
        console.log(error)
    }
}