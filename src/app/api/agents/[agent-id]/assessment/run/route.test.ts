import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db", () => ({
  prisma: {
    agent: { findFirst: vi.fn() },
    personalAssessmentRun: { count: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}))

vi.mock("@/lib/agents/assessment/orchestrator", () => ({
  runPersonalAssessment: vi.fn(),
}))

import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { runPersonalAssessment } from "@/lib/agents/assessment/orchestrator"
import { POST } from "./route"

const validAnswers = {
  identidadBuscasteNombre: "si",
  identidadDatosIndexados: "no",
  identidadPerfilesViejos: "no",
  identidadUsuarioRepetido: "no",
  cuentasMfaEmail: "si",
  cuentasMfaRedes: "si",
  cuentasCantidad: "20_80",
  cuentasRevisoTerceros: "si",
  passwordsGestor: "si",
  passwordsReutiliza: "no",
  passwordsLargas: "si",
  passwordsCambioEmail: "si",
  redesPerfilPublico: "no",
  redesFotosSensibles: "no",
  redesMuestraTrabajo: "no",
  redesGeolocalizacion: "no",
  dispositivosBloqueo: "todos",
  dispositivosCifrado: "si",
  dispositivosActualizados: "si",
  dispositivosAntivirus: "si",
  redRouterProtocolo: "wpa3",
  redPasswordDefault: "si",
  redWpsDesactivado: "si",
  redIotSeparada: "no_tiene_iot",
  ingSocialFechaNacimiento: "no",
  ingSocialPreguntasSeguridad: "no",
  ingSocialDatosFamiliares: "no",
  ingSocialContactosDesconocidos: "no",
}

function buildRequest(body: unknown) {
  return new NextRequest("http://localhost/api/agents/test-agent/assessment/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

function buildParams(agentId = "test-agent") {
  return { params: Promise.resolve({ "agent-id": agentId }) }
}

describe("POST /api/agents/[agent-id]/assessment/run", () => {
  beforeEach(() => {
    vi.mocked(prisma.agent.findFirst).mockReset()
    vi.mocked(prisma.personalAssessmentRun.count).mockReset()
    vi.mocked(prisma.personalAssessmentRun.create).mockReset()
    vi.mocked(prisma.personalAssessmentRun.update).mockReset()
    vi.mocked(runPersonalAssessment).mockReset()
  })

  it("returns 200 with findings/summary/riskScore for a valid payload", async () => {
    vi.mocked(prisma.personalAssessmentRun.count).mockResolvedValue(0)
    vi.mocked(prisma.agent.findFirst).mockResolvedValue({
      id: "agent-1",
      active: true,
      type: "assessment",
    } as any)
    vi.mocked(prisma.personalAssessmentRun.create).mockResolvedValue({ id: "run-1" } as any)
    vi.mocked(prisma.personalAssessmentRun.update).mockResolvedValue({} as any)
    vi.mocked(runPersonalAssessment).mockResolvedValue({
      findings: [{ category: "Identidad Digital", points: [] }],
      summary: "Resumen de prueba.",
      riskScore: 78,
    })

    const response = await POST(buildRequest({ userEmail: "user@test.com", answers: validAnswers }), buildParams())

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.riskScore).toBe(78)
    expect(data.summary).toBe("Resumen de prueba.")
    expect(prisma.personalAssessmentRun.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "completed" }) })
    )
  })

  it("returns 400 when answers are incomplete", async () => {
    const { identidadBuscasteNombre, ...incomplete } = validAnswers
    const response = await POST(
      buildRequest({ userEmail: "user@test.com", answers: incomplete }),
      buildParams()
    )
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBeTruthy()
  })

  it("returns 429 when the rate limit is exceeded", async () => {
    vi.mocked(prisma.personalAssessmentRun.count).mockResolvedValue(10)

    const response = await POST(buildRequest({ userEmail: "user@test.com", answers: validAnswers }), buildParams())

    expect(response.status).toBe(429)
  })

  it("returns 404 when the agent is not type assessment", async () => {
    vi.mocked(prisma.personalAssessmentRun.count).mockResolvedValue(0)
    vi.mocked(prisma.agent.findFirst).mockResolvedValue({
      id: "agent-1",
      active: true,
      type: "scan",
    } as any)

    const response = await POST(buildRequest({ userEmail: "user@test.com", answers: validAnswers }), buildParams())

    expect(response.status).toBe(404)
  })
})
