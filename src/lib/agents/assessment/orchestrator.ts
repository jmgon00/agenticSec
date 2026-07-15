import Anthropic from "@anthropic-ai/sdk"
import { scoreAssessment, computeRiskScore } from "./scoring"
import { runOsintSearch, mergeOsintFindings, redactSensitiveValues, type OsintSearchInput } from "./osint-search"
import type { AssessmentAnswers, CategoryCheckResult } from "@/lib/agents/types"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface AssessmentOutcome {
  findings: CategoryCheckResult[]
  summary: string
  riskScore: number
}

export async function runPersonalAssessment(
  answers: AssessmentAnswers,
  osintInput?: OsintSearchInput
): Promise<AssessmentOutcome> {
  let findings = scoreAssessment(answers)

  if (osintInput) {
    const osintPoints = await runOsintSearch(osintInput)
    findings = mergeOsintFindings(findings, osintPoints)
    findings = redactSensitiveValues(findings, [
      osintInput.nombreCompleto,
      osintInput.telefono,
      osintInput.dni,
    ])
  }

  const riskScore = computeRiskScore(findings)

  const model = process.env.SCAN_AGENT_MODEL || "claude-sonnet-5"
  const systemPrompt = `Sos un agente de evaluación de seguridad personal (Personal Security Assessment). Ya se calculó el resultado de las 7 categorías y un puntaje de riesgo global de 0 a 100 (más alto = mejor postura de seguridad). Tu única tarea es escribir un resumen ejecutivo de 2-3 párrafos en español claro, sin jerga técnica, para una persona sin conocimientos de seguridad: interpretá el puntaje global, mencioná primero las categorías con mayor riesgo, y priorizá qué corregir antes. No repitas la lista completa de puntos en el resumen — eso ya se muestra aparte. No inventes datos que no estén en el resultado que te paso.`

  const userMessage = `Puntaje de riesgo global: ${riskScore}/100\n\nResultado por categoría:\n${JSON.stringify(findings, null, 2)}`

  const response = await client.messages.create({
    model,
    max_tokens: 2048,
    system: systemPrompt,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: userMessage }],
  })

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text")
  if (!textBlock) {
    throw new Error("El agente no devolvió un resumen")
  }

  return { findings, summary: textBlock.text, riskScore }
}
