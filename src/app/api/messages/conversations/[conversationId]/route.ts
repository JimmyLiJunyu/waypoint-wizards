import { NextRequest, NextResponse } from "next/server"
import { getCurrUserId } from "@/lib/auth/session"
import { getMessages, isParticipant, sendMessage } from "@/services/messagingServices"

type Params = { params: Promise<{ conversationId: string }> }

export async function GET(request: NextRequest, { params }: Params) {
    try {
        const userId = await getCurrUserId()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { conversationId } = await params
        if (!(await isParticipant(conversationId, userId))) {
            return NextResponse.json({ error: "Not a participant in this conversation" }, { status: 403 })
        }

        const messages = await getMessages(conversationId, userId)
        return NextResponse.json({ messages })
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 400 })
    }
}

export async function POST(request: NextRequest, { params }: Params) {
    try {
        const userId = await getCurrUserId()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { conversationId } = await params
        if (!(await isParticipant(conversationId, userId))) {
            return NextResponse.json({ error: "Not a participant in this conversation" }, { status: 403 })
        }

        const { content } = await request.json()
        if (!content || typeof content !== "string" || !content.trim()) {
            return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 })
        }

        const message = await sendMessage(conversationId, userId, content.trim())
        return NextResponse.json({ message }, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 400 })
    }
}
