import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
    params: Promise<{
        userId: string;
    }>;
}

export async function GET(request: Request, context: RouteParams) {

    try {
        const { userId } = await context.params;
        if (!userId) return NextResponse.json({ error: "Invalid User ID."}, {status: 400});

        const userTrips = await prisma.itinerary.findMany({
            where: {
                collaborators: {
                    some: {
                        userId: userId
                    }
                }
            }
        });

        return NextResponse.json({userTrips}, {status: 200});
    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json({error: error.message}, {status: 400});
        }
        return NextResponse.json({error: "Error fetching user's trips."}, {status: 400})
    }
}  