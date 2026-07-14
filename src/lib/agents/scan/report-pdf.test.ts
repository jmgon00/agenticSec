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
