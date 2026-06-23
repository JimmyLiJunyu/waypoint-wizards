import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
    params: Promise<{
        userId: string;
    }>
};



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
                follower: {
                    select: {id: true, name: true, imageUrl: true}
                }
            }
        })
        console.log(followers)
        return NextResponse.json(followers.map(f => f.follower))
    } catch (error) {
        if (error instanceof Error) {   
            console.log(error)
            return NextResponse.json({error: "Couldnt get followers"}, {status: 400})
        }
        return NextResponse.json({error: "Internal Server Error"}, {status: 400})
    }
}