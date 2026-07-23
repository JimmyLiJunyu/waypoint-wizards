import { NextResponse } from "next/server"
import { getCurrUserId } from "@/lib/auth/session"
import { getFeedPosts } from "@/services/feedServices"

export async function GET() {
    try {
        const currUserId = await getCurrUserId()
        if (!currUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const posts = await getFeedPosts(currUserId)
        return NextResponse.json({ posts })
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 400 })
    }
}
