import { createItinerary } from "@/services/tripServices";
import { NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth/tokens";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const session = token ? await verifyJWT(token) : null;
    if (!session) return NextResponse.json({ error: "Unauthorized "}, { status: 401 });
    try {
        const { destination, startDate, endDate } = await request.json();
        

        const newItinerary = await createItinerary({
            title: "Untitled",
            userId: session.userId,
            destination: destination,
            startDate: startDate,
            endDate: endDate
        });

        return NextResponse.json(newItinerary, {status:201});
    } catch (error) {
        if (error instanceof Error) {
            console.log("Itinerary creation failed: ", error.message);
            return NextResponse.json({error: error.message}, {status: 401});
        }
        return NextResponse.json({error: "Internal Server Error"}, {status:500});
    }
}

