import { describe, it, expect } from "vitest"
import { mergeOsintFindings, redactSensitiveValues } from "./osint-search"
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

describe("redactSensitiveValues", () => {
  const findingsWithLeakedPII: CategoryCheckResult[] = [
    {
      category: "Identidad Digital",
      points: [
        {
          point: "Datos personales sensibles (teléfono/DNI/dirección) indexados",
          result: "Se encontró el teléfono 1122334455 indexado",
          severity: "Alto",
          evidence: "El DNI 30111222 aparece en un sitio público junto a Juan Pérez",
          recommendation: "Pedí la desindexación de 1122334455 y 30111222",
          estado: "Fallido",
        },
      ],
    },
  ]

  it("redacts every literal occurrence of the provided sensitive values across all text fields", () => {
    const redacted = redactSensitiveValues(findingsWithLeakedPII, [
      "Juan Pérez",
      "1122334455",
      "30111222",
    ])
    const point = redacted[0].points[0]

    expect(point.result).not.toContain("1122334455")
    expect(point.evidence).not.toContain("30111222")
    expect(point.evidence).not.toContain("Juan Pérez")
    expect(point.recommendation).not.toContain("1122334455")
    expect(point.recommendation).not.toContain("30111222")
    expect(point.result).toContain("[dato redactado]")
  })

  it("returns the findings unchanged when no sensitive values are provided", () => {
    const redacted = redactSensitiveValues(findingsWithLeakedPII, [undefined, undefined, undefined])
    expect(redacted).toBe(findingsWithLeakedPII)
  })

  it("ignores empty/whitespace-only values without throwing", () => {
    const redacted = redactSensitiveValues(findingsWithLeakedPII, ["", "   ", undefined])
    expect(redacted).toBe(findingsWithLeakedPII)
  })
})
