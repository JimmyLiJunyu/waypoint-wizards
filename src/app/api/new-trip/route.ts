import { createItinerary } from "@/services/tripServices";
import { NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth/tokens";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const session = token ? await verifyJWT(token) : null;
    if (!session) return NextResponse.json({ error: "Unauthorized " }, { status: 401 });
    try {
        const { destination, startDate, endDate } = await request.json();
        const userId = session.userId.toString();

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

