import Anthropic from "@anthropic-ai/sdk"
import {
  checkHeaders,
  checkTLS,
  checkExposedFiles,
  checkVersionLeak,
  checkCookies,
  checkDNSEmail,
} from "./checks"
import type { CategoryCheckResult } from "@/lib/agents/types"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type ScanProgressEvent =
  | { type: "check_started"; category: string }
  | { type: "check_completed"; category: string; result: CategoryCheckResult }

export interface ScanOutcome {
  findings: CategoryCheckResult[]
  summary: string
}

const TOOLS: Anthropic.Tool[] = [
  {
    name: "check_headers",
    description:
      "Revisa los headers de seguridad HTTP del target (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy). Llamar exactamente una vez.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "check_tls",
    description:
      "Revisa el certificado TLS, la cadena, el protocolo y el cifrado del target. Llamar exactamente una vez.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "check_exposed_files",
    description:
      "Busca archivos y directorios sensibles expuestos (.env, .git, backups, listados de directorio, paneles admin). Llamar exactamente una vez.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "check_version_leak",
    description:
      "Revisa si el target filtra su versión de framework/CMS vía headers públicos. Llamar exactamente una vez.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "check_cookies",
    description:
      "Revisa las cookies que setea el target (flags Secure/HttpOnly/SameSite). Llamar exactamente una vez.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "check_dns_email",
    description:
      "Revisa los registros SPF, DKIM y DMARC del dominio del target. Llamar exactamente una vez.",
    input_schema: { type: "object", properties: {} },
  },
]

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    findings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: { type: "string" },
          points: {
            type: "array",
            items: {
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
            },
          },
        },
        required: ["category", "points"],
        additionalProperties: false,
      },
    },
    summary: { type: "string" },
  },
  required: ["findings", "summary"],
  additionalProperties: false,
} as const

const CATEGORY_LABELS: Record<string, string> = {
  check_headers: "Headers",
  check_tls: "TLS/SSL",
  check_exposed_files: "Archivos Expuestos",
  check_version_leak: "Versiones/CVEs",
  check_cookies: "Cookies/Auth",
  check_dns_email: "DNS/Email",
}

function runCheck(
  toolName: string,
  hostname: string,
  url: string
): Promise<CategoryCheckResult> {
  switch (toolName) {
    case "check_headers":
      return checkHeaders(url)
    case "check_tls":
      return checkTLS(hostname)
    case "check_exposed_files":
      return checkExposedFiles(url)
    case "check_version_leak":
      return checkVersionLeak(url)
    case "check_cookies":
      return checkCookies(url)
    case "check_dns_email":
      return checkDNSEmail(hostname)
    default:
      throw new Error(`Tool desconocida: ${toolName}`)
  }
}

const RUN_TIMEOUT_MS = 250_000

export async function runSecurityScan(
  target: { url: string; hostname: string },
  onProgress: (event: ScanProgressEvent) => void
): Promise<ScanOutcome> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error("La auditoría superó el tiempo máximo permitido"))
    }, RUN_TIMEOUT_MS)
  })

  try {
    return await Promise.race([runSecurityScanInner(target, onProgress), timeoutPromise])
  } finally {
    clearTimeout(timeoutHandle)
  }
}

async function runSecurityScanInner(
  target: { url: string; hostname: string },
  onProgress: (event: ScanProgressEvent) => void
): Promise<ScanOutcome> {
  const model = process.env.SCAN_AGENT_MODEL || "claude-sonnet-5"
  const systemPrompt = `Sos un agente de auditoría de seguridad web. Tu trabajo es auditar ${target.url} llamando cada una de las 6 tools disponibles exactamente una vez, en cualquier orden. Cada tool te devuelve resultados estructurados de una categoría del checklist de auditoría básica. Con esos resultados, escribí un resumen ejecutivo de 2-3 párrafos en español claro para un dueño de PyME sin conocimientos técnicos: explicá el hallazgo principal primero y qué conviene corregir antes. No repitas la lista completa de puntos en el resumen — eso ya se muestra aparte.`

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: `Auditá ${target.url}` },
  ]

  const collectedResults = new Map<string, CategoryCheckResult>()

  const MAX_TOOL_TURNS = 5
  let turn = 0

  while (turn < MAX_TOOL_TURNS) {
    turn++
    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      thinking: { type: "adaptive" },
      tools: TOOLS,
      messages,
    })

    messages.push({ role: "assistant", content: response.content })

    if (response.stop_reason !== "tool_use") {
      break
    }

    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    )
    const toolResults: Anthropic.ToolResultBlockParam[] = []

    for (const block of toolUseBlocks) {
      const category = block.name
      onProgress({ type: "check_started", category })
      try {
        const result = await runCheck(category, target.hostname, target.url)
        onProgress({ type: "check_completed", category, result })
        collectedResults.set(CATEGORY_LABELS[category] ?? category, result)
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        const failedResult: CategoryCheckResult = {
          category: CATEGORY_LABELS[category] ?? category,
          points: [
            {
              point: "Ejecución del check",
              result: "Error durante la ejecución",
              severity: "N/A",
              evidence: message,
              recommendation:
                "Reintentar la auditoría más tarde o revisar manualmente esta categoría",
              estado: "Pendiente",
            },
          ],
        }
        onProgress({ type: "check_completed", category, result: failedResult })
        collectedResults.set(CATEGORY_LABELS[category] ?? category, failedResult)
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(failedResult),
        })
      }
    }

    messages.push({ role: "user", content: toolResults })
  }

  const finalInstructionText =
    "Ya llamaste todas las tools necesarias. Devolveme ahora el resultado final estructurado con findings y summary."

  const lastMessage = messages[messages.length - 1]
  if (lastMessage && lastMessage.role === "user") {
    // The loop exited by hitting MAX_TOOL_TURNS while stop_reason was still
    // "tool_use", so the last message pushed is the tool_results user message.
    // Append to it instead of pushing a second consecutive user message.
    if (Array.isArray(lastMessage.content)) {
      lastMessage.content.push({ type: "text", text: finalInstructionText })
    } else {
      lastMessage.content = [
        { type: "text", text: lastMessage.content },
        { type: "text", text: finalInstructionText },
      ]
    }
  } else {
    messages.push({ role: "user", content: finalInstructionText })
  }

  const finalResponse = await client.messages.create({
    model,
    max_tokens: 8192,
    system: systemPrompt,
    thinking: { type: "adaptive" },
    messages,
    output_config: {
      format: { type: "json_schema", schema: OUTPUT_SCHEMA },
    },
  })

  if (finalResponse.stop_reason === "max_tokens") {
    throw new Error(
      "La respuesta final del agente se truncó (max_tokens); no se pudo generar el reporte completo"
    )
  }

  const textBlock = finalResponse.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text"
  )
  if (!textBlock) {
    throw new Error("El agente no devolvió un resultado final")
  }

  const outcome = JSON.parse(textBlock.text) as ScanOutcome

  const presentCategories = new Set(outcome.findings.map((f) => f.category))
  for (const label of Object.values(CATEGORY_LABELS)) {
    if (!presentCategories.has(label)) {
      const fallback = collectedResults.get(label)
      if (fallback) {
        outcome.findings.push(fallback)
      }
    }
  }

  return outcome
}
