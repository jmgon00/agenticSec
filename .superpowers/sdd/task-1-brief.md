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

