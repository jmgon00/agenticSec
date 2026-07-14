import { describe, it, expect } from "vitest"
import { scoreAssessment, computeRiskScore } from "./scoring"
import type { AssessmentAnswers } from "@/lib/agents/types"

const bestCaseAnswers: AssessmentAnswers = {
  identidadBuscasteNombre: "si",
  identidadDatosIndexados: "no",
  identidadPerfilesViejos: "no",
  identidadUsuarioRepetido: "no",
  cuentasMfaEmail: "si",
  cuentasMfaRedes: "si",
  cuentasCantidad: "20_80",
  cuentasRevisoTerceros: "si",
  passwordsGestor: "si",
  passwordsReutiliza: "no",
  passwordsLargas: "si",
  passwordsCambioEmail: "si",
  redesPerfilPublico: "no",
  redesFotosSensibles: "no",
  redesMuestraTrabajo: "no",
  redesGeolocalizacion: "no",
  dispositivosBloqueo: "todos",
  dispositivosCifrado: "si",
  dispositivosActualizados: "si",
  dispositivosAntivirus: "si",
  redRouterProtocolo: "wpa3",
  redPasswordDefault: "si",
  redWpsDesactivado: "si",
  redIotSeparada: "no_tiene_iot",
  ingSocialFechaNacimiento: "no",
  ingSocialPreguntasSeguridad: "no",
  ingSocialDatosFamiliares: "no",
  ingSocialContactosDesconocidos: "no",
}

const worstCaseAnswers: AssessmentAnswers = {
  identidadBuscasteNombre: "no",
  identidadDatosIndexados: "si",
  identidadPerfilesViejos: "si",
  identidadUsuarioRepetido: "si",
  cuentasMfaEmail: "no",
  cuentasMfaRedes: "no",
  cuentasCantidad: "no_se",
  cuentasRevisoTerceros: "no",
  passwordsGestor: "no",
  passwordsReutiliza: "si",
  passwordsLargas: "no",
  passwordsCambioEmail: "no",
  redesPerfilPublico: "si",
  redesFotosSensibles: "si",
  redesMuestraTrabajo: "si",
  redesGeolocalizacion: "si",
  dispositivosBloqueo: "ninguno",
  dispositivosCifrado: "no",
  dispositivosActualizados: "no",
  dispositivosAntivirus: "no",
  redRouterProtocolo: "wep_o_abierta",
  redPasswordDefault: "no",
  redWpsDesactivado: "no",
  redIotSeparada: "si",
  ingSocialFechaNacimiento: "si",
  ingSocialPreguntasSeguridad: "si",
  ingSocialDatosFamiliares: "si",
  ingSocialContactosDesconocidos: "si",
}

describe("scoreAssessment", () => {
  it("returns exactly 7 categories", () => {
    const result = scoreAssessment(bestCaseAnswers)
    expect(result).toHaveLength(7)
    expect(result.map((c) => c.category)).toEqual([
      "Identidad Digital",
      "Cuentas y Autenticación",
      "Contraseñas",
      "Redes Sociales",
      "Dispositivos",
      "Red Doméstica",
      "Ingeniería Social",
    ])
  })

  it("marks every point as Aprobado for the best-case answers (excluding No aplica)", () => {
    const result = scoreAssessment(bestCaseAnswers)
    const points = result.flatMap((c) => c.points)
    expect(points.some((p) => p.estado === "Fallido")).toBe(false)
    expect(points.every((p) => p.estado === "Aprobado" || p.estado === "No aplica")).toBe(true)
  })

  it("marks MFA de email as Fallido/Alto when disabled", () => {
    const result = scoreAssessment(worstCaseAnswers)
    const point = result
      .find((c) => c.category === "Cuentas y Autenticación")!
      .points.find((p) => p.point.includes("MFA") && p.point.includes("email"))
    expect(point?.estado).toBe("Fallido")
    expect(point?.severity).toBe("Alto")
  })

  it("marks reutilización de contraseñas as Fallido/Alto", () => {
    const result = scoreAssessment(worstCaseAnswers)
    const point = result
      .find((c) => c.category === "Contraseñas")!
      .points.find((p) => p.point.includes("Reutil"))
    expect(point?.estado).toBe("Fallido")
    expect(point?.severity).toBe("Alto")
  })

  it("marks router en WEP/abierta como Fallido/Alto", () => {
    const result = scoreAssessment(worstCaseAnswers)
    const point = result
      .find((c) => c.category === "Red Doméstica")!
      .points.find((p) => p.point.includes("protocolo de seguridad"))
    expect(point?.estado).toBe("Fallido")
    expect(point?.severity).toBe("Alto")
  })

  it("marks antivirus como No aplica cuando corresponde", () => {
    const answers = { ...bestCaseAnswers, dispositivosAntivirus: "no_aplica" as const }
    const result = scoreAssessment(answers)
    const point = result
      .find((c) => c.category === "Dispositivos")!
      .points.find((p) => p.point.includes("Antivirus"))
    expect(point?.estado).toBe("No aplica")
  })

  it("marks IoT como No aplica cuando no tiene dispositivos IoT", () => {
    const result = scoreAssessment(bestCaseAnswers)
    const point = result
      .find((c) => c.category === "Red Doméstica")!
      .points.find((p) => p.point.includes("IoT"))
    expect(point?.estado).toBe("No aplica")
  })

  it("marks respuesta 'no_se'/'parcial'/'a_veces' como Pendiente, nunca Fallido ni Aprobado directo", () => {
    const answers: AssessmentAnswers = {
      ...bestCaseAnswers,
      identidadDatosIndexados: "no_se",
      cuentasMfaRedes: "parcial",
      redesFotosSensibles: "a_veces",
    }
    const result = scoreAssessment(answers)
    const points = result.flatMap((c) => c.points)
    const datosIndexados = points.find((p) => p.point.includes("Datos personales sensibles"))
    const mfaRedes = points.find((p) => p.point.includes("MFA") && p.point.includes("redes"))
    const fotos = points.find((p) => p.point.includes("frente de tu casa") || p.point.includes("ubicación"))
    expect(datosIndexados?.estado).toBe("Pendiente")
    expect(mfaRedes?.estado).toBe("Pendiente")
    expect(fotos?.estado).toBe("Pendiente")
  })
})

describe("computeRiskScore", () => {
  it("returns 100 when every applicable point is Aprobado", () => {
    const findings = scoreAssessment(bestCaseAnswers)
    expect(computeRiskScore(findings)).toBe(100)
  })

  it("returns 0 when every applicable point is Fallido", () => {
    const findings = [
      {
        category: "Test",
        points: [
          { point: "a", result: "", severity: "", evidence: "", recommendation: "", estado: "Fallido" as const },
          { point: "b", result: "", severity: "", evidence: "", recommendation: "", estado: "Fallido" as const },
        ],
      },
    ]
    expect(computeRiskScore(findings)).toBe(0)
  })

  it("excludes No aplica points from the denominator", () => {
    const findings = [
      {
        category: "Test",
        points: [
          { point: "a", result: "", severity: "", evidence: "", recommendation: "", estado: "Aprobado" as const },
          { point: "b", result: "", severity: "", evidence: "", recommendation: "", estado: "No aplica" as const },
        ],
      },
    ]
    expect(computeRiskScore(findings)).toBe(100)
  })

  it("weighs Pendiente as half of Aprobado", () => {
    const findings = [
      {
        category: "Test",
        points: [
          { point: "a", result: "", severity: "", evidence: "", recommendation: "", estado: "Aprobado" as const },
          { point: "b", result: "", severity: "", evidence: "", recommendation: "", estado: "Pendiente" as const },
        ],
      },
    ]
    expect(computeRiskScore(findings)).toBe(75)
  })
})
