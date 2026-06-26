import { NextResponse } from "next/server";
import { getFollowers } from "@/services/socialsServices";

export async function GET(request: Request, context: { params: Promise<{ userId: string }> }) {
    try {
        const { userId } = await context.params;
        if (!userId) return NextResponse.json({ error: "Invalid User ID." }, { status: 400 });

        const followers = await getFollowers(userId);
        return NextResponse.json(followers);
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 400 });
    }
}
