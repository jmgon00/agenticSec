import { safeFetch } from "./ssrf-guard"
import type { CategoryCheckResult, ScanPoint } from "@/lib/agents/types"

function point(
  p: string,
  result: string,
  severity: string,
  evidence: string,
  recommendation: string,
  estado: ScanPoint["estado"]
): ScanPoint {
  return { point: p, result, severity, evidence, recommendation, estado }
}

export async function checkHeaders(url: string): Promise<CategoryCheckResult> {
  const response = await safeFetch(url, { method: "GET" })
  const h = response.headers

  const points: ScanPoint[] = [
    h.has("content-security-policy")
      ? point(
          "Content-Security-Policy configurado",
          "Presente",
          "OK",
          h.get("content-security-policy")!,
          "Mantener configuración actual",
          "Aprobado"
        )
      : point(
          "Content-Security-Policy configurado",
          "Ausente",
          "Alto",
          "Header no presente en la respuesta",
          "Definir CSP restrictiva sin unsafe-inline/unsafe-eval",
          "Fallido"
        ),
    h.has("strict-transport-security")
      ? point(
          "Strict-Transport-Security (HSTS) con max-age alto",
          "Presente",
          "OK",
          h.get("strict-transport-security")!,
          "Mantener configuración actual",
          "Aprobado"
        )
      : point(
          "Strict-Transport-Security (HSTS) con max-age alto",
          "Ausente",
          "Medio",
          "Header no presente en la respuesta",
          "Agregar HSTS con max-age >= 6 meses e includeSubDomains",
          "Fallido"
        ),
    h.has("x-frame-options") ||
    (h.get("content-security-policy") || "").includes("frame-ancestors")
      ? point(
          "X-Frame-Options / frame-ancestors presente",
          "Presente",
          "OK",
          h.get("x-frame-options") || "frame-ancestors en CSP",
          "Mantener configuración actual",
          "Aprobado"
        )
      : point(
          "X-Frame-Options / frame-ancestors presente",
          "Ausente",
          "Medio",
          "No hay X-Frame-Options ni frame-ancestors en la CSP",
          "Agregar X-Frame-Options: DENY o frame-ancestors en CSP",
          "Fallido"
        ),
    h.get("x-content-type-options") === "nosniff"
      ? point(
          "X-Content-Type-Options: nosniff",
          "Presente",
          "OK",
          "nosniff",
          "Mantener configuración actual",
          "Aprobado"
        )
      : point(
          "X-Content-Type-Options: nosniff",
          "Ausente",
          "Bajo",
          "Header no presente o distinto de nosniff",
          "Agregar header nosniff",
          "Fallido"
        ),
    h.has("referrer-policy")
      ? point(
          "Referrer-Policy configurado",
          "Presente",
          "OK",
          h.get("referrer-policy")!,
          "Mantener configuración actual",
          "Aprobado"
        )
      : point(
          "Referrer-Policy configurado",
          "Ausente",
          "Bajo",
          "Header no presente en la respuesta",
          "Definir Referrer-Policy (ej: strict-origin-when-cross-origin)",
          "Fallido"
        ),
    h.has("permissions-policy")
      ? point(
          "Permissions-Policy configurado",
          "Presente",
          "OK",
          h.get("permissions-policy")!,
          "Mantener configuración actual",
          "Aprobado"
        )
      : point(
          "Permissions-Policy configurado",
          "Ausente",
          "Bajo",
          "Header no presente en la respuesta",
          "Restringir APIs sensibles del navegador no usadas",
          "Fallido"
        ),
  ]

  return { category: "Headers", points }
}

export async function checkCookies(url: string): Promise<CategoryCheckResult> {
  const response = await safeFetch(url, { method: "GET" })
  const setCookie = response.headers.get("set-cookie")

  if (!setCookie) {
    const noAplica = (p: string) =>
      point(
        p,
        "No aplica",
        "N/A",
        "El sitio no setea cookies de sesión en esta respuesta",
        "Si se agrega autenticación con cookies en el futuro, forzar estos flags desde el diseño",
        "No aplica"
      )
    return {
      category: "Cookies/Auth",
      points: [
        noAplica("Cookies de sesión con flag Secure"),
        noAplica("Cookies de sesión con flag HttpOnly"),
        noAplica("Cookies con SameSite configurado"),
      ],
    }
  }

  const cookieLower = setCookie.toLowerCase()
  const points: ScanPoint[] = [
    cookieLower.includes("secure")
      ? point("Cookies de sesión con flag Secure", "Presente", "OK", setCookie, "Sin acción requerida", "Aprobado")
      : point("Cookies de sesión con flag Secure", "Ausente", "Alto", setCookie, "Forzar flag Secure en todas las cookies de sesión", "Fallido"),
    cookieLower.includes("httponly")
      ? point("Cookies de sesión con flag HttpOnly", "Presente", "OK", setCookie, "Sin acción requerida", "Aprobado")
      : point("Cookies de sesión con flag HttpOnly", "Ausente", "Alto", setCookie, "Forzar flag HttpOnly para evitar robo vía XSS", "Fallido"),
    cookieLower.includes("samesite")
      ? point("Cookies con SameSite configurado", "Presente", "OK", setCookie, "Sin acción requerida", "Aprobado")
      : point("Cookies con SameSite configurado", "Ausente", "Medio", setCookie, "Configurar SameSite=Lax o Strict", "Fallido"),
  ]

  return { category: "Cookies/Auth", points }
}

export async function checkVersionLeak(url: string): Promise<CategoryCheckResult> {
  const response = await safeFetch(url, { method: "GET" })
  const server = response.headers.get("server") || ""
  const poweredBy = response.headers.get("x-powered-by") || ""
  const hasVersionNumber = /\d+\.\d+/.test(`${server} ${poweredBy}`)
  const evidence = `Server: ${server || "(vacío)"}, X-Powered-By: ${poweredBy || "(vacío)"}`

  return {
    category: "Versiones/CVEs",
    points: [
      hasVersionNumber
        ? point(
            "Headers Server/X-Powered-By revelan versión",
            [server, poweredBy].filter(Boolean).join(", "),
            "Bajo",
            evidence,
            "Ocultar o genericar headers de versión del servidor",
            "Fallido"
          )
        : point(
            "Headers Server/X-Powered-By revelan versión",
            [server, poweredBy].filter(Boolean).join(", ") || "No revela versión",
            "OK",
            evidence,
            "Sin acción requerida",
            "Aprobado"
          ),
      point(
        "Versión de CMS/Framework detectada",
        "No determinable con certeza desde fuera",
        "Informativo",
        "Este chequeo automático solo puede fingerprintear por headers públicos",
        "Complementar con una herramienta de fingerprinting si se necesita precisión",
        "Pendiente"
      ),
      point(
        "Plugins/dependencias desactualizadas",
        "No evaluable para un target externo",
        "N/A",
        "Requiere acceso al código fuente del target (ej. npm audit), no disponible en una auditoría externa",
        "Si sos el dueño del sitio, correr npm audit sobre tu propio repositorio",
        "No aplica"
      ),
      point(
        "CVEs conocidas para la versión detectada",
        "No evaluable para un target externo",
        "N/A",
        "Depende de la versión exacta, que no se puede determinar con certeza desde fuera",
        "Complementar con un análisis de código fuente si sos el dueño del sitio",
        "No aplica"
      ),
    ],
  }
}
