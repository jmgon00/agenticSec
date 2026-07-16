import Anthropic from "@anthropic-ai/sdk"
import type { CategoryCheckResult, ScanPoint } from "@/lib/agents/types"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface OsintSearchInput {
  nombreCompleto: string
  telefono?: string
  dni?: string
}

const SCAN_POINT_SCHEMA = {
  type: "object",
  properties: {
    point: { type: "string" },
    result: { type: "string" },
    severity: { type: "string" },
    evidence: { type: "string" },
    recommendation: { type: "string" },
    estado: {
      type: "string",
      enum: ["Aprobado", "Fallido", "Pendiente", "No aplica"],
    },
  },
  required: ["point", "result", "severity", "evidence", "recommendation", "estado"],
  additionalProperties: false,
} as const

// Anthropic's structured-output schema validator rejects array `minItems`/`maxItems`
// values other than 0 or 1, so "exactly 3 points" can't be expressed as an array bound.
// Three fixed named properties (each required) achieve the same guarantee instead.
const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    revisasteInformacion: SCAN_POINT_SCHEMA,
    datosSensibles: SCAN_POINT_SCHEMA,
    perfilesAbandonados: SCAN_POINT_SCHEMA,
  },
  required: ["revisasteInformacion", "datosSensibles", "perfilesAbandonados"],
  additionalProperties: false,
} as const

export function mergeOsintFindings(
  findings: CategoryCheckResult[],
  osintPoints: ScanPoint[]
): CategoryCheckResult[] {
  return findings.map((category) => {
    if (category.category !== "Identidad Digital") return category
    const usuarioRepetido = category.points[3]
    return { ...category, points: [...osintPoints, usuarioRepetido] }
  })
}

/**
 * Defense-in-depth: strips any literal, exact-match occurrence of the
 * provided sensitive values (name/phone/DNI) from findings text fields,
 * on top of the prompt-level instruction in runOsintSearch. Guards against
 * the model echoing raw PII into evidence/result/recommendation despite
 * being told not to, before findings are persisted or summarized.
 */
export function redactSensitiveValues(
  findings: CategoryCheckResult[],
  sensitiveValues: (string | undefined)[]
): CategoryCheckResult[] {
  const needles = sensitiveValues.filter(
    (v): v is string => typeof v === "string" && v.trim().length > 0
  )
  if (needles.length === 0) return findings

  const redact = (text: string): string =>
    needles.reduce((acc, needle) => acc.split(needle).join("[dato redactado]"), text)

  return findings.map((category) => ({
    ...category,
    points: category.points.map((p) => ({
      ...p,
      result: redact(p.result),
      evidence: redact(p.evidence),
      recommendation: redact(p.recommendation),
    })),
  }))
}

/**
 * True when every web_search attempt in the response errored out (e.g. rate limit,
 * max_uses exceeded) and none returned real results — i.e. the search tool produced
 * nothing usable, as opposed to a normal response that just found little/nothing.
 * Kept separate from runOsintSearch so this detection logic is unit-testable without
 * a live API call.
 */
export function searchFailedCompletely(content: Anthropic.ContentBlock[]): boolean {
  const resultBlocks = content.filter(
    (b): b is Anthropic.WebSearchToolResultBlock => b.type === "web_search_tool_result"
  )
  const gotRealResults = resultBlocks.some((b) => Array.isArray(b.content))
  return resultBlocks.length > 0 && !gotRealResults
}

export async function runOsintSearch(input: OsintSearchInput): Promise<ScanPoint[] | null> {
  const model = process.env.SCAN_AGENT_MODEL || "claude-sonnet-5"

  const dataLines = [
    `Nombre completo: ${input.nombreCompleto}`,
    input.telefono ? `Teléfono: ${input.telefono}` : null,
    input.dni ? `DNI: ${input.dni}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n")

  const searchSystemPrompt = `Sos un asistente de seguridad personal investigando, con autorización explícita de la propia persona, qué información pública existe sobre ella en internet. Buscá por su nombre completo (y teléfono/DNI si se proveen) para averiguar: (1) qué resultados aparecen al buscar su nombre, (2) si su teléfono o DNI aparecen indexados en algún sitio público, (3) si existen perfiles de redes sociales antiguos o abandonados asociados a su nombre. Reportá tus hallazgos en texto libre, describiendo qué encontraste sin necesidad de citar URLs exactas.`

  const searchResponse = await client.messages.create({
    model,
    max_tokens: 4096,
    system: searchSystemPrompt,
    thinking: { type: "adaptive" },
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }],
    messages: [
      { role: "user", content: `Investigá la exposición pública de esta persona:\n${dataLines}` },
    ],
  })

  if (searchFailedCompletely(searchResponse.content)) {
    const errorCodes = searchResponse.content
      .filter((b): b is Anthropic.WebSearchToolResultBlock => b.type === "web_search_tool_result")
      .map((b) => (Array.isArray(b.content) ? null : b.content.error_code))
      .filter((code): code is Anthropic.WebSearchToolResultErrorCode => code !== null)
    console.error("[runOsintSearch] web_search tool failed on every attempt:", errorCodes)
    return null
  }

  const searchFindings = searchResponse.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n\n")

  const structureSystemPrompt = `Tenés los hallazgos de una búsqueda de exposición pública sobre una persona. Tu tarea es traducir esos hallazgos a exactamente 3 puntos de control, uno por cada uno de estos campos:
- "revisasteInformacion" → point: "Revisaste qué información pública existe sobre vos" — dado que la búsqueda ya se hizo automáticamente, marcá esto como "Aprobado" salvo que la búsqueda haya fallado por completo.
- "datosSensibles" → point: "Datos personales sensibles (teléfono/DNI/dirección) indexados" — "Fallido" si se encontró el teléfono, DNI o dirección indexados públicamente; "Aprobado" si no se encontró nada; "Pendiente" si la búsqueda fue inconclusa.
- "perfilesAbandonados" → point: "Perfiles abandonados que siguen activos/públicos" — "Fallido" si se detectaron perfiles viejos/abandonados públicos; "Aprobado" si no se detectó ninguno; "Pendiente" si fue inconcluso.

IMPORTANTE: en el campo "evidence" de cada punto, describí el hallazgo en términos generales — NUNCA repitas textualmente el teléfono, DNI o dirección encontrados. Por ejemplo, escribí "se encontró tu dirección publicada en un sitio público" en vez de citar la dirección real.`

  const structureResponse = await client.messages.create({
    model,
    max_tokens: 2048,
    system: structureSystemPrompt,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: `Hallazgos de la búsqueda:\n${searchFindings}` }],
    output_config: {
      format: { type: "json_schema", schema: OUTPUT_SCHEMA },
    },
  })

  const textBlock = structureResponse.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text"
  )
  if (!textBlock) {
    throw new Error("No se pudo estructurar el resultado de la búsqueda")
  }

  const parsed = JSON.parse(textBlock.text) as {
    revisasteInformacion: ScanPoint
    datosSensibles: ScanPoint
    perfilesAbandonados: ScanPoint
  }
  return [parsed.revisasteInformacion, parsed.datosSensibles, parsed.perfilesAbandonados]
}
