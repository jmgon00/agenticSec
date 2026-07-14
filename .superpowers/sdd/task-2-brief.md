### Task 2: Endpoint `POST /api/agents/[agent-id]/scan/report`

**Files:**
- Create: `src/app/api/agents/[agent-id]/scan/report/route.ts`
- Test: `src/app/api/agents/[agent-id]/scan/report/route.test.ts`

**Interfaces:**
- Consumes: `renderScanReportPdf(input: ScanReportInput): Promise<Buffer>` de Task 1 (`@/lib/agents/scan/report-pdf`).
- Produces: `export async function POST(request: NextRequest): Promise<Response>` — usado por Task 3 vía `fetch("/api/agents/{agentId}/scan/report", { method: "POST", body: JSON.stringify({ target, summary, findings }) })`. Respuesta: `200` con body PDF binario y headers `Content-Type: application/pdf` + `Content-Disposition: attachment; filename="..."`, o `400`/`500` con body JSON `{ error: string }`.

- [ ] **Step 1: Escribir el test (falla porque el endpoint no existe todavía)**

Crear `src/app/api/agents/[agent-id]/scan/report/route.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "./route"
import type { CategoryCheckResult } from "@/lib/agents/types"

const sampleFindings: CategoryCheckResult[] = [
  {
    category: "Headers HTTP",
    points: [
      {
        point: "Content-Security-Policy configurado",
        result: "Presente",
        severity: "OK",
        evidence: "content-security-policy: default-src 'self'",
        recommendation: "Ninguna acción requerida.",
        estado: "Aprobado",
      },
    ],
  },
]

function buildRequest(body: unknown) {
  return new NextRequest("http://localhost/api/agents/test-agent/scan/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/agents/[agent-id]/scan/report", () => {
  it("returns a PDF for a valid payload", async () => {
    const response = await POST(
      buildRequest({
        target: "https://ejemplo.com",
        summary: "Resumen ejecutivo de prueba.",
        findings: sampleFindings,
      })
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toBe("application/pdf")
    expect(response.headers.get("Content-Disposition")).toContain("attachment")
    expect(response.headers.get("Content-Disposition")).toContain(".pdf")

    const buffer = Buffer.from(await response.arrayBuffer())
    expect(buffer.subarray(0, 4).toString("ascii")).toBe("%PDF")
  })

  it("returns 400 for a payload missing findings", async () => {
    const response = await POST(
      buildRequest({
        target: "https://ejemplo.com",
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

Run: `npx vitest run src/app/api/agents/[agent-id]/scan/report/route.test.ts`
Expected: FAIL — `Cannot find module './route'` (el archivo todavía no existe).

- [ ] **Step 3: Crear el endpoint**

Crear `src/app/api/agents/[agent-id]/scan/report/route.ts`:

```ts
import { NextRequest } from "next/server"
import { z } from "zod"
import { renderScanReportPdf } from "@/lib/agents/scan/report-pdf"

const scanPointSchema = z.object({
  point: z.string(),
  result: z.string(),
  severity: z.string(),
  evidence: z.string(),
  recommendation: z.string(),
  estado: z.enum(["Aprobado", "Fallido", "Pendiente", "No aplica"]),
})

const categoryCheckResultSchema = z.object({
  category: z.string(),
  points: z.array(scanPointSchema),
})

const reportRequestSchema = z.object({
  target: z.string().min(1),
  summary: z.string(),
  findings: z.array(categoryCheckResultSchema).min(1),
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
    const filename = `reporte-seguridad-${sanitizeFilenamePart(target)}-${dateStr}.pdf`

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("[POST /api/agents/[agent-id]/scan/report]", error)
    return new Response(JSON.stringify({ error: "Error interno del servidor" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
```

- [ ] **Step 4: Correr el test para confirmar que pasa**

Run: `npx vitest run src/app/api/agents/[agent-id]/scan/report/route.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Correr toda la suite para confirmar que no rompió nada**

Run: `npm test`
Expected: PASS — todos los tests existentes más los 3 nuevos (1 de Task 1 + 2 de Task 2).

- [ ] **Step 6: Commit**

```bash
git add "src/app/api/agents/[agent-id]/scan/report/route.ts" "src/app/api/agents/[agent-id]/scan/report/route.test.ts"
git commit -m "feat: add POST endpoint to generate the security scan PDF report"
```

---

