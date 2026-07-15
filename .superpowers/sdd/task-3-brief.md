### Task 3: Endpoint — aceptar y validar `osintSearch`, sin persistirlo

**Files:**
- Modify: `src/app/api/agents/[agent-id]/assessment/run/route.ts`
- Modify (test): `src/app/api/agents/[agent-id]/assessment/run/route.test.ts`

**Interfaces:**
- Consumes: `runPersonalAssessment(answers, osintInput?)` de Task 2.
- Produces: sin cambios en la forma pública del endpoint aparte del nuevo campo opcional `osintSearch` en el body — usado por Task 4 (`AgentAssessmentRunner.tsx`).

- [ ] **Step 1: Leer el test actual para confirmar el punto de partida**

Leer `src/app/api/agents/[agent-id]/assessment/run/route.test.ts` completo antes de editarlo — confirmar que el mock de `@/lib/agents/assessment/orchestrator` y de `@/lib/db` siguen teniendo la forma que se espera (deberían, nada los tocó desde que se crearon).

- [ ] **Step 2: Agregar el nuevo caso de test (falla porque `osintSearch` todavía no existe en el schema/wiring)**

Agregar al final de `src/app/api/agents/[agent-id]/assessment/run/route.test.ts`, dentro del `describe` existente, un nuevo test:

```ts
  it("passes osintSearch to the orchestrator but never persists it", async () => {
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
      summary: "Resumen con búsqueda.",
      riskScore: 90,
    })

    const osintSearch = {
      nombreCompleto: "Juan Pérez",
      telefono: "1122334455",
      dni: "30111222",
      consent: true as const,
    }

    const response = await POST(
      buildRequest({ userEmail: "user@test.com", answers: validAnswers, osintSearch }),
      buildParams()
    )

    expect(response.status).toBe(200)

    // runPersonalAssessment recibió el osintSearch tal cual
    expect(runPersonalAssessment).toHaveBeenCalledWith(
      validAnswers,
      expect.objectContaining({ nombreCompleto: "Juan Pérez" })
    )

    // pero nada de eso llegó a Prisma: ni en el create ni en el update
    const createCallArgs = vi.mocked(prisma.personalAssessmentRun.create).mock.calls[0][0]
    const createSerialized = JSON.stringify(createCallArgs)
    expect(createSerialized).not.toContain("Juan Pérez")
    expect(createSerialized).not.toContain("1122334455")
    expect(createSerialized).not.toContain("30111222")

    const updateCallArgs = vi.mocked(prisma.personalAssessmentRun.update).mock.calls[0][0]
    const updateSerialized = JSON.stringify(updateCallArgs)
    expect(updateSerialized).not.toContain("Juan Pérez")
    expect(updateSerialized).not.toContain("1122334455")
    expect(updateSerialized).not.toContain("30111222")
  })

  it("rejects osintSearch without explicit consent", async () => {
    const response = await POST(
      buildRequest({
        userEmail: "user@test.com",
        answers: validAnswers,
        osintSearch: { nombreCompleto: "Juan Pérez", consent: false },
      }),
      buildParams()
    )
    expect(response.status).toBe(400)
  })
```

- [ ] **Step 3: Correr el test para confirmar que falla**

Run: `npx vitest run "src/app/api/agents/[agent-id]/assessment/run/route.test.ts"`
Expected: FAIL — el schema actual no tiene `osintSearch`, así que `runPersonalAssessment` se sigue llamando con un solo argumento y el primer `expect` falla; el segundo test también falla porque `osintSearch` con `consent: false` hoy no es rechazado (el campo ni existe en el schema).

- [ ] **Step 4: Implementar el cambio en `route.ts`**

Reemplazar el contenido completo de `src/app/api/agents/[agent-id]/assessment/run/route.ts` por:

```ts
import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { runPersonalAssessment } from "@/lib/agents/assessment/orchestrator"
import type { Prisma } from "@prisma/client"

export const maxDuration = 120

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

const osintSearchSchema = z.object({
  nombreCompleto: z.string().min(1).max(200),
  telefono: z.string().max(50).optional(),
  dni: z.string().max(50).optional(),
  consent: z.literal(true),
})

const requestSchema = z.object({
  userEmail: z.string().min(1),
  answers: answersSchema,
  osintSearch: osintSearchSchema.optional(),
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
    const { userEmail, answers, osintSearch } = parsed.data

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
      const outcome = osintSearch
        ? await runPersonalAssessment(answers, {
            nombreCompleto: osintSearch.nombreCompleto,
            telefono: osintSearch.telefono,
            dni: osintSearch.dni,
          })
        : await runPersonalAssessment(answers)

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

- [ ] **Step 5: Correr el test para confirmar que pasa**

Run: `npx vitest run "src/app/api/agents/[agent-id]/assessment/run/route.test.ts"`
Expected: PASS (6 tests: los 4 que ya existían + los 2 nuevos).

- [ ] **Step 6: Correr toda la suite (regresión)**

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add "src/app/api/agents/[agent-id]/assessment/run/route.ts" "src/app/api/agents/[agent-id]/assessment/run/route.test.ts"
git commit -m "feat: accept optional OSINT search input in the assessment run endpoint, never persisted"
```

---

