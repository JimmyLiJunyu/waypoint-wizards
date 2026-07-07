import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getCurrUserId } from "@/lib/auth/session";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ itineraryId: string }> }
) {
    const userId = await getCurrUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { itineraryId } = await params;
        const { title } = await req.json();

        if (!title || typeof title !== "string" || title.trim() === "") {
            return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
        }

        const updated = await prisma.itinerary.update({
            where: { id: itineraryId },
            data: { title: title.trim() },
        });

        return NextResponse.json({ title: updated.title }, { status: 200 });
    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to rename trip" }, { status: 500 });
    }
}