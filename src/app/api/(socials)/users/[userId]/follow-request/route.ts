import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrUserId } from "@/lib/auth/tokens"

export async function PATCH(request: Request, context: { params: Promise<{
    userId: string
}>}) {

    try {
        
        const currUserId = await getCurrUserId();
        console.log("CurrUserId", currUserId)
        if (!currUserId) return NextResponse.json({error: "Unauthorized"}, {status: 401})
        const { action } = await request.json();
        console.log("Action: ", action)
        const { userId: requestedFrom } = await context.params
        console.log("UserID: ", requestedFrom)


        if (action === "ACCEPT") {
            await prisma.follow.update({
                where: {followerId_followingId: {
                    followerId: requestedFrom,
                    followingId: currUserId
                }},
                data: {status: "ACCEPTED"}
            })
        } else {
            await prisma.follow.delete({
                where: {followerId_followingId: {
                    followerId: requestedFrom,
                    followingId: currUserId
                }}
            })
        }

        return NextResponse.json({success: true}, {status: 200})
    } catch (error) {
        console.log(error)
        return NextResponse.json({error: error}, {status: 400})
    }

}