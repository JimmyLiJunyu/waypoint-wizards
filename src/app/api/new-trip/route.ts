import { createItinerary } from "@/services/tripServices";
import { NextResponse } from "next/server";
import { getCurrUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    const userId = await getCurrUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        const { destination, startDate, endDate } = await request.json();

        if (new Date(endDate) < new Date(startDate)) {
            return NextResponse.json({ error: "End date must be after the start date." }, { status: 400 });
        }

        const existingCount = await prisma.itinerary.count({
            where: {
                collaborators: { some: { userId } }
            }
        });
        const defaultTitle = existingCount === 0 ? "New Trip" : `New Trip ${existingCount + 1}`;

        const newItinerary = await createItinerary({
            title: defaultTitle,
            userId,
            destination,
            startDate,
            endDate,
        });

        return NextResponse.json(newItinerary, { status: 201 });
    } catch (error) {
        if (error instanceof Error) {
            console.log("Itinerary creation failed: ", error.message);
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

