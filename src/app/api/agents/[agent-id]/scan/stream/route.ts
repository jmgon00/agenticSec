import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"
import { assertSafeTarget, UnsafeTargetError } from "@/lib/agents/scan/ssrf-guard"
import { runSecurityScan } from "@/lib/agents/scan/orchestrator"
import type { Prisma } from "@prisma/client"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ "agent-id": string }> }
) {
  const { "agent-id": agentId } = await params
  const body = await request.json()
  const { target, authorized, userEmail } = body as {
    target?: string
    authorized?: boolean
    userEmail?: string
  }

  if (!target || !userEmail || authorized !== true) {
    return new Response(
      JSON.stringify({ error: "Faltan datos requeridos o falta la autorización" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  const rateLimitCheck = checkRateLimit(`scan:${userEmail}`)
  if (!rateLimitCheck.allowed) {
    return new Response(
      JSON.stringify({ error: "Alcanzaste el límite de auditorías por hoy" }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    )
  }

  const agent = await prisma.agent.findFirst({
    where: { OR: [{ id: agentId }, { slug: agentId }] },
  })
  if (!agent || agent.type !== "scan") {
    return new Response(JSON.stringify({ error: "Agente no encontrado" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    })
  }

  let safeTarget: { url: string; hostname: string }
  try {
    safeTarget = await assertSafeTarget(target)
  } catch (err) {
    const message = err instanceof UnsafeTargetError ? err.message : "Target inválido"
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const run = await prisma.securityScanRun.create({
    data: {
      agentId: agent.id,
      userEmail,
      target: safeTarget.url,
      authorizedAt: new Date(),
      status: "running",
    },
  })

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        )
      }

      try {
        const outcome = await runSecurityScan(safeTarget, (progress) => {
          send(progress.type, progress)
        })

        await prisma.securityScanRun.update({
          where: { id: run.id },
          data: {
            status: "completed",
            findings: outcome.findings as unknown as Prisma.InputJsonValue,
            summary: outcome.summary,
          },
        })

        send("complete", outcome)
      } catch (err) {
        await prisma.securityScanRun.update({
          where: { id: run.id },
          data: { status: "failed" },
        })
        send("error", {
          message: err instanceof Error ? err.message : "Error desconocido",
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
