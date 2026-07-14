import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { runPersonalAssessment } from "@/lib/agents/assessment/orchestrator"
import type { Prisma } from "@prisma/client"

const ASSESSMENT_RATE_LIMIT_MAX = 10
const ASSESSMENT_RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000

const yesNo = z.enum(["si", "no"])
const yesNoUnsure = z.enum(["si", "no", "no_se"])

const answersSchema = z.object({
  identidadBuscasteNombre: yesNo,
  identidadDatosIndexados: yesNoUnsure,
  identidadPerfilesViejos: yesNoUnsure,
  identidadUsuarioRepetido: yesNo,

  cuentasMfaEmail: yesNo,
  cuentasMfaRedes: z.enum(["si", "no", "parcial"]),
  cuentasCantidad: z.enum(["menos_20", "20_80", "mas_80", "no_se"]),
  cuentasRevisoTerceros: yesNo,

  passwordsGestor: yesNo,
  passwordsReutiliza: yesNoUnsure,
  passwordsLargas: yesNoUnsure,
  passwordsCambioEmail: yesNoUnsure,

  redesPerfilPublico: z.enum(["si", "no", "mixto"]),
  redesFotosSensibles: z.enum(["si", "no", "a_veces"]),
  redesMuestraTrabajo: yesNo,
  redesGeolocalizacion: yesNoUnsure,

  dispositivosBloqueo: z.enum(["todos", "algunos", "ninguno"]),
  dispositivosCifrado: yesNoUnsure,
  dispositivosActualizados: yesNoUnsure,
  dispositivosAntivirus: z.enum(["si", "no", "no_aplica"]),

  redRouterProtocolo: z.enum(["wpa3", "wpa2", "wep_o_abierta", "no_se"]),
  redPasswordDefault: yesNoUnsure,
  redWpsDesactivado: yesNoUnsure,
  redIotSeparada: z.enum(["si", "no", "no_tiene_iot"]),

  ingSocialFechaNacimiento: yesNo,
  ingSocialPreguntasSeguridad: yesNoUnsure,
  ingSocialDatosFamiliares: yesNo,
  ingSocialContactosDesconocidos: z.enum(["si", "no", "a_veces"]),
})

const requestSchema = z.object({
  userEmail: z.string().min(1),
  answers: answersSchema,
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ "agent-id": string }> }
) {
  try {
    const { "agent-id": agentId } = await params
    const body = await request.json().catch(() => null)
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Respuestas inválidas o incompletas" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }
    const { userEmail, answers } = parsed.data

    const runCount = await prisma.personalAssessmentRun.count({
      where: {
        userEmail,
        createdAt: { gte: new Date(Date.now() - ASSESSMENT_RATE_LIMIT_WINDOW_MS) },
      },
    })
    if (runCount >= ASSESSMENT_RATE_LIMIT_MAX) {
      return new Response(JSON.stringify({ error: "Alcanzaste el límite de evaluaciones por hoy" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      })
    }

    const agent = await prisma.agent.findFirst({
      where: { OR: [{ id: agentId }, { slug: agentId }] },
    })
    if (!agent || !agent.active || agent.type !== "assessment") {
      return new Response(JSON.stringify({ error: "Agente no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    const run = await prisma.personalAssessmentRun.create({
      data: {
        agentId: agent.id,
        userEmail,
        answers: answers as unknown as Prisma.InputJsonValue,
        status: "running",
      },
    })

    try {
      const outcome = await runPersonalAssessment(answers)

      await prisma.personalAssessmentRun.update({
        where: { id: run.id },
        data: {
          status: "completed",
          findings: outcome.findings as unknown as Prisma.InputJsonValue,
          summary: outcome.summary,
          riskScore: outcome.riskScore,
        },
      })

      return new Response(JSON.stringify(outcome), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    } catch (err) {
      await prisma.personalAssessmentRun.update({
        where: { id: run.id },
        data: { status: "failed" },
      })
      throw err
    }
  } catch (error) {
    console.error("[POST /api/agents/[agent-id]/assessment/run]", error)
    return new Response(JSON.stringify({ error: "Error interno del servidor" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
