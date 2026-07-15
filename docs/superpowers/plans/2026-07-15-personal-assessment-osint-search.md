# Búsqueda automática de exposición (Identidad Digital) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Para la categoría "Identidad Digital" del agente de Evaluación de Seguridad Personal, agregar una sección opcional donde el usuario puede dar su nombre/teléfono/DNI + consentimiento explícito, y el agente hace una búsqueda web real (tool `web_search` de Claude) para puntuar 3 de las 4 preguntas de esa categoría con hallazgos reales en vez de autorreporte.

**Architecture:** Dos llamadas a Claude nuevas (mismo patrón que `scan/orchestrator.ts`): una con el tool server-side `web_search_20260209` que investiga la exposición pública, y una segunda sin tools que fuerza `output_config.format` json_schema para traducir los hallazgos a 3 `ScanPoint`. Estos 3 puntos reemplazan a los que `scoring.ts` calcularía por autorreporte para esa corrida; el 4to punto de la categoría (`identidadUsuarioRepetido`) y las otras 6 categorías no cambian. Nombre/teléfono/DNI nunca se persisten — solo viajan en memoria del request.

**Tech Stack:** Next.js 16 App Router, Anthropic SDK (`web_search_20260209` server-side tool + `output_config.format`), zod, Vitest, React 19, TypeScript.

## Global Constraints

- Los 3 puntos de búsqueda deben usar exactamente estos títulos y este orden fijo (para que la UI se vea igual venga de autorreporte o de búsqueda):
  1. `"Revisaste qué información pública existe sobre vos"`
  2. `"Datos personales sensibles (teléfono/DNI/dirección) indexados"`
  3. `"Perfiles abandonados que siguen activos/públicos"`
- El 4to punto de Identidad Digital (`identidadUsuarioRepetido`, "Mismo usuario/handle reutilizado entre servicios") **nunca** se toca — siempre sale de `scoring.ts` por autorreporte, incluso cuando se hace la búsqueda.
- **Nombre, teléfono y DNI nunca se persisten** en `PersonalAssessmentRun` ni en ningún otro lado de la base — solo se usan en memoria durante el request.
- El prompt de estructuración le pide explícitamente a Claude no reproducir el dato sensible crudo en el campo `evidence` (describir el hallazgo en general, no citar el teléfono/DNI/dirección encontrados tal cual). Esto es una instrucción al modelo, no algo que el código pueda garantizar — documentarlo como limitación conocida.
- Consentimiento obligatorio: el backend rechaza (`400`) cualquier request que incluya `osintSearch` sin `consent: true`.
- Tool a usar: `web_search_20260209` (server-side, sin beta header), con `max_uses` acotado a 5 por corrida.
- Modelo: mismo patrón que el resto del proyecto — `process.env.SCAN_AGENT_MODEL || "claude-sonnet-5"`.
- Sin rate limit nuevo — reutiliza el límite existente de 10 evaluaciones/24h por `userEmail`.
- Sin fallback automático si la búsqueda falla — si `runOsintSearch` lanza, toda la corrida falla (mismo comportamiento que ya existe hoy para cualquier error del orchestrator), sin lógica adicional de reintento o degradación a autorreporte.
- Código sin llamadas a `@anthropic-ai/sdk` se testea normalmente (TDD). Código que sí llama al SDK real (`runOsintSearch`, la llamada de resumen en `orchestrator.ts`) sigue el mismo criterio ya establecido en este proyecto: sin test unitario, verificado manualmente — ver `src/lib/agents/scan/orchestrator.ts` y `src/lib/agents/assessment/orchestrator.ts`, ninguno de los dos tiene test propio por la misma razón.
- Estilo de código: sin punto y coma, comillas dobles (igual que el resto de `src/lib/agents/assessment/`).

---

## File Structure

- **Create:** `src/lib/agents/assessment/osint-search.ts` + `osint-search.test.ts` — tipo `OsintSearchInput`, función pura `mergeOsintFindings` (testeada), función `runOsintSearch` (llamadas reales a Claude, sin test).
- **Modify:** `src/lib/agents/assessment/orchestrator.ts` — `runPersonalAssessment` acepta un segundo parámetro opcional `osintInput`.
- **Modify:** `src/app/api/agents/[agent-id]/assessment/run/route.ts` — zod schema extendido, wiring al orchestrator, `maxDuration`.
- **Modify:** `src/components/sections/AgentAssessmentRunner.tsx` — sección opcional de búsqueda dentro de la categoría "Identidad Digital".

---

### Task 1: Motor de búsqueda OSINT (`osint-search.ts`)

**Files:**
- Create: `src/lib/agents/assessment/osint-search.ts`
- Test: `src/lib/agents/assessment/osint-search.test.ts`

**Interfaces:**
- Consumes: `CategoryCheckResult`, `ScanPoint` de `@/lib/agents/types` (sin cambios).
- Produces: `export interface OsintSearchInput { nombreCompleto: string; telefono?: string; dni?: string }`, `export function mergeOsintFindings(findings: CategoryCheckResult[], osintPoints: ScanPoint[]): CategoryCheckResult[]`, `export async function runOsintSearch(input: OsintSearchInput): Promise<ScanPoint[]>` — los tres usados por Task 2 (orchestrator.ts).

- [ ] **Step 1: Escribir el test de `mergeOsintFindings` (falla porque el archivo no existe)**

Crear `src/lib/agents/assessment/osint-search.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { mergeOsintFindings } from "./osint-search"
import type { CategoryCheckResult, ScanPoint } from "@/lib/agents/types"

function fakePoint(point: string): ScanPoint {
  return {
    point,
    result: "test",
    severity: "OK",
    evidence: "test",
    recommendation: "test",
    estado: "Aprobado",
  }
}

const baseFindings: CategoryCheckResult[] = [
  {
    category: "Identidad Digital",
    points: [
      fakePoint("Revisaste qué información pública existe sobre vos"),
      fakePoint("Datos personales sensibles (teléfono/DNI/dirección) indexados"),
      fakePoint("Perfiles abandonados que siguen activos/públicos"),
      fakePoint("Mismo usuario/handle reutilizado entre servicios"),
    ],
  },
  {
    category: "Cuentas y Autenticación",
    points: [fakePoint("MFA activado en el email principal")],
  },
]

describe("mergeOsintFindings", () => {
  it("replaces the first 3 points of Identidad Digital with the osint points", () => {
    const osintPoints: ScanPoint[] = [
      fakePoint("Revisaste qué información pública existe sobre vos"),
      { ...fakePoint("Datos personales sensibles (teléfono/DNI/dirección) indexados"), estado: "Fallido" },
      fakePoint("Perfiles abandonados que siguen activos/públicos"),
    ]

    const merged = mergeOsintFindings(baseFindings, osintPoints)
    const identidad = merged.find((c) => c.category === "Identidad Digital")!

    expect(identidad.points).toHaveLength(4)
    expect(identidad.points[0]).toBe(osintPoints[0])
    expect(identidad.points[1]).toBe(osintPoints[1])
    expect(identidad.points[1].estado).toBe("Fallido")
    expect(identidad.points[2]).toBe(osintPoints[2])
  })

  it("keeps the 4th point (identidadUsuarioRepetido) unchanged", () => {
    const osintPoints: ScanPoint[] = [
      fakePoint("Revisaste qué información pública existe sobre vos"),
      fakePoint("Datos personales sensibles (teléfono/DNI/dirección) indexados"),
      fakePoint("Perfiles abandonados que siguen activos/públicos"),
    ]

    const merged = mergeOsintFindings(baseFindings, osintPoints)
    const identidad = merged.find((c) => c.category === "Identidad Digital")!

    expect(identidad.points[3]).toBe(baseFindings[0].points[3])
    expect(identidad.points[3].point).toBe("Mismo usuario/handle reutilizado entre servicios")
  })

  it("leaves every other category untouched", () => {
    const osintPoints: ScanPoint[] = [
      fakePoint("Revisaste qué información pública existe sobre vos"),
      fakePoint("Datos personales sensibles (teléfono/DNI/dirección) indexados"),
      fakePoint("Perfiles abandonados que siguen activos/públicos"),
    ]

    const merged = mergeOsintFindings(baseFindings, osintPoints)

    expect(merged).toHaveLength(2)
    const cuentas = merged.find((c) => c.category === "Cuentas y Autenticación")!
    expect(cuentas).toBe(baseFindings[1])
  })
})
```

- [ ] **Step 2: Correr el test para confirmar que falla**

Run: `npx vitest run src/lib/agents/assessment/osint-search.test.ts`
Expected: FAIL — `Cannot find module './osint-search'`.

- [ ] **Step 3: Implementar `osint-search.ts`**

Crear `src/lib/agents/assessment/osint-search.ts`:

```ts
import Anthropic from "@anthropic-ai/sdk"
import type { CategoryCheckResult, ScanPoint } from "@/lib/agents/types"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface OsintSearchInput {
  nombreCompleto: string
  telefono?: string
  dni?: string
}

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    points: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          point: { type: "string" },
          result: { type: "string" },
          severity: { type: "string" },
          evidence: { type: "string" },
          recommendation: { type: "string" },
          estado: {
            type: "string",
            enum: ["Aprobado", "Fallido", "Pendiente", "No aplica"],
          },
        },
        required: ["point", "result", "severity", "evidence", "recommendation", "estado"],
        additionalProperties: false,
      },
    },
  },
  required: ["points"],
  additionalProperties: false,
} as const

export function mergeOsintFindings(
  findings: CategoryCheckResult[],
  osintPoints: ScanPoint[]
): CategoryCheckResult[] {
  return findings.map((category) => {
    if (category.category !== "Identidad Digital") return category
    const usuarioRepetido = category.points[3]
    return { ...category, points: [...osintPoints, usuarioRepetido] }
  })
}

export async function runOsintSearch(input: OsintSearchInput): Promise<ScanPoint[]> {
  const model = process.env.SCAN_AGENT_MODEL || "claude-sonnet-5"

  const dataLines = [
    `Nombre completo: ${input.nombreCompleto}`,
    input.telefono ? `Teléfono: ${input.telefono}` : null,
    input.dni ? `DNI: ${input.dni}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n")

  const searchSystemPrompt = `Sos un asistente de seguridad personal investigando, con autorización explícita de la propia persona, qué información pública existe sobre ella en internet. Buscá por su nombre completo (y teléfono/DNI si se proveen) para averiguar: (1) qué resultados aparecen al buscar su nombre, (2) si su teléfono o DNI aparecen indexados en algún sitio público, (3) si existen perfiles de redes sociales antiguos o abandonados asociados a su nombre. Reportá tus hallazgos en texto libre, describiendo qué encontraste sin necesidad de citar URLs exactas.`

  const searchResponse = await client.messages.create({
    model,
    max_tokens: 4096,
    system: searchSystemPrompt,
    thinking: { type: "adaptive" },
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }],
    messages: [
      { role: "user", content: `Investigá la exposición pública de esta persona:\n${dataLines}` },
    ],
  })

  const searchFindings = searchResponse.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n\n")

  const structureSystemPrompt = `Tenés los hallazgos de una búsqueda de exposición pública sobre una persona. Tu tarea es traducir esos hallazgos a exactamente 3 puntos de control, en este orden fijo:
1. "Revisaste qué información pública existe sobre vos" — dado que la búsqueda ya se hizo automáticamente, marcá esto como "Aprobado" salvo que la búsqueda haya fallado por completo.
2. "Datos personales sensibles (teléfono/DNI/dirección) indexados" — "Fallido" si se encontró el teléfono, DNI o dirección indexados públicamente; "Aprobado" si no se encontró nada; "Pendiente" si la búsqueda fue inconclusa.
3. "Perfiles abandonados que siguen activos/públicos" — "Fallido" si se detectaron perfiles viejos/abandonados públicos; "Aprobado" si no se detectó ninguno; "Pendiente" si fue inconcluso.

IMPORTANTE: en el campo "evidence" de cada punto, describí el hallazgo en términos generales — NUNCA repitas textualmente el teléfono, DNI o dirección encontrados. Por ejemplo, escribí "se encontró tu dirección publicada en un sitio público" en vez de citar la dirección real.`

  const structureResponse = await client.messages.create({
    model,
    max_tokens: 2048,
    system: structureSystemPrompt,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: `Hallazgos de la búsqueda:\n${searchFindings}` }],
    output_config: {
      format: { type: "json_schema", schema: OUTPUT_SCHEMA },
    },
  })

  const textBlock = structureResponse.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text"
  )
  if (!textBlock) {
    throw new Error("No se pudo estructurar el resultado de la búsqueda")
  }

  const parsed = JSON.parse(textBlock.text) as { points: ScanPoint[] }
  return parsed.points
}
```

- [ ] **Step 4: Correr el test para confirmar que pasa**

Run: `npx vitest run src/lib/agents/assessment/osint-search.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Correr toda la suite (regresión)**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/agents/assessment/osint-search.ts src/lib/agents/assessment/osint-search.test.ts
git commit -m "feat: add OSINT search engine for Identidad Digital category"
```

---

### Task 2: Integrar la búsqueda en el orchestrator

**Files:**
- Modify: `src/lib/agents/assessment/orchestrator.ts`

**Interfaces:**
- Consumes: `runOsintSearch`, `mergeOsintFindings`, `OsintSearchInput` de `./osint-search` (Task 1).
- Produces: `runPersonalAssessment(answers: AssessmentAnswers, osintInput?: OsintSearchInput): Promise<AssessmentOutcome>` — el segundo parámetro es nuevo y opcional; usado por Task 3.

- [ ] **Step 1: Modificar `orchestrator.ts`**

Reemplazar el contenido completo de `src/lib/agents/assessment/orchestrator.ts` por:

```ts
import Anthropic from "@anthropic-ai/sdk"
import { scoreAssessment, computeRiskScore } from "./scoring"
import { runOsintSearch, mergeOsintFindings, type OsintSearchInput } from "./osint-search"
import type { AssessmentAnswers, CategoryCheckResult } from "@/lib/agents/types"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface AssessmentOutcome {
  findings: CategoryCheckResult[]
  summary: string
  riskScore: number
}

export async function runPersonalAssessment(
  answers: AssessmentAnswers,
  osintInput?: OsintSearchInput
): Promise<AssessmentOutcome> {
  let findings = scoreAssessment(answers)

  if (osintInput) {
    const osintPoints = await runOsintSearch(osintInput)
    findings = mergeOsintFindings(findings, osintPoints)
  }

  const riskScore = computeRiskScore(findings)

  const model = process.env.SCAN_AGENT_MODEL || "claude-sonnet-5"
  const systemPrompt = `Sos un agente de evaluación de seguridad personal (Personal Security Assessment). Ya se calculó el resultado de las 7 categorías y un puntaje de riesgo global de 0 a 100 (más alto = mejor postura de seguridad). Tu única tarea es escribir un resumen ejecutivo de 2-3 párrafos en español claro, sin jerga técnica, para una persona sin conocimientos de seguridad: interpretá el puntaje global, mencioná primero las categorías con mayor riesgo, y priorizá qué corregir antes. No repitas la lista completa de puntos en el resumen — eso ya se muestra aparte. No inventes datos que no estén en el resultado que te paso.`

  const userMessage = `Puntaje de riesgo global: ${riskScore}/100\n\nResultado por categoría:\n${JSON.stringify(findings, null, 2)}`

  const response = await client.messages.create({
    model,
    max_tokens: 2048,
    system: systemPrompt,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: userMessage }],
  })

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text")
  if (!textBlock) {
    throw new Error("El agente no devolvió un resumen")
  }

  return { findings, summary: textBlock.text, riskScore }
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sin errores.

- [ ] **Step 3: Correr toda la suite (regresión)**

Run: `npm test`
Expected: PASS. (Sin test nuevo para `orchestrator.ts` — sigue llamando al SDK real para el resumen, mismo criterio que ya tenía antes de este cambio; la lógica de merge ya está testeada en Task 1.)

- [ ] **Step 4: Commit**

```bash
git add src/lib/agents/assessment/orchestrator.ts
git commit -m "feat: wire OSINT search into the personal assessment orchestrator"
```

---

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

### Task 4: UI — sección opcional de búsqueda en Identidad Digital + verificación manual

**Files:**
- Modify: `src/components/sections/AgentAssessmentRunner.tsx`

**Interfaces:** ninguna nueva expuesta a otros archivos — consume el endpoint de Task 3 vía `fetch`.

- [ ] **Step 1: Leer el archivo actual para confirmar el punto de partida**

Leer `src/components/sections/AgentAssessmentRunner.tsx` completo antes de editar — confirmar que sigue teniendo la forma esperada (debería, nada lo tocó desde que se creó).

- [ ] **Step 2: Agregar estado para los campos opcionales**

Reemplazar la línea:

```tsx
  const [riskScore, setRiskScore] = useState<number | null>(null)
```

por:

```tsx
  const [riskScore, setRiskScore] = useState<number | null>(null)
  const [osintNombre, setOsintNombre] = useState("")
  const [osintTelefono, setOsintTelefono] = useState("")
  const [osintDni, setOsintDni] = useState("")
  const [osintConsent, setOsintConsent] = useState(false)
```

- [ ] **Step 3: Incluir `osintSearch` en el body del POST cuando corresponda**

Reemplazar:

```tsx
      const response = await fetch(`/api/agents/${agent.id}/assessment/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, userEmail }),
      })
```

por:

```tsx
      const osintSearch =
        osintConsent && osintNombre.trim()
          ? {
              nombreCompleto: osintNombre.trim(),
              telefono: osintTelefono.trim() || undefined,
              dni: osintDni.trim() || undefined,
              consent: true as const,
            }
          : undefined

      const response = await fetch(`/api/agents/${agent.id}/assessment/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, userEmail, osintSearch }),
      })
```

- [ ] **Step 4: Resetear los campos opcionales en `handleReset`**

Reemplazar:

```tsx
  const handleReset = () => {
    setAnswers(initialAnswers())
    setFindings(null)
    setSummary("")
    setRiskScore(null)
  }
```

por:

```tsx
  const handleReset = () => {
    setAnswers(initialAnswers())
    setFindings(null)
    setSummary("")
    setRiskScore(null)
    setOsintNombre("")
    setOsintTelefono("")
    setOsintDni("")
    setOsintConsent(false)
  }
```

- [ ] **Step 5: Agregar la sección opcional dentro de la categoría "Identidad Digital"**

Reemplazar el bloque `{ASSESSMENT_CATEGORIES.map((cat) => ( ... ))}` completo por:

```tsx
          {ASSESSMENT_CATEGORIES.map((cat) => (
            <div key={cat.key}>
              <h3 className="text-lg font-bold text-white mb-3">{cat.label}</h3>
              <div className="space-y-4">
                {cat.questions.map((q) => (
                  <div key={q.id}>
                    <label className="block text-gray-300 text-sm font-semibold mb-2">{q.label}</label>
                    <div className="flex flex-wrap gap-2">
                      {q.options.map((opt) => (
                        <label
                          key={opt.value}
                          className={`px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                            answers[q.id] === opt.value
                              ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                              : "border-gray-600 bg-gray-800 text-gray-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            value={opt.value}
                            checked={answers[q.id] === opt.value}
                            onChange={() => handleAnswer(q.id, opt.value)}
                            disabled={running}
                            className="sr-only"
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {cat.key === "identidad" && (
                <div className="mt-6 p-4 border border-cyan-400/30 bg-cyan-400/5 rounded-lg space-y-3">
                  <div>
                    <div className="text-sm font-semibold text-cyan-300">
                      Opcional: dejá que busquemos tu exposición pública por vos
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Completá tu nombre (y opcionalmente teléfono/DNI) para que un agente de IA busque
                      en internet qué información pública existe sobre vos, en vez de que lo hagas manualmente.
                    </p>
                  </div>
                  <input
                    type="text"
                    value={osintNombre}
                    onChange={(e) => setOsintNombre(e.target.value)}
                    placeholder="Nombre completo"
                    disabled={running}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
                  />
                  <input
                    type="text"
                    value={osintTelefono}
                    onChange={(e) => setOsintTelefono(e.target.value)}
                    placeholder="Teléfono (opcional)"
                    disabled={running}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
                  />
                  <input
                    type="text"
                    value={osintDni}
                    onChange={(e) => setOsintDni(e.target.value)}
                    placeholder="DNI (opcional)"
                    disabled={running}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
                  />
                  <label className="flex items-start gap-3 text-xs text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={osintConsent}
                      onChange={(e) => setOsintConsent(e.target.checked)}
                      disabled={running}
                      className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span>
                      Confirmo que estos son mis propios datos, autorizo la búsqueda pública en internet, y
                      entiendo que se envían a un servicio de búsqueda de terceros para generar el resultado.
                      No se guardan mi nombre, teléfono ni DNI.
                    </span>
                  </label>
                </div>
              )}
            </div>
          ))}
```

- [ ] **Step 6: Verificar tipos**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sin errores.

- [ ] **Step 7: Correr toda la suite (regresión)**

Run: `npm test`
Expected: PASS.

- [ ] **Step 8: Verificación manual end-to-end (post-deploy)**

El `DATABASE_URL` local es SQLite y el schema es PostgreSQL, así que esta corrida no se puede probar contra la base local — igual que en el resto de este proyecto, la verificación real ocurre después de desplegar a Vercel. Una vez desplegado:

1. Ir a la página del agente "Evaluación de Seguridad Personal".
2. Completar las 28 preguntas, y en la sección opcional de Identidad Digital completar nombre (+ opcionalmente teléfono/DNI de prueba) y tildar el consentimiento.
3. Generar la evaluación. Confirmar que la corrida tarda más que sin la búsqueda (por las 2 llamadas extra) pero termina sin error dentro del `maxDuration` de 120s.
4. Confirmar en el resultado que los 3 primeros puntos de "Identidad Digital" reflejan hallazgos reales (no el texto genérico de autorreporte) y que el 4to punto (usuario/handle repetido) sigue viniendo de la respuesta cerrada que diste en el formulario.
5. Confirmar que el campo `evidence` de esos 3 puntos no reproduce el teléfono/DNI ingresados tal cual.
6. Repetir sin completar la sección opcional (dejar nombre vacío) y confirmar que el resultado es idéntico al comportamiento actual (autorreporte puro, sin búsqueda).

- [ ] **Step 9: Commit**

```bash
git add src/components/sections/AgentAssessmentRunner.tsx
git commit -m "feat: add optional OSINT search section to the Identidad Digital category"
```

---

## Self-Review Notes

- **Spec coverage:** dos llamadas a Claude (búsqueda + estructuración) en Task 1, integración en el orchestrator sin tocar el resto de las categorías en Task 2, endpoint que acepta y valida `osintSearch` sin persistirlo en Task 3, UI opcional con consentimiento explícito en Task 4 — todos los puntos de la spec están cubiertos.
- **Placeholder scan:** sin TBD/TODO; cada step tiene código completo o un procedimiento de verificación manual concreto.
- **Type consistency:** `OsintSearchInput` (Task 1) se consume sin cambios en `orchestrator.ts` (Task 2) y en `route.ts` (Task 3, construido a partir de `osintSearch` ya validado por zod). `ScanPoint`/`CategoryCheckResult` no se modifican en ningún task.
