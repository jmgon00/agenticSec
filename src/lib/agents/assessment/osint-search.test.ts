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
