import { safeFetch } from "./ssrf-guard"
import { resolveTxt } from "node:dns/promises"
import tls from "node:tls"
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

const LISTING_CANDIDATES = ["/uploads/", "/assets/", "/images/", "/files/"]

export async function checkExposedFiles(url: string): Promise<CategoryCheckResult> {
  const base = new URL(url)
  const probeStatus = async (path: string) => {
    const target = new URL(path, base).toString()
    const res = await safeFetch(target, { method: "GET" })
    return res.status
  }

  const [envStatus, gitStatus, backupStatus, adminStatus] = await Promise.all([
    probeStatus("/.env"),
    probeStatus("/.git/HEAD"),
    probeStatus("/backup.zip"),
    probeStatus("/admin"),
  ])

  const listingHits = await Promise.all(
    LISTING_CANDIDATES.map(async (path) => {
      const target = new URL(path, base).toString()
      const res = await safeFetch(target, { method: "GET" })
      if (res.status !== 200) return null
      const body = await res.text()
      return body.includes("Index of") ? path : null
    })
  )
  const openListingPath = listingHits.find((p) => p !== null) ?? null

  const points: ScanPoint[] = [
    envStatus === 404
      ? point(".env accesible públicamente", "404", "OK", `GET /.env -> ${envStatus}`, "Sin acción requerida", "Aprobado")
      : point(".env accesible públicamente", `HTTP ${envStatus}`, "Alto", `GET /.env -> ${envStatus}`, "Bloquear acceso a /.env vía servidor web", "Fallido"),
    gitStatus === 404
      ? point(".git/ accesible públicamente", "404", "OK", `GET /.git/HEAD -> ${gitStatus}`, "Sin acción requerida", "Aprobado")
      : point(".git/ accesible públicamente", `HTTP ${gitStatus}`, "Alto", `GET /.git/HEAD -> ${gitStatus}`, "Bloquear acceso a /.git en la configuración del servidor", "Fallido"),
    backupStatus === 404
      ? point("Backups expuestos (.zip, .sql, .bak)", "404", "OK", `GET /backup.zip -> ${backupStatus}`, "Sin acción requerida", "Aprobado")
      : point("Backups expuestos (.zip, .sql, .bak)", `HTTP ${backupStatus}`, "Medio", `GET /backup.zip -> ${backupStatus}`, "Eliminar o mover backups fuera del directorio público", "Pendiente"),
    openListingPath === null
      ? point("Listado de directorios abierto", "No detectado", "OK", `Rutas probadas: ${LISTING_CANDIDATES.join(", ")}`, "Sin acción requerida", "Aprobado")
      : point("Listado de directorios abierto", `Detectado en ${openListingPath}`, "Medio", `GET ${openListingPath} devuelve un listado de tipo autoindex`, "Deshabilitar autoindex en el servidor web", "Fallido"),
    adminStatus === 404
      ? point("Paneles de administración expuestos sin protección", "404", "OK", `GET /admin -> ${adminStatus}`, "Sin acción requerida", "Aprobado")
      : point("Paneles de administración expuestos sin protección", `HTTP ${adminStatus}`, "Medio", `GET /admin -> ${adminStatus}`, "Restringir por IP o agregar autenticación adicional", "Pendiente"),
  ]

  return { category: "Archivos Expuestos", points }
}

async function resolveTxtSafe(name: string): Promise<string[]> {
  try {
    const records = await resolveTxt(name)
    return records.map((r) => r.join(""))
  } catch {
    return []
  }
}

export async function checkDNSEmail(hostname: string): Promise<CategoryCheckResult> {
  const rootRecords = await resolveTxtSafe(hostname)
  const spf = rootRecords.find((r) => r.startsWith("v=spf1"))

  const dkimRecords = await resolveTxtSafe(`default._domainkey.${hostname}`)

  const dmarcRecords = await resolveTxtSafe(`_dmarc.${hostname}`)
  const dmarc = dmarcRecords.find((r) => r.startsWith("v=DMARC1"))

  const points: ScanPoint[] = [
    spf
      ? point(
          "Registro SPF presente y estricto (-all)",
          spf.includes("-all") ? "Presente, estricto" : "Presente, no estricto",
          spf.includes("-all") ? "OK" : "Medio",
          spf,
          "Configurar SPF terminando en -all",
          spf.includes("-all") ? "Aprobado" : "Fallido"
        )
      : point(
          "Registro SPF presente y estricto (-all)",
          "Ausente",
          "N/A",
          "Sin dominio propio con email configurado o sin registro SPF",
          "Configurar SPF cuando se agregue envío de email propio",
          "No aplica"
        ),
    dkimRecords.length > 0
      ? point(
          "Registro DKIM configurado",
          "Presente",
          "OK",
          dkimRecords.join(" "),
          "Sin acción requerida",
          "Aprobado"
        )
      : point(
          "Registro DKIM configurado",
          "No detectado en selector 'default'",
          "N/A",
          "Sin registro en default._domainkey — el selector real puede ser otro",
          "Verificar el selector DKIM real si se envía email desde este dominio",
          "No aplica"
        ),
    dmarc
      ? point(
          "Registro DMARC con policy quarantine/reject",
          dmarc,
          dmarc.includes("p=reject") || dmarc.includes("p=quarantine") ? "OK" : "Medio",
          dmarc,
          "Configurar DMARC con policy quarantine o reject",
          dmarc.includes("p=reject") || dmarc.includes("p=quarantine") ? "Aprobado" : "Fallido"
        )
      : point(
          "Registro DMARC con policy quarantine/reject",
          "Ausente",
          "N/A",
          "Sin registro en _dmarc",
          "Configurar DMARC cuando se agregue envío de email propio",
          "No aplica"
        ),
  ]

  return { category: "DNS/Email", points }
}

export function checkTLS(hostname: string): Promise<CategoryCheckResult> {
  return new Promise((resolve) => {
    const socket = tls.connect({ host: hostname, port: 443, servername: hostname, timeout: 8000 })

    socket.on("secureConnect", () => {
      const points: ScanPoint[] = []
      const cert = socket.getPeerCertificate(true)
      const now = new Date()
      const validFrom = new Date(cert.valid_from)
      const validTo = new Date(cert.valid_to)
      const isValid = now >= validFrom && now <= validTo

      points.push(
        isValid
          ? point(
              "Certificado válido y no expirado",
              "Válido",
              "OK",
              `${cert.subject?.CN || hostname}, vence ${cert.valid_to}`,
              "Vercel/el proveedor renueva automáticamente, sin acción requerida",
              "Aprobado"
            )
          : point(
              "Certificado válido y no expirado",
              "Inválido o expirado",
              "Alto",
              `valid_from=${cert.valid_from}, valid_to=${cert.valid_to}`,
              "Renovar el certificado",
              "Fallido"
            )
      )

      let chainLength = 0
      let current = cert
      const seen = new Set<string>()
      while (current && current.fingerprint && !seen.has(current.fingerprint)) {
        seen.add(current.fingerprint)
        chainLength++
        current = current.issuerCertificate as typeof cert
      }
      points.push(
        chainLength >= 2
          ? point(
              "Cadena de certificados completa",
              `${chainLength} certificados`,
              "OK",
              `Cadena de ${chainLength} certificados`,
              "Sin acción requerida",
              "Aprobado"
            )
          : point(
              "Cadena de certificados completa",
              `${chainLength} certificado(s)`,
              "Medio",
              `Cadena de ${chainLength} certificado(s)`,
              "Verificar que el servidor envíe los certificados intermedios",
              "Pendiente"
            )
      )

      const protocol = socket.getProtocol() || "desconocido"
      points.push(
        protocol === "TLSv1.3" || protocol === "TLSv1.2"
          ? point(
              "Sin protocolos obsoletos (SSLv3, TLS 1.0/1.1)",
              protocol,
              "OK",
              `Protocolo negociado: ${protocol}`,
              "Sin acción requerida",
              "Aprobado"
            )
          : point(
              "Sin protocolos obsoletos (SSLv3, TLS 1.0/1.1)",
              protocol,
              "Alto",
              `Protocolo negociado: ${protocol}`,
              "Deshabilitar protocolos obsoletos, dejar solo TLS 1.2+",
              "Fallido"
            )
      )

      const cipher = socket.getCipher()
      const weak = /rc4|3des|null|export/i.test(cipher?.name || "")
      points.push(
        !weak
          ? point(
              "Cifrados fuertes (sin RC4/3DES, con PFS)",
              cipher?.name || "desconocido",
              "OK",
              `Cipher: ${cipher?.name}`,
              "Sin acción requerida",
              "Aprobado"
            )
          : point(
              "Cifrados fuertes (sin RC4/3DES, con PFS)",
              cipher?.name || "desconocido",
              "Alto",
              `Cipher: ${cipher?.name}`,
              "Eliminar cifrados débiles de la configuración del servidor",
              "Fallido"
            )
      )

      points.push(
        point(
          "Grade general en Qualys SSL Labs",
          "No evaluado",
          "N/A",
          "El grade de SSL Labs no se corre en este flujo automático (limitación de la API externa)",
          "Verificar manualmente en ssllabs.com/ssltest",
          "No aplica"
        )
      )

      socket.end()
      resolve({ category: "TLS/SSL", points })
    })

    const fail = (evidence: string) => {
      resolve({
        category: "TLS/SSL",
        points: [
          point(
            "Certificado válido y no expirado",
            "No se pudo evaluar",
            "Alto",
            evidence,
            "Verificar que el servidor acepte conexiones HTTPS en el puerto 443",
            "Pendiente"
          ),
        ],
      })
    }

    socket.on("error", () => fail("No fue posible establecer conexión TLS"))
    socket.on("timeout", () => {
      socket.destroy()
      fail("La conexión TLS no respondió a tiempo")
    })
  })
}
