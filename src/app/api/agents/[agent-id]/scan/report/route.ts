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

    return new Response(new Uint8Array(pdfBuffer), {
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
