import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
    params: Promise<{
        userId: string;
    }>
};

type FollowerWithUser = {
    followerId: string;
    followingId: string;
    status: string;
    following: {
        id: string
        name: string
        imageUrl: string | null
    }
}


export async function GET(request: Request, context: RouteParams) {
    try {
        const {userId} = await context.params;
        if (!userId) return NextResponse.json({ error: "Invalid User ID."}, {status: 400});

        const followers = await prisma.follow.findMany({
            where: {
                followingId: userId,
                status: "ACCEPTED"
            },
            include: {
                following: {
                    select: {id: true, name: true, imageUrl: true}
                }
            }
        })
        const userWithStatus = await Promise.all(followers.map(async (f: FollowerWithUser) => {
            const followBack = await prisma.follow.findUnique({
                where: {followerId_followingId: {followerId: userId, followingId: f.following.id}}
            })
            return {
                ...f.following,
                followBackStatus: followBack?.status ?? "NONE"
            }
        }))
        return NextResponse.json(userWithStatus);
    } catch (error) {
        if (error instanceof Error) {   
            console.log(error)
            return NextResponse.json({error: "Couldnt get followers"}, {status: 400})
        }
        return NextResponse.json({error: "Internal Server Error"}, {status: 400})
    }
}