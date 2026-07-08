import { prisma } from "@/lib/db"
import { executeAgent } from "./claude"
import { Message } from "@/lib/agents/types"

export async function processAgentQuery({
  agentId,
  userEmail,
  query,
  sessionId,
}: {
  agentId: string
  userEmail: string
  query: string
  sessionId?: string
}) {
  // Fetch agent
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
  })

  if (!agent) {
    throw new Error("Agent not found")
  }

  // Link-type agents cannot be executed
  if (agent.type === "link") {
    throw new Error("This agent is an external link and cannot be executed here")
  }

  // Execute Claude API
  const { response, tokensUsed } = await executeAgent({
    agentInstructions: agent.instructions || "",
    userQuery: query,
    maxTokens: agent.maxTokens || 1000,
    temperature: agent.temperature || 0.7,
  })

  // Update or create session
  let session
  if (sessionId) {
    // Existing session - append message
    const existingSession = await prisma.agentSession.findUnique({
      where: { id: sessionId },
    })

    if (!existingSession) {
      throw new Error("Session not found")
    }

    const messages = (existingSession.messages as unknown as Message[]) || []
    const now = new Date().toISOString()

    messages.push(
      {
        role: "user",
        content: query,
        timestamp: now,
        tokens: 0, // Placeholder
      },
      {
        role: "assistant",
        content: response,
        timestamp: now,
        tokens: tokensUsed,
      }
    )

    session = await prisma.agentSession.update({
      where: { id: sessionId },
      data: {
        messages: messages as any,
        totalMessages: messages.length,
        totalTokens: (existingSession.totalTokens || 0) + tokensUsed,
      },
    })
  } else {
    // New session
    const now = new Date().toISOString()
    const initialMessages: Message[] = [
      {
        role: "user",
        content: query,
        timestamp: now,
        tokens: 0,
      },
      {
        role: "assistant",
        content: response,
        timestamp: now,
        tokens: tokensUsed,
      },
    ]

    // Auto-generate title from first query
    const title = query.substring(0, 50) + (query.length > 50 ? "..." : "")

    session = await prisma.agentSession.create({
      data: {
        userEmail,
        agentId,
        messages: initialMessages as any,
        title,
        totalMessages: 2,
        totalTokens: tokensUsed,
      },
    })
  }

  return {
    sessionId: session.id,
    response,
    tokensUsed,
  }
}
