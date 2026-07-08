import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ "agent-id": string }> }
) {
  try {
    const { "agent-id": agentId } = await params
    const userEmail = request.headers.get("X-User-Email")

    // Fetch agent by ID or slug
    const agent = await prisma.agent.findFirst({
      where: {
        OR: [{ id: agentId }, { slug: agentId }],
      },
    })

    if (!agent) {
      return NextResponse.json(
        { success: false, error: "Agent not found" },
        { status: 404 }
      )
    }

    // Fetch user's last session if email provided
    let userSession = null
    if (userEmail) {
      userSession = await prisma.agentSession.findFirst({
        where: {
          userEmail,
          agentId: agent.id,
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        agent,
        userSession: userSession || null,
      },
    })
  } catch (error) {
    console.error("[GET /api/agents/[id]]", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
