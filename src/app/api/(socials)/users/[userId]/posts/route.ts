import { NextResponse } from "next/server"
import { getUserPosts } from "@/services/feedServices"

export async function GET(request: Request, context: { params: Promise<{ userId: string }> }) {
    try {
        const { userId } = await context.params
        const posts = await getUserPosts(userId)
        return NextResponse.json({ posts })
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 400 })
    }
}
