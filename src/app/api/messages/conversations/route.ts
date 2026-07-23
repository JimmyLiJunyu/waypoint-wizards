import { NextRequest, NextResponse } from "next/server"
import { getCurrUserId } from "@/lib/auth/session"
import { getOrCreateConversation, listConversations } from "@/services/messagingServices"

export async function GET() {
    try {
        const userId = await getCurrUserId()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const conversations = await listConversations(userId)
        return NextResponse.json({ conversations })
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 400 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = await getCurrUserId()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { otherUserId } = await request.json()
        if (!otherUserId) return NextResponse.json({ error: "otherUserId is required" }, { status: 400 })

        const conversation = await getOrCreateConversation(userId, otherUserId)
        return NextResponse.json({ conversation }, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 400 })
    }
}
