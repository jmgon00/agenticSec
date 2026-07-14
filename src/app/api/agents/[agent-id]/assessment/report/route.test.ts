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
