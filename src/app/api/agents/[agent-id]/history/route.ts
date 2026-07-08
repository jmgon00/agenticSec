import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { "agent-id": string } }
) {
  try {
    const agentId = params["agent-id"]
    const userEmail = request.nextUrl.searchParams.get("userEmail")

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: "Email required" },
        { status: 400 }
      )
    }

    const sessions = await prisma.agentSession.findMany({
      where: {
        userEmail,
        agentId,
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        totalMessages: true,
        messages: true,
      },
      orderBy: { createdAt: "desc" },
    })

    // Extract last message preview
    const sessionsWithPreview = sessions.map((session) => {
      const lastMessage = (session.messages as any[])?.[(session.messages as any[]).length - 1]
      return {
        id: session.id,
        title: session.title,
        createdAt: session.createdAt,
        messageCount: session.totalMessages,
        lastMessage: lastMessage?.content || "",
      }
    })

    return NextResponse.json({
      success: true,
      data: sessionsWithPreview,
    })
  } catch (error) {
    console.error("[GET /api/agents/[id]/history]", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
