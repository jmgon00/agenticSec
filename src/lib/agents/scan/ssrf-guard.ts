import { lookup } from "node:dns/promises"

export class UnsafeTargetError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UnsafeTargetError"
  }
}

const MAX_REDIRECTS = 3
const FETCH_TIMEOUT_MS = 8000

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number)
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) {
    return true // malformed — treat as unsafe
  }
  const [a, b] = parts
  if (a === 10) return true // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true // 172.16.0.0/12
  if (a === 192 && b === 168) return true // 192.168.0.0/16
  if (a === 127) return true // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true // 169.254.0.0/16 link-local + cloud metadata (169.254.169.254, 169.254.170.2)
  if (a === 0) return true // 0.0.0.0/8
  return false
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase()
  if (normalized === "::1") return true // loopback
  if (
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  ) {
    return true // fe80::/10 link-local
  }
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true // fc00::/7 unique local
  if (normalized.startsWith("::ffff:")) {
    // IPv4-mapped IPv6 — validate the embedded IPv4 address
    return isPrivateIPv4(normalized.replace("::ffff:", ""))
  }
  return false
}

function isPrivateIP(ip: string): boolean {
  return ip.includes(":") ? isPrivateIPv6(ip) : isPrivateIPv4(ip)
}

export async function assertSafeTarget(
  rawTarget: string
): Promise<{ url: string; hostname: string }> {
  let url: URL
  try {
    url = new URL(rawTarget.includes("://") ? rawTarget : `https://${rawTarget}`)
  } catch {
    throw new UnsafeTargetError("El target no es una URL válida")
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeTargetError("Solo se permiten targets http/https")
  }

  const port = url.port ? Number(url.port) : url.protocol === "https:" ? 443 : 80
  if (port !== 80 && port !== 443) {
    throw new UnsafeTargetError("Solo se permiten los puertos 80 y 443")
  }

  let addresses: { address: string }[]
  try {
    addresses = await lookup(url.hostname, { all: true })
  } catch {
    throw new UnsafeTargetError("No se pudo resolver el dominio")
  }

  if (addresses.length === 0 || addresses.some((a) => isPrivateIP(a.address))) {
    throw new UnsafeTargetError(
      "El target resuelve a una dirección IP privada, local o no permitida"
    )
  }

  return { url: url.toString(), hostname: url.hostname }
}

export async function safeFetch(
  rawUrl: string,
  init: RequestInit = {}
): Promise<Response> {
  let current = rawUrl
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertSafeTarget(current) // re-validate this hop's host/IP before following it

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    let response: Response
    try {
      response = await fetch(current, {
        ...init,
        redirect: "manual",
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeout)
    }

    if (response.status >= 300 && response.status < 400 && response.headers.get("location")) {
      current = new URL(response.headers.get("location")!, current).toString()
      continue
    }

    return response
  }
  throw new UnsafeTargetError("Demasiados redirects")
}
