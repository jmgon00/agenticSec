### Task 5: Endpoint `POST /api/agents/[agent-id]/assessment/run`

**Files:**
- Create: `src/app/api/agents/[agent-id]/assessment/run/route.ts`
- Test: `src/app/api/agents/[agent-id]/assessment/run/route.test.ts`

**Interfaces:**
- Consumes: `runPersonalAssessment` de `@/lib/agents/assessment/orchestrator` (Task 4); `prisma.agent`, `prisma.personalAssessmentRun` de `@/lib/db` (Task 1's schema).
- Produces: `export async function POST(request: NextRequest, { params }): Promise<Response>` — usado por Task 8. Éxito: `200` con JSON `{ findings, summary, riskScore }`. Error: `400`/`404`/`429`/`500` con JSON `{ error: string }`.

- [ ] **Step 1: Escribir el test (falla porque el endpoint no existe)**

Crear `src/app/api/agents/[agent-id]/assessment/run/route.test.ts`:

```ts
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
```

- [ ] **Step 2: Correr el test para confirmar que falla**

Run: `npx vitest run "src/app/api/agents/[agent-id]/assessment/run/route.test.ts"`
Expected: FAIL — `Cannot find module './route'`.

- [ ] **Step 3: Implementar el endpoint**

Crear `src/app/api/agents/[agent-id]/assessment/run/route.ts`:

```ts
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
```

- [ ] **Step 4: Correr el test para confirmar que pasa**

Run: `npx vitest run "src/app/api/agents/[agent-id]/assessment/run/route.test.ts"`
Expected: PASS (4 tests).

- [ ] **Step 5: Correr toda la suite (regresión)**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add "src/app/api/agents/[agent-id]/assessment/run/route.ts" "src/app/api/agents/[agent-id]/assessment/run/route.test.ts"
git commit -m "feat: add POST endpoint to run the personal security assessment"
```

---

