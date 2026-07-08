import { NextRequest, NextResponse } from "next/server"
import { processAgentQuery } from "@/lib/agents/handlers"
import { prisma } from "@/lib/db"

// Rate limiting (reuse existing from Contact API)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const limit = rateLimitStore.get(key)

  if (!limit || now > limit.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + 900000, // 15 minutes
    })
    return true
  }

  if (limit.count >= 10) return false // 10 queries per 15 min
  limit.count++
  return true
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ "agent-id": string }> }
) {
  try {
    const { "agent-id": agentId } = await params
    const body = await request.json()
    const { userEmail, query, sessionId } = body

    // Validate inputs
    if (!userEmail || !query) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (query.length > 5000) {
      return NextResponse.json(
        { success: false, error: "Query too long (max 5000 chars)" },
        { status: 400 }
      )
    }

    // Rate limiting
    if (!checkRateLimit(userEmail)) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 }
      )
    }

    // Verify agent exists
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    })

    if (!agent) {
      return NextResponse.json(
        { success: false, error: "Agent not found" },
        { status: 404 }
      )
    }

    // Process query
    const result = await processAgentQuery({
      agentId,
      userEmail,
      query,
      sessionId,
    })

    return NextResponse.json({
      success: true,
      response: result.response,
      sessionId: result.sessionId,
      tokens: result.tokensUsed,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[POST /api/agents/[id]/run]", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
