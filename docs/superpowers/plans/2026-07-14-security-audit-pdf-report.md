# Reporte PDF descargable del Auditor de Seguridad Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar un botón "Descargar reporte (PDF)" a los resultados del Auditor de Seguridad con IA, que genera un PDF liviano y con marca a partir de los datos ya mostrados en pantalla tras un scan en vivo.

**Architecture:** Un nuevo endpoint `POST /api/agents/[agent-id]/scan/report` recibe `{ target, summary, findings }` (los mismos datos que el cliente ya tiene en memoria), los valida con `zod`, y renderiza un PDF vectorial en el servidor con `@react-pdf/renderer` (`renderToBuffer`). El cliente (`AgentScanRunner.tsx`) hace `fetch` al endpoint, convierte la respuesta en `Blob` y dispara la descarga con un link temporal. No se toca la base de datos ni se agrega historial — todo vive en la sesión del scan en vivo.

**Tech Stack:** Next.js App Router (route handlers), `@react-pdf/renderer` v4, `zod` v4, Vitest, React 19, TypeScript.

## Global Constraints

- El PDF se genera 100% en el servidor, sin capturas de pantalla ni navegador headless (Puppeteer/Chromium) — debe ser vectorial/texto para mantenerse liviano.
- Endpoint: `POST /api/agents/[agent-id]/scan/report`. No lee ni escribe `SecurityScanRun` en la base de datos, no vuelve a correr `assertSafeTarget`, no aplica rate limiting adicional (spec: `docs/superpowers/specs/2026-07-14-security-audit-pdf-report-design.md`).
- Nombre de archivo: `reporte-seguridad-<target-sanitizado>-<YYYY-MM-DD>.pdf`, donde `<target-sanitizado>` es el `target` sin el prefijo `https://`/`http://` y con cualquier carácter que no sea alfanumérico, punto o guion reemplazado por `-`.
- Colores de los badges de estado (deben coincidir con los tags ya usados en pantalla, `ESTADO_STYLE` de `AgentScanRunner.tsx`): Aprobado `#22c55e`, Fallido `#ef4444`, Pendiente `#eab308`, No aplica `#6b7280`. Texto blanco (`#ffffff`) sobre todos excepto Pendiente, que usa texto oscuro (`#1f2937`) por contraste sobre el amarillo.
- Marca en el header del PDF: fondo `#030712` (mismo tono que `bg-gray-950` del sitio), texto "AgenticSec" en `#22d3ee` (mismo cyan que `Header.tsx`).
- Footer fijo en cada página con el texto exacto: *"Página {n} de {total} · Este reporte fue generado automáticamente por un agente de IA como apoyo informativo y no reemplaza una auditoría de seguridad profesional completa."*
- Fuera de alcance: historial de scans pasados, endpoint `GET` para regenerar reportes viejos, cualquier cambio a los checks del scan en sí.
- Estilo de código: sin punto y coma al final de línea, comillas dobles — igual que `src/lib/agents/types.ts`, `src/lib/agents/scan/orchestrator.ts` y `AgentScanRunner.tsx`.

---

## File Structure

- **Create:** `src/lib/agents/scan/report-pdf.tsx` — componente `ScanReportDocument` (react-pdf) + helper `renderScanReportPdf()` que devuelve un `Buffer`.
- **Create:** `src/lib/agents/scan/report-pdf.test.ts` — test del helper de generación de PDF.
- **Create:** `src/app/api/agents/[agent-id]/scan/report/route.ts` — endpoint `POST` que valida el body y devuelve el PDF binario.
- **Create:** `src/app/api/agents/[agent-id]/scan/report/route.test.ts` — test del endpoint.
- **Modify:** `src/components/sections/AgentScanRunner.tsx` — unifica los tipos duplicados importándolos de `@/lib/agents/types`, agrega el botón de descarga y la lógica de `fetch` + descarga de blob.
- **Modify:** `package.json` / `package-lock.json` — agrega la dependencia `@react-pdf/renderer` (vía `npm install`).

---

### Task 1: Generador de PDF (`report-pdf.tsx`)

**Files:**
- Create: `src/lib/agents/scan/report-pdf.tsx`
- Test: `src/lib/agents/scan/report-pdf.test.ts`

**Interfaces:**
- Consumes: `CategoryCheckResult`, `ScanEstado` desde `@/lib/agents/types` (ya existen, sin cambios).
- Produces: `export interface ScanReportInput { target: string; summary: string; findings: CategoryCheckResult[]; generatedAt: Date }` y `export async function renderScanReportPdf(input: ScanReportInput): Promise<Buffer>` — usado por Task 2.

- [ ] **Step 1: Instalar la dependencia**

Run: `npm install @react-pdf/renderer@^4.5.1`
Expected: `package.json` y `package-lock.json` quedan modificados con la nueva dependencia.

- [ ] **Step 2: Escribir el test (falla porque el archivo no existe todavía)**

Crear `src/lib/agents/scan/report-pdf.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { renderScanReportPdf } from "./report-pdf"
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
      {
        point: "Strict-Transport-Security configurado",
        result: "Ausente",
        severity: "Alto",
        evidence: "Header no encontrado en la respuesta",
        recommendation: "Agregar el header Strict-Transport-Security.",
        estado: "Fallido",
      },
    ],
  },
]

describe("renderScanReportPdf", () => {
  it("generates a valid, lightweight PDF buffer", async () => {
    const buffer = await renderScanReportPdf({
      target: "https://ejemplo.com",
      summary: "Resumen ejecutivo de prueba.",
      findings: sampleFindings,
      generatedAt: new Date("2026-07-14T12:00:00Z"),
    })

    expect(buffer.subarray(0, 4).toString("ascii")).toBe("%PDF")
    expect(buffer.length).toBeGreaterThan(0)
    expect(buffer.length).toBeLessThan(200_000)
  })
})
```

- [ ] **Step 3: Correr el test para confirmar que falla**

Run: `npx vitest run src/lib/agents/scan/report-pdf.test.ts`
Expected: FAIL — `Cannot find module './report-pdf'` (el archivo todavía no existe).

- [ ] **Step 4: Crear el generador de PDF**

Crear `src/lib/agents/scan/report-pdf.tsx`:

```tsx
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer"
import type { CategoryCheckResult, ScanEstado } from "@/lib/agents/types"

export interface ScanReportInput {
  target: string
  summary: string
  findings: CategoryCheckResult[]
  generatedAt: Date
}

const ESTADO_COLORS: Record<ScanEstado, { background: string; color: string }> = {
  Aprobado: { background: "#22c55e", color: "#ffffff" },
  Fallido: { background: "#ef4444", color: "#ffffff" },
  Pendiente: { background: "#eab308", color: "#1f2937" },
  "No aplica": { background: "#6b7280", color: "#ffffff" },
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 100,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1f2937",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#030712",
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  brand: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#22d3ee",
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  meta: {
    fontSize: 9,
    color: "#d1d5db",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#030712",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 4,
  },
  summaryText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: "#374151",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 8,
    marginBottom: 6,
  },
  rowMain: {
    flex: 1,
    paddingRight: 8,
  },
  point: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  result: {
    fontSize: 9,
    color: "#4b5563",
    marginBottom: 2,
  },
  evidence: {
    fontSize: 8,
    color: "#6b7280",
    marginBottom: 2,
  },
  recommendation: {
    fontSize: 8,
    color: "#4b5563",
    fontFamily: "Helvetica-Oblique",
  },
  badge: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 3,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    fontSize: 7,
    color: "#9ca3af",
    textAlign: "center",
  },
})

export function ScanReportDocument({ target, summary, findings, generatedAt }: ScanReportInput) {
  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header} fixed>
          <Text style={styles.brand}>AgenticSec</Text>
          <Text style={styles.title}>Reporte de Auditoría de Seguridad</Text>
          <Text style={styles.meta}>Target: {target}</Text>
          <Text style={styles.meta}>
            Generado: {generatedAt.toLocaleString("es-AR", { dateStyle: "long", timeStyle: "short" })}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen Ejecutivo</Text>
          <Text style={styles.summaryText}>{summary}</Text>
        </View>

        {findings.map((cat) => (
          <View key={cat.category} style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>{cat.category}</Text>
            {cat.points.map((p, idx) => (
              <View key={idx} style={styles.row}>
                <View style={styles.rowMain}>
                  <Text style={styles.point}>{p.point}</Text>
                  <Text style={styles.result}>Resultado: {p.result}</Text>
                  <Text style={styles.evidence}>{p.evidence}</Text>
                  <Text style={styles.recommendation}>{p.recommendation}</Text>
                </View>
                <Text
                  style={[
                    styles.badge,
                    {
                      backgroundColor: ESTADO_COLORS[p.estado].background,
                      color: ESTADO_COLORS[p.estado].color,
                    },
                  ]}
                >
                  {p.estado}
                </Text>
              </View>
            ))}
          </View>
        ))}

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `Página ${pageNumber} de ${totalPages} · Este reporte fue generado automáticamente por un agente de IA como apoyo informativo y no reemplaza una auditoría de seguridad profesional completa.`
          }
        />
      </Page>
    </Document>
  )
}

export async function renderScanReportPdf(input: ScanReportInput): Promise<Buffer> {
  return renderToBuffer(<ScanReportDocument {...input} />)
}
```

- [ ] **Step 5: Correr el test para confirmar que pasa**

Run: `npx vitest run src/lib/agents/scan/report-pdf.test.ts`
Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/agents/scan/report-pdf.tsx src/lib/agents/scan/report-pdf.test.ts
git commit -m "feat: add server-side PDF generator for security scan reports"
```

---

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

### Task 3: Botón de descarga en `AgentScanRunner.tsx`

**Files:**
- Modify: `src/components/sections/AgentScanRunner.tsx:1-18` (unificación de tipos), `:48-127` (estado + handlers), `:195-228` (JSX de resultados)

**Interfaces:**
- Consumes: `POST /api/agents/{agent.id}/scan/report` de Task 2 (body `{ target, summary, findings }`, respuesta binaria PDF o JSON de error).
- Produces: nada nuevo para otras tasks — es la punta visible del feature.

- [ ] **Step 1: Unificar los tipos duplicados**

En `src/components/sections/AgentScanRunner.tsx`, reemplazar las líneas 1-18:

```tsx
"use client"

import { useState } from "react"
import { Agent } from "@/lib/agents/types"

interface ScanPoint {
  point: string
  result: string
  severity: string
  evidence: string
  recommendation: string
  estado: "Aprobado" | "Fallido" | "Pendiente" | "No aplica"
}

interface CategoryCheckResult {
  category: string
  points: ScanPoint[]
}
```

por:

```tsx
"use client"

import { useState } from "react"
import { Agent, CategoryCheckResult } from "@/lib/agents/types"
```

- [ ] **Step 2: Agregar el estado de descarga**

En la misma componente, reemplazar la línea:

```tsx
  const [summary, setSummary] = useState("")
```

por:

```tsx
  const [summary, setSummary] = useState("")
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "generating" | "error">("idle")
```

- [ ] **Step 3: Agregar el handler de descarga y resetear el estado en `handleReset`**

Reemplazar la función `handleReset` (líneas 121-127):

```tsx
  const handleReset = () => {
    setFindings(null)
    setSummary("")
    setTarget("")
    setAuthorized(false)
    setStatus(initialStatus())
  }
```

por:

```tsx
  const handleReset = () => {
    setFindings(null)
    setSummary("")
    setTarget("")
    setAuthorized(false)
    setStatus(initialStatus())
    setDownloadStatus("idle")
  }

  const handleDownloadReport = async () => {
    if (!findings) return

    setDownloadStatus("generating")
    try {
      const response = await fetch(`/api/agents/${agent.id}/scan/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, summary, findings }),
      })

      if (!response.ok) {
        setDownloadStatus("error")
        return
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const cleanTarget = target.replace(/^https?:\/\//, "").replace(/[^a-zA-Z0-9.-]/g, "-")
      const link = document.createElement("a")
      link.href = url
      link.download = `reporte-seguridad-${cleanTarget}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setDownloadStatus("idle")
    } catch (err) {
      console.error("Report download error:", err)
      setDownloadStatus("error")
    }
  }
```

- [ ] **Step 4: Agregar el botón en el bloque de resultados**

Reemplazar el inicio del bloque de resultados (líneas 195-197):

```tsx
      {findings && (
        <div className="space-y-6">
          <div className="text-gray-200 leading-relaxed whitespace-pre-line">{summary}</div>
```

por:

```tsx
      {findings && (
        <div className="space-y-6">
          <div className="text-gray-200 leading-relaxed whitespace-pre-line">{summary}</div>

          <div>
            <button
              onClick={handleDownloadReport}
              disabled={downloadStatus === "generating"}
              className="px-4 py-2 bg-gray-800 border border-cyan-400 text-cyan-400 font-semibold rounded-lg hover:bg-cyan-400 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {downloadStatus === "generating" ? "Generando PDF..." : "Descargar reporte (PDF)"}
            </button>
            {downloadStatus === "error" && (
              <p className="mt-2 text-sm text-red-400">
                No se pudo generar el PDF. Intentá de nuevo.
              </p>
            )}
          </div>
```

- [ ] **Step 5: Verificar tipos**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sin errores (el `Record<string, string>` de `ESTADO_STYLE` y el resto del archivo siguen siendo compatibles con el `CategoryCheckResult` importado).

- [ ] **Step 6: Correr toda la suite (regresión)**

Run: `npm test`
Expected: PASS — no hay tests de componente para `AgentScanRunner.tsx`, así que esto solo confirma que nada del resto del proyecto se rompió.

- [ ] **Step 7: Verificación manual end-to-end**

1. Levantar el servidor de desarrollo: `npm run dev`
2. Ir a la página del agente "Auditor de Seguridad con IA" (`/agentes/auditor-de-seguridad-con-ia` o el slug correspondiente).
3. Ingresar un dominio de prueba propio (o uno de los targets ya autorizados), tildar la casilla de autorización, y correr la auditoría hasta que termine.
4. Confirmar que aparece el botón "Descargar reporte (PDF)" junto al resumen ejecutivo.
5. Hacer click. Confirmar que el botón pasa a "Generando PDF..." y luego se descarga un archivo `reporte-seguridad-<target>.pdf`.
6. Abrir el PDF descargado y confirmar: header con "AgenticSec" y el target auditado, el resumen ejecutivo, cada categoría con sus checks, y los badges de estado con los mismos colores que se ven en pantalla (verde/rojo/amarillo/gris).
7. Confirmar que el tamaño del archivo descargado es chico (esperado: por debajo de ~100 KB).
8. Simular un error (por ejemplo, cortar la red desde las DevTools antes de hacer click) y confirmar que aparece el mensaje "No se pudo generar el PDF. Intentá de nuevo." sin romper el resto de la pantalla de resultados.

- [ ] **Step 8: Commit**

```bash
git add src/components/sections/AgentScanRunner.tsx
git commit -m "feat: add PDF report download button to the security scan results"
```

---

## Self-Review Notes

- **Spec coverage:** endpoint server-side con `@react-pdf/renderer` (Task 1-2), branding y colores de badges (Task 1), botón solo tras scan en vivo sin historial (Task 3), manejo de errores cliente/servidor (Task 2 step 3 + Task 3 steps 3-4), sin rate limiting nuevo (no agregado, según spec), nombre de archivo sanitizado (Task 2 `sanitizeFilenamePart` + Task 3 `cleanTarget`) — todos los puntos de la spec tienen una task que los cubre.
- **Placeholder scan:** sin TBD/TODO; todos los steps incluyen código completo o un procedimiento manual concreto (Task 3 Step 7).
- **Type consistency:** `ScanReportInput`/`renderScanReportPdf` (Task 1) se consumen sin cambios en Task 2; `CategoryCheckResult` importado de `@/lib/agents/types` es el mismo tipo en los tres archivos tocados.
