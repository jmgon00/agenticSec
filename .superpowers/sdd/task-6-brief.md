### Task 6: Endpoint de reporte PDF del assessment

**Files:**
- Create: `src/app/api/agents/[agent-id]/assessment/report/route.ts`
- Test: `src/app/api/agents/[agent-id]/assessment/report/route.test.ts`

**Interfaces:**
- Consumes: `renderScanReportPdf` de `@/lib/agents/scan/report-pdf` (ya existente, sin cambios).
- Produces: `export async function POST(request: NextRequest): Promise<Response>` — usado por Task 7 (`ScanResultsView`) vía `reportEndpoint` prop.

- [ ] **Step 1: Escribir el test (falla porque el endpoint no existe)**

Crear `src/app/api/agents/[agent-id]/assessment/report/route.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "./route"
import type { CategoryCheckResult } from "@/lib/agents/types"

const sampleFindings: CategoryCheckResult[] = [
  {
    category: "Identidad Digital",
    points: [
      {
        point: "Revisaste qué información pública existe sobre vos",
        result: "Sí",
        severity: "OK",
        evidence: "Ya revisaste manualmente qué aparece sobre vos",
        recommendation: "Repetilo cada 6 meses",
        estado: "Aprobado",
      },
    ],
  },
]

function buildRequest(body: unknown) {
  return new NextRequest("http://localhost/api/agents/test-agent/assessment/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/agents/[agent-id]/assessment/report", () => {
  it("returns a PDF for a valid payload", async () => {
    const response = await POST(
      buildRequest({
        target: "Evaluación de Seguridad Personal",
        summary: "Resumen ejecutivo de prueba.",
        findings: sampleFindings,
      })
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toBe("application/pdf")
    expect(response.headers.get("Content-Disposition")).toContain("attachment")

    const buffer = Buffer.from(await response.arrayBuffer())
    expect(buffer.subarray(0, 4).toString("ascii")).toBe("%PDF")
  })

  it("returns 400 for a payload missing findings", async () => {
    const response = await POST(
      buildRequest({
        target: "Evaluación de Seguridad Personal",
        summary: "Resumen ejecutivo de prueba.",
      })
    )

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBeTruthy()
  })
})
```

- [ ] **Step 2: Correr el test para confirmar que falla**

Run: `npx vitest run "src/app/api/agents/[agent-id]/assessment/report/route.test.ts"`
Expected: FAIL — `Cannot find module './route'`.

- [ ] **Step 3: Implementar el endpoint**

Crear `src/app/api/agents/[agent-id]/assessment/report/route.ts` (idéntico estructuralmente a `src/app/api/agents/[agent-id]/scan/report/route.ts`, mismo esquema de validación y misma lógica — se duplica deliberadamente para no tocar el endpoint ya productivo del scan):

```ts
import { NextRequest } from "next/server"
import { z } from "zod"
import { renderScanReportPdf } from "@/lib/agents/scan/report-pdf"

const scanPointSchema = z.object({
  point: z.string().max(300),
  result: z.string().max(500),
  severity: z.string().max(50),
  evidence: z.string().max(2000),
  recommendation: z.string().max(1000),
  estado: z.enum(["Aprobado", "Fallido", "Pendiente", "No aplica"]),
})

const categoryCheckResultSchema = z.object({
  category: z.string().max(200),
  points: z.array(scanPointSchema).max(200),
})

const reportRequestSchema = z.object({
  target: z.string().min(1).max(500),
  summary: z.string().max(10000),
  findings: z.array(categoryCheckResultSchema).min(1).max(50),
})

function sanitizeFilenamePart(value: string): string {
  return value.replace(/^https?:\/\//, "").replace(/[^a-zA-Z0-9.-]/g, "-")
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = reportRequestSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Datos de reporte inválidos" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { target, summary, findings } = parsed.data
    const generatedAt = new Date()
    const pdfBuffer = await renderScanReportPdf({ target, summary, findings, generatedAt })

    const dateStr = generatedAt.toISOString().slice(0, 10)
    const filename = `reporte-evaluacion-personal-${sanitizeFilenamePart(target)}-${dateStr}.pdf`

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("[POST /api/agents/[agent-id]/assessment/report]", error)
    return new Response(JSON.stringify({ error: "Error interno del servidor" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
```

- [ ] **Step 4: Correr el test para confirmar que pasa**

Run: `npx vitest run "src/app/api/agents/[agent-id]/assessment/report/route.test.ts"`
Expected: PASS (2 tests).

- [ ] **Step 5: Correr toda la suite (regresión)**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add "src/app/api/agents/[agent-id]/assessment/report/route.ts" "src/app/api/agents/[agent-id]/assessment/report/route.test.ts"
git commit -m "feat: add PDF report endpoint for the personal security assessment"
```

---

