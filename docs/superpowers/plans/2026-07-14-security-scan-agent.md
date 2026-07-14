# AI Security Scan Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a new `/agents` entry, type `"scan"`, where a visitor enters a domain they're authorized to test and a Claude-orchestrated agent runs the 28-point Auditoría Básica checklist live against it — real network checks, streamed progress, a findings table, and an AI-written executive summary.

**Architecture:** Deterministic Node-native check functions (headers/TLS/files/version-leak/cookies/DNS via `fetch`, `node:tls`, `node:dns/promises` — no shell-out) sit behind an SSRF guard. A Claude tool-use loop (Messages API, manual loop, Sonnet 5) calls each check exactly once, interprets results, and produces a structured final report via `output_config.format`. A Next.js Route Handler streams progress over SSE; a new React component renders it live, then the findings table.

**Tech Stack:** Next.js 16 (App Router, Route Handlers), Prisma 6 + PostgreSQL, `@anthropic-ai/sdk` ^0.110.0, Vitest (new), Tailwind CSS 4.

## Global Constraints

- Scope is fixed to the existing Auditoría Básica checklist (domain/URL input, 6 categories, 28 points) — no IP/port scanning. See spec `docs/superpowers/specs/2026-07-14-security-scan-agent-design.md` §1.
- SSRF guard is mandatory on every network check — no check function may call `fetch`/`tls.connect` without going through `assertSafeTarget`/`safeFetch` first.
- No shelling out to `curl`/`openssl`/`nslookup` — use Node's built-in `fetch`, `node:tls`, `node:dns/promises` only.
- Model: `claude-sonnet-5`, configurable via `SCAN_AGENT_MODEL` env var. Adaptive thinking (`thinking: {type: "adaptive"}`). No deprecated params (`budget_tokens`, `temperature`/`top_p`/`top_k`, `output_format`).
- V1 has no shareable report page and no scan-history UI — findings render inline in the agent page only (spec §1, §6).
- Authorization checkbox (`authorized: true`) is required server-side before any network check runs, and is persisted with a timestamp as an audit trail.
- Follow existing code style: `"use client"` function components with named exports, Tailwind utility classes matching the existing cyan/magenta dark theme, `NextRequest`/`{ params }: { params: Promise<...> }` route handler signature (Next.js 16 breaking change already in use elsewhere in this repo).

---

## File Structure

| File | Responsibility |
|---|---|
| `vitest.config.ts` (new) | Test runner config with `@/*` path alias matching `tsconfig.json` |
| `package.json` (modify) | Add `vitest` devDependency + `"test"` script |
| `.env.example` (modify) | Document `ANTHROPIC_API_KEY` (pre-existing gap) and new `SCAN_AGENT_MODEL` |
| `prisma/schema.prisma` (modify) | Add `SecurityScanRun` model, update `Agent.type` doc comment |
| `src/lib/agents/types.ts` (modify) | Add `ScanEstado`, `ScanPoint`, `CategoryCheckResult` types; extend `Agent.type` union |
| `src/lib/agents/scan/ssrf-guard.ts` (new) | `assertSafeTarget`, `safeFetch`, `UnsafeTargetError` — the network safety boundary, reused by every check |
| `src/lib/agents/scan/checks.ts` (new) | The 6 deterministic check functions |
| `src/lib/agents/scan/orchestrator.ts` (new) | Claude tool-use loop that calls the 6 checks and produces the final structured report |
| `src/app/api/agents/[agent-id]/scan/stream/route.ts` (new) | SSE streaming endpoint |
| `src/components/sections/AgentScanRunner.tsx` (new) | Frontend: form → live progress → findings table |
| `src/components/sections/AgentDetail.tsx` (modify) | Add `type === "scan"` branch |
| `src/components/sections/AgentCard.tsx` (modify) | Add `"scan"` to the type-label switch |
| `src/content/agents.ts` + `prisma/seed.ts` (modify) | New `SEED_AGENTS` entry, `type: "scan"` |

---

### Task 1: Test tooling and env docs

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: `npm run test` command, available to every later task.

- [ ] **Step 1: Add Vitest as a dev dependency**

```bash
cd "E:\Cloude projects\interactiv3Web"
npm install -D vitest
```

- [ ] **Step 2: Add the test script to `package.json`**

Edit `package.json` `scripts` block to add:

```json
    "test": "vitest run",
```

(Insert after the `"lint"` line, keeping the rest of the file unchanged.)

- [ ] **Step 3: Create `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 4: Verify the test runner works with a throwaway test**

Create `src/lib/agents/scan/.setup-check.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("vitest setup", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `npm run test`
Expected: 1 passed test.

Delete `src/lib/agents/scan/.setup-check.test.ts` once confirmed — it was only to verify the runner works.

- [ ] **Step 5: Document `ANTHROPIC_API_KEY` and `SCAN_AGENT_MODEL` in `.env.example`**

Add to `.env.example` (after the `# API Security` block):

```
# Claude API (used by all chat/form/scan agents)
ANTHROPIC_API_KEY="sk-ant-..."

# Optional: override the model used by the security scan agent (defaults to claude-sonnet-5)
SCAN_AGENT_MODEL="claude-sonnet-5"
```

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts .env.example
git commit -m "chore: add Vitest test runner and document ANTHROPIC_API_KEY"
```

---

### Task 2: Shared scan types

**Files:**
- Modify: `src/lib/agents/types.ts`

**Interfaces:**
- Produces: `ScanEstado`, `ScanPoint`, `CategoryCheckResult` — consumed by every check function (Task 4-7), the orchestrator (Task 9), the API route (Task 10), and the frontend (Task 11).
- Produces: `Agent.type` now includes `"scan"`.

- [ ] **Step 1: Extend the `Agent.type` union and add the scan result types**

In `src/lib/agents/types.ts`, change line 8:

```typescript
  type: "chat" | "form" | "link"
```
to:
```typescript
  type: "chat" | "form" | "link" | "scan"
```

Then append these new exported types at the end of the file:

```typescript
export type ScanEstado = "Aprobado" | "Fallido" | "Pendiente" | "No aplica"

export interface ScanPoint {
  point: string
  result: string
  severity: string
  evidence: string
  recommendation: string
  estado: ScanEstado
}

export interface CategoryCheckResult {
  category: string
  points: ScanPoint[]
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no new errors (pre-existing errors, if any, are unrelated — only confirm nothing new appears referencing `types.ts`).

- [ ] **Step 3: Commit**

```bash
git add src/lib/agents/types.ts
git commit -m "feat: add scan agent types and extend Agent.type union"
```

---

### Task 3: SSRF guard

**Files:**
- Create: `src/lib/agents/scan/ssrf-guard.ts`
- Test: `src/lib/agents/scan/ssrf-guard.test.ts`

**Interfaces:**
- Consumes: nothing (uses only `node:dns/promises` and global `fetch`).
- Produces: `assertSafeTarget(rawTarget: string): Promise<{ url: string; hostname: string }>`, `safeFetch(rawUrl: string, init?: RequestInit): Promise<Response>`, `class UnsafeTargetError extends Error`. All three are consumed by Tasks 4-7 (checks) and Task 10 (API route).

- [ ] **Step 1: Write the failing tests**

Create `src/lib/agents/scan/ssrf-guard.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(),
}));

import { lookup } from "node:dns/promises";
import { assertSafeTarget, UnsafeTargetError } from "./ssrf-guard";

describe("assertSafeTarget", () => {
  beforeEach(() => {
    vi.mocked(lookup).mockReset();
  });

  it("rejects a target that resolves to a private IPv4 address", async () => {
    vi.mocked(lookup).mockResolvedValue([
      { address: "10.0.0.5", family: 4 },
    ] as any);
    await expect(assertSafeTarget("internal.example.com")).rejects.toThrow(
      UnsafeTargetError
    );
  });

  it("rejects loopback", async () => {
    vi.mocked(lookup).mockResolvedValue([
      { address: "127.0.0.1", family: 4 },
    ] as any);
    await expect(assertSafeTarget("localhost")).rejects.toThrow(
      UnsafeTargetError
    );
  });

  it("rejects the cloud metadata IP", async () => {
    vi.mocked(lookup).mockResolvedValue([
      { address: "169.254.169.254", family: 4 },
    ] as any);
    await expect(assertSafeTarget("metadata.example.com")).rejects.toThrow(
      UnsafeTargetError
    );
  });

  it("rejects IPv6 loopback", async () => {
    vi.mocked(lookup).mockResolvedValue([
      { address: "::1", family: 6 },
    ] as any);
    await expect(assertSafeTarget("v6local.example.com")).rejects.toThrow(
      UnsafeTargetError
    );
  });

  it("accepts a public IPv4 address over https", async () => {
    vi.mocked(lookup).mockResolvedValue([
      { address: "93.184.216.34", family: 4 },
    ] as any);
    const result = await assertSafeTarget("example.com");
    expect(result.hostname).toBe("example.com");
    expect(result.url).toBe("https://example.com/");
  });

  it("defaults to https when no scheme is given", async () => {
    vi.mocked(lookup).mockResolvedValue([
      { address: "93.184.216.34", family: 4 },
    ] as any);
    const result = await assertSafeTarget("example.com");
    expect(result.url.startsWith("https://")).toBe(true);
  });

  it("rejects a non-http(s) scheme", async () => {
    await expect(assertSafeTarget("ftp://example.com")).rejects.toThrow(
      UnsafeTargetError
    );
  });

  it("rejects a disallowed port", async () => {
    await expect(
      assertSafeTarget("https://example.com:8080")
    ).rejects.toThrow(UnsafeTargetError);
  });

  it("rejects when DNS resolution fails", async () => {
    vi.mocked(lookup).mockRejectedValue(new Error("ENOTFOUND"));
    await expect(assertSafeTarget("nonexistent.invalid")).rejects.toThrow(
      UnsafeTargetError
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- ssrf-guard`
Expected: FAIL — `./ssrf-guard` module doesn't exist yet.

- [ ] **Step 3: Implement `ssrf-guard.ts`**

Create `src/lib/agents/scan/ssrf-guard.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- ssrf-guard`
Expected: PASS — all 9 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/agents/scan/ssrf-guard.ts src/lib/agents/scan/ssrf-guard.test.ts
git commit -m "feat: add SSRF guard for scan agent network checks"
```

---

### Task 4: Check functions — Headers, Cookies, Version leak

**Files:**
- Create: `src/lib/agents/scan/checks.ts`
- Test: `src/lib/agents/scan/checks.test.ts`

**Interfaces:**
- Consumes: `safeFetch` from `./ssrf-guard` (Task 3), `CategoryCheckResult`/`ScanPoint` from `@/lib/agents/types` (Task 2).
- Produces: `checkHeaders(url: string): Promise<CategoryCheckResult>`, `checkCookies(url: string): Promise<CategoryCheckResult>`, `checkVersionLeak(url: string): Promise<CategoryCheckResult>`. Consumed by the orchestrator (Task 9).

- [ ] **Step 1: Write the failing tests**

Create `src/lib/agents/scan/checks.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./ssrf-guard", () => ({
  safeFetch: vi.fn(),
}));

import { safeFetch } from "./ssrf-guard";
import { checkHeaders, checkCookies, checkVersionLeak } from "./checks";

function mockResponse(
  headers: Record<string, string>,
  status = 200,
  body = ""
): Response {
  const lower = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
  );
  return {
    status,
    headers: {
      get: (k: string) => lower[k.toLowerCase()] ?? null,
      has: (k: string) => k.toLowerCase() in lower,
    },
    text: async () => body,
  } as unknown as Response;
}

describe("checkHeaders", () => {
  beforeEach(() => vi.mocked(safeFetch).mockReset());

  it("marks CSP as Fallido when the header is absent", async () => {
    vi.mocked(safeFetch).mockResolvedValue(mockResponse({}));
    const result = await checkHeaders("https://example.com");
    const csp = result.points.find((p) =>
      p.point.includes("Content-Security-Policy")
    );
    expect(csp?.estado).toBe("Fallido");
  });

  it("marks CSP as Aprobado when the header is present", async () => {
    vi.mocked(safeFetch).mockResolvedValue(
      mockResponse({ "content-security-policy": "default-src 'self'" })
    );
    const result = await checkHeaders("https://example.com");
    const csp = result.points.find((p) =>
      p.point.includes("Content-Security-Policy")
    );
    expect(csp?.estado).toBe("Aprobado");
  });

  it("returns all 6 header points", async () => {
    vi.mocked(safeFetch).mockResolvedValue(mockResponse({}));
    const result = await checkHeaders("https://example.com");
    expect(result.category).toBe("Headers");
    expect(result.points).toHaveLength(6);
  });
});

describe("checkCookies", () => {
  beforeEach(() => vi.mocked(safeFetch).mockReset());

  it("marks all cookie points as No aplica when no cookie is set", async () => {
    vi.mocked(safeFetch).mockResolvedValue(mockResponse({}));
    const result = await checkCookies("https://example.com");
    expect(result.points.every((p) => p.estado === "No aplica")).toBe(true);
  });

  it("marks Secure as Fallido when the cookie lacks the flag", async () => {
    vi.mocked(safeFetch).mockResolvedValue(
      mockResponse({ "set-cookie": "session=abc; HttpOnly" })
    );
    const result = await checkCookies("https://example.com");
    const secure = result.points.find((p) => p.point.includes("Secure"));
    expect(secure?.estado).toBe("Fallido");
  });

  it("marks all flags Aprobado when the cookie has Secure, HttpOnly and SameSite", async () => {
    vi.mocked(safeFetch).mockResolvedValue(
      mockResponse({
        "set-cookie": "session=abc; Secure; HttpOnly; SameSite=Strict",
      })
    );
    const result = await checkCookies("https://example.com");
    expect(result.points.every((p) => p.estado === "Aprobado")).toBe(true);
  });
});

describe("checkVersionLeak", () => {
  beforeEach(() => vi.mocked(safeFetch).mockReset());

  it("flags a Server header containing a version number", async () => {
    vi.mocked(safeFetch).mockResolvedValue(
      mockResponse({ server: "nginx/1.18.0" })
    );
    const result = await checkVersionLeak("https://example.com");
    const serverPoint = result.points.find((p) =>
      p.point.includes("Server/X-Powered-By")
    );
    expect(serverPoint?.estado).toBe("Fallido");
  });

  it("approves a generic Server header", async () => {
    vi.mocked(safeFetch).mockResolvedValue(mockResponse({ server: "Vercel" }));
    const result = await checkVersionLeak("https://example.com");
    const serverPoint = result.points.find((p) =>
      p.point.includes("Server/X-Powered-By")
    );
    expect(serverPoint?.estado).toBe("Aprobado");
  });

  it("returns all 4 versions/CVEs points", async () => {
    vi.mocked(safeFetch).mockResolvedValue(mockResponse({ server: "Vercel" }));
    const result = await checkVersionLeak("https://example.com");
    expect(result.category).toBe("Versiones/CVEs");
    expect(result.points).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- checks`
Expected: FAIL — `./checks` module doesn't exist yet.

- [ ] **Step 3: Implement `checks.ts` (Headers, Cookies, Version leak sections)**

Create `src/lib/agents/scan/checks.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- checks`
Expected: PASS — all 9 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/agents/scan/checks.ts src/lib/agents/scan/checks.test.ts
git commit -m "feat: add headers, cookies and version-leak scan checks"
```

---

### Task 5: Check function — Exposed files

**Files:**
- Modify: `src/lib/agents/scan/checks.ts`
- Modify: `src/lib/agents/scan/checks.test.ts`

**Interfaces:**
- Consumes: `safeFetch` from `./ssrf-guard` (Task 3).
- Produces: `checkExposedFiles(url: string): Promise<CategoryCheckResult>`. Consumed by the orchestrator (Task 9).

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/agents/scan/checks.test.ts`:

```typescript
import { checkExposedFiles } from "./checks";

describe("checkExposedFiles", () => {
  beforeEach(() => vi.mocked(safeFetch).mockReset());

  it("approves .env, .git and backups when everything 404s", async () => {
    vi.mocked(safeFetch).mockImplementation(async () => mockResponse({}, 404));
    const result = await checkExposedFiles("https://example.com");
    const env = result.points.find((p) => p.point.startsWith(".env"));
    const git = result.points.find((p) => p.point.startsWith(".git"));
    expect(env?.estado).toBe("Aprobado");
    expect(git?.estado).toBe("Aprobado");
  });

  it("flags .env when it returns 200", async () => {
    vi.mocked(safeFetch).mockImplementation(async (url: string) => {
      if (url.endsWith("/.env")) return mockResponse({}, 200);
      return mockResponse({}, 404);
    });
    const result = await checkExposedFiles("https://example.com");
    const env = result.points.find((p) => p.point.startsWith(".env"));
    expect(env?.estado).toBe("Fallido");
  });

  it("flags directory listing when an autoindex page is found", async () => {
    vi.mocked(safeFetch).mockImplementation(async (url: string) => {
      if (url.includes("/uploads/")) {
        return mockResponse({}, 200, "<html><body>Index of /uploads</body></html>");
      }
      return mockResponse({}, 404);
    });
    const result = await checkExposedFiles("https://example.com");
    const listing = result.points.find((p) =>
      p.point.includes("Listado de directorios")
    );
    expect(listing?.estado).toBe("Fallido");
  });

  it("returns all 5 exposed-files points", async () => {
    vi.mocked(safeFetch).mockImplementation(async () => mockResponse({}, 404));
    const result = await checkExposedFiles("https://example.com");
    expect(result.category).toBe("Archivos Expuestos");
    expect(result.points).toHaveLength(5);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- checks`
Expected: FAIL — `checkExposedFiles` is not exported yet.

- [ ] **Step 3: Implement `checkExposedFiles` and append it to `checks.ts`**

Add to `src/lib/agents/scan/checks.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- checks`
Expected: PASS — all 13 tests in `checks.test.ts` green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/agents/scan/checks.ts src/lib/agents/scan/checks.test.ts
git commit -m "feat: add exposed-files scan check"
```

---

### Task 6: Check function — DNS/Email

**Files:**
- Modify: `src/lib/agents/scan/checks.ts`
- Create: `src/lib/agents/scan/checks-dns.test.ts`

**Interfaces:**
- Consumes: `node:dns/promises` (mocked in tests).
- Produces: `checkDNSEmail(hostname: string): Promise<CategoryCheckResult>`. Consumed by the orchestrator (Task 9).

- [ ] **Step 1: Write the failing tests**

Create `src/lib/agents/scan/checks-dns.test.ts` (separate file so the `node:dns/promises` mock doesn't collide with `checks.test.ts`'s `./ssrf-guard` mock):

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:dns/promises", () => ({
  resolveTxt: vi.fn(),
}));

import { resolveTxt } from "node:dns/promises";
import { checkDNSEmail } from "./checks";

describe("checkDNSEmail", () => {
  beforeEach(() => vi.mocked(resolveTxt).mockReset());

  it("marks SPF as No aplica when there is no record", async () => {
    vi.mocked(resolveTxt).mockRejectedValue(new Error("ENOTFOUND"));
    const result = await checkDNSEmail("example.com");
    const spf = result.points.find((p) => p.point.includes("SPF"));
    expect(spf?.estado).toBe("No aplica");
  });

  it("marks SPF as Aprobado when it ends in -all", async () => {
    vi.mocked(resolveTxt).mockImplementation(async (name: string) => {
      if (name === "example.com") return [["v=spf1 include:_spf.google.com -all"]];
      throw new Error("ENOTFOUND");
    });
    const result = await checkDNSEmail("example.com");
    const spf = result.points.find((p) => p.point.includes("SPF"));
    expect(spf?.estado).toBe("Aprobado");
  });

  it("marks SPF as Fallido when it doesn't end in -all", async () => {
    vi.mocked(resolveTxt).mockImplementation(async (name: string) => {
      if (name === "example.com") return [["v=spf1 include:_spf.google.com ~all"]];
      throw new Error("ENOTFOUND");
    });
    const result = await checkDNSEmail("example.com");
    const spf = result.points.find((p) => p.point.includes("SPF"));
    expect(spf?.estado).toBe("Fallido");
  });

  it("marks DMARC as Aprobado with policy reject", async () => {
    vi.mocked(resolveTxt).mockImplementation(async (name: string) => {
      if (name === "_dmarc.example.com") return [["v=DMARC1; p=reject;"]];
      throw new Error("ENOTFOUND");
    });
    const result = await checkDNSEmail("example.com");
    const dmarc = result.points.find((p) => p.point.includes("DMARC"));
    expect(dmarc?.estado).toBe("Aprobado");
  });

  it("returns all 3 DNS/email points", async () => {
    vi.mocked(resolveTxt).mockRejectedValue(new Error("ENOTFOUND"));
    const result = await checkDNSEmail("example.com");
    expect(result.category).toBe("DNS/Email");
    expect(result.points).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- checks-dns`
Expected: FAIL — `checkDNSEmail` is not exported yet.

- [ ] **Step 3: Implement `checkDNSEmail` and append it to `checks.ts`**

Add the import at the top of `src/lib/agents/scan/checks.ts`:

```typescript
import { resolveTxt } from "node:dns/promises"
```

Add the function:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- checks-dns`
Expected: PASS — all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/agents/scan/checks.ts src/lib/agents/scan/checks-dns.test.ts
git commit -m "feat: add DNS/email scan check"
```

---

### Task 7: Check function — TLS

**Files:**
- Modify: `src/lib/agents/scan/checks.ts`
- Create: `src/lib/agents/scan/checks-tls.test.ts`

**Interfaces:**
- Consumes: `node:tls` (mocked in tests).
- Produces: `checkTLS(hostname: string): Promise<CategoryCheckResult>`. Consumed by the orchestrator (Task 9).

- [ ] **Step 1: Write the failing test**

Create `src/lib/agents/scan/checks-tls.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:tls", () => ({
  default: { connect: vi.fn() },
}));

import tls from "node:tls";
import { checkTLS } from "./checks";

function fakeSocket() {
  const handlers: Record<string, (...args: unknown[]) => void> = {};
  return {
    on: (event: string, cb: (...args: unknown[]) => void) => {
      handlers[event] = cb;
    },
    end: vi.fn(),
    destroy: vi.fn(),
    getPeerCertificate: vi.fn(),
    getProtocol: vi.fn(),
    getCipher: vi.fn(),
    trigger: (event: string, ...args: unknown[]) => handlers[event]?.(...args),
  };
}

describe("checkTLS", () => {
  beforeEach(() => vi.mocked(tls.connect).mockReset());

  it("marks the certificate point as Pendiente on a connection error", async () => {
    const socket = fakeSocket();
    vi.mocked(tls.connect).mockImplementation((..._args: unknown[]) => {
      queueMicrotask(() => socket.trigger("error", new Error("connection refused")));
      return socket as never;
    });

    const result = await checkTLS("unreachable.example.com");
    const certPoint = result.points.find((p) => p.point.includes("Certificado válido"));
    expect(certPoint?.estado).toBe("Pendiente");
  });

  it("approves a valid cert with TLS1.3 and a strong cipher", async () => {
    const socket = fakeSocket();
    const now = new Date();
    const validFrom = new Date(now.getTime() - 86_400_000).toUTCString();
    const validTo = new Date(now.getTime() + 86_400_000 * 90).toUTCString();

    socket.getPeerCertificate.mockReturnValue({
      subject: { CN: "example.com" },
      valid_from: validFrom,
      valid_to: validTo,
      fingerprint: "AA:BB",
      issuerCertificate: {
        fingerprint: "CC:DD",
        issuerCertificate: undefined,
      },
    });
    socket.getProtocol.mockReturnValue("TLSv1.3");
    socket.getCipher.mockReturnValue({ name: "TLS_AES_128_GCM_SHA256" });

    vi.mocked(tls.connect).mockImplementation((..._args: unknown[]) => {
      queueMicrotask(() => socket.trigger("secureConnect"));
      return socket as never;
    });

    const result = await checkTLS("example.com");
    const certPoint = result.points.find((p) => p.point.includes("Certificado válido"));
    const protocolPoint = result.points.find((p) => p.point.includes("protocolos obsoletos"));
    expect(certPoint?.estado).toBe("Aprobado");
    expect(protocolPoint?.estado).toBe("Aprobado");
  });

  it("returns all 5 TLS points, with SSL Labs marked No aplica", async () => {
    const socket = fakeSocket();
    socket.getPeerCertificate.mockReturnValue({
      subject: { CN: "example.com" },
      valid_from: new Date().toUTCString(),
      valid_to: new Date(Date.now() + 86_400_000).toUTCString(),
      fingerprint: "AA:BB",
      issuerCertificate: undefined,
    });
    socket.getProtocol.mockReturnValue("TLSv1.2");
    socket.getCipher.mockReturnValue({ name: "ECDHE-RSA-AES128-GCM-SHA256" });

    vi.mocked(tls.connect).mockImplementation((..._args: unknown[]) => {
      queueMicrotask(() => socket.trigger("secureConnect"));
      return socket as never;
    });

    const result = await checkTLS("example.com");
    expect(result.category).toBe("TLS/SSL");
    expect(result.points).toHaveLength(5);
    const sslLabs = result.points.find((p) => p.point.includes("SSL Labs"));
    expect(sslLabs?.estado).toBe("No aplica");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- checks-tls`
Expected: FAIL — `checkTLS` is not exported yet.

- [ ] **Step 3: Implement `checkTLS` and append it to `checks.ts`**

Add the import at the top of `src/lib/agents/scan/checks.ts`:

```typescript
import tls from "node:tls"
```

Add the function:

```typescript
export function checkTLS(hostname: string): Promise<CategoryCheckResult> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      { host: hostname, port: 443, servername: hostname, timeout: 8000 },
      () => {
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
      }
    )

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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- checks-tls`
Expected: PASS — all 3 tests green.

- [ ] **Step 5: Run the full test suite**

Run: `npm run test`
Expected: PASS — every test file green (ssrf-guard, checks, checks-dns, checks-tls).

- [ ] **Step 6: Commit**

```bash
git add src/lib/agents/scan/checks.ts src/lib/agents/scan/checks-tls.test.ts
git commit -m "feat: add TLS scan check, completing the 6 check functions"
```

---

### Task 8: Prisma schema

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: `prisma.securityScanRun` client accessor, consumed by the API route (Task 10).

- [ ] **Step 1: Update the `Agent.type` doc comment and add `SecurityScanRun`**

In `prisma/schema.prisma`, change:

```prisma
  type            String   // "chat" | "form" | "link"
```
to:
```prisma
  type            String   // "chat" | "form" | "link" | "scan"
```

Then append this new model at the end of the file:

```prisma
model SecurityScanRun {
  id           String   @id @default(cuid())
  agentId      String
  userEmail    String
  target       String
  authorizedAt DateTime
  status       String   @default("running") // "running" | "completed" | "failed"
  findings     Json?
  summary      String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([agentId])
  @@index([userEmail])
  @@index([createdAt])
}
```

- [ ] **Step 2: Regenerate the Prisma client**

Run: `npx prisma generate`
Expected: "Generated Prisma Client" success message, no errors.

- [ ] **Step 3: Push the schema to the database**

Run: `npx prisma db push`
Expected: confirms the `SecurityScanRun` table was created.

> Note: local dev's `DATABASE_URL` currently points at a SQLite file while the schema provider is `postgresql` (a pre-existing mismatch unrelated to this feature — flagged earlier, not fixed here). If this command fails locally with a protocol error, that's the pre-existing issue, not a regression from this task. It will apply cleanly in production via the `postinstall` script (`prisma db push` against the real `DATABASE_URL`/Neon).

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add SecurityScanRun model to Prisma schema"
```

---

### Task 9: Orchestrator (Claude tool-use loop)

**Files:**
- Create: `src/lib/agents/scan/orchestrator.ts`

**Interfaces:**
- Consumes: `checkHeaders`, `checkTLS`, `checkExposedFiles`, `checkVersionLeak`, `checkCookies`, `checkDNSEmail` from `./checks` (Tasks 4-7); `CategoryCheckResult` from `@/lib/agents/types` (Task 2).
- Produces: `runSecurityScan(target: {url: string; hostname: string}, onProgress: (event: ScanProgressEvent) => void): Promise<ScanOutcome>`, `type ScanProgressEvent`, `interface ScanOutcome { findings: CategoryCheckResult[]; summary: string }`. Consumed by the API route (Task 10).

This task has no automated test — it requires a live `ANTHROPIC_API_KEY` and network access, and is verified end-to-end in Task 14. Mocking the Anthropic SDK's multi-turn tool loop would test the mock, not the integration; the manual verification against a real target is the meaningful test here, consistent with spec §5.

- [ ] **Step 1: Implement `orchestrator.ts`**

Create `src/lib/agents/scan/orchestrator.ts`:

```typescript
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

export async function runSecurityScan(
  target: { url: string; hostname: string },
  onProgress: (event: ScanProgressEvent) => void
): Promise<ScanOutcome> {
  const model = process.env.SCAN_AGENT_MODEL || "claude-sonnet-5"
  const systemPrompt = `Sos un agente de auditoría de seguridad web. Tu trabajo es auditar ${target.url} llamando cada una de las 6 tools disponibles exactamente una vez, en cualquier orden. Cada tool te devuelve resultados estructurados de una categoría del checklist de auditoría básica. Con esos resultados, escribí un resumen ejecutivo de 2-3 párrafos en español claro para un dueño de PyME sin conocimientos técnicos: explicá el hallazgo principal primero y qué conviene corregir antes. No repitas la lista completa de puntos en el resumen — eso ya se muestra aparte.`

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: `Auditá ${target.url}` },
  ]

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
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
        })
      } catch (err) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: `Error ejecutando el check: ${err instanceof Error ? err.message : String(err)}`,
          is_error: true,
        })
      }
    }

    messages.push({ role: "user", content: toolResults })
  }

  messages.push({
    role: "user",
    content:
      "Ya llamaste todas las tools necesarias. Devolveme ahora el resultado final estructurado con findings y summary.",
  })

  const finalResponse = await client.messages.create({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    thinking: { type: "adaptive" },
    messages,
    output_config: {
      format: { type: "json_schema", schema: OUTPUT_SCHEMA },
    },
  })

  const textBlock = finalResponse.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text"
  )
  if (!textBlock) {
    throw new Error("El agente no devolvió un resultado final")
  }

  return JSON.parse(textBlock.text) as ScanOutcome
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no new errors referencing `orchestrator.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/agents/scan/orchestrator.ts
git commit -m "feat: add Claude tool-use orchestrator for the security scan agent"
```

---

### Task 10: Streaming API route

**Files:**
- Create: `src/app/api/agents/[agent-id]/scan/stream/route.ts`

**Interfaces:**
- Consumes: `assertSafeTarget`, `UnsafeTargetError` from `@/lib/agents/scan/ssrf-guard` (Task 3); `runSecurityScan` from `@/lib/agents/scan/orchestrator` (Task 9); `checkRateLimit` from `@/lib/rate-limit` (existing); `prisma` from `@/lib/db` (existing).
- Produces: `POST /api/agents/[agent-id]/scan/stream` — SSE stream with events `check_started`, `check_completed`, `complete`, `error`. Consumed by the frontend (Task 11).

This task also has no automated unit test — it's a thin composition of already-tested pieces (SSRF guard, orchestrator, rate limit, Prisma) plus Next.js streaming plumbing, and is exercised end-to-end in Task 14.

- [ ] **Step 1: Implement the route**

Create `src/app/api/agents/[agent-id]/scan/stream/route.ts`:

```typescript
import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"
import { assertSafeTarget, UnsafeTargetError } from "@/lib/agents/scan/ssrf-guard"
import { runSecurityScan } from "@/lib/agents/scan/orchestrator"
import type { Prisma } from "@prisma/client"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ "agent-id": string }> }
) {
  const { "agent-id": agentId } = await params
  const body = await request.json()
  const { target, authorized, userEmail } = body as {
    target?: string
    authorized?: boolean
    userEmail?: string
  }

  if (!target || !userEmail || authorized !== true) {
    return new Response(
      JSON.stringify({ error: "Faltan datos requeridos o falta la autorización" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  const rateLimitCheck = checkRateLimit(`scan:${userEmail}`)
  if (!rateLimitCheck.allowed) {
    return new Response(
      JSON.stringify({ error: "Alcanzaste el límite de auditorías por hoy" }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    )
  }

  const agent = await prisma.agent.findFirst({
    where: { OR: [{ id: agentId }, { slug: agentId }] },
  })
  if (!agent || agent.type !== "scan") {
    return new Response(JSON.stringify({ error: "Agente no encontrado" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    })
  }

  let safeTarget: { url: string; hostname: string }
  try {
    safeTarget = await assertSafeTarget(target)
  } catch (err) {
    const message = err instanceof UnsafeTargetError ? err.message : "Target inválido"
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const run = await prisma.securityScanRun.create({
    data: {
      agentId: agent.id,
      userEmail,
      target: safeTarget.url,
      authorizedAt: new Date(),
      status: "running",
    },
  })

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        )
      }

      try {
        const outcome = await runSecurityScan(safeTarget, (progress) => {
          send(progress.type, progress)
        })

        await prisma.securityScanRun.update({
          where: { id: run.id },
          data: {
            status: "completed",
            findings: outcome.findings as unknown as Prisma.InputJsonValue,
            summary: outcome.summary,
          },
        })

        send("complete", outcome)
      } catch (err) {
        await prisma.securityScanRun.update({
          where: { id: run.id },
          data: { status: "failed" },
        })
        send("error", {
          message: err instanceof Error ? err.message : "Error desconocido",
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no new errors referencing the new route file.

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/agents/[agent-id]/scan/stream/route.ts"
git commit -m "feat: add SSE streaming endpoint for the security scan agent"
```

---

### Task 11: Frontend — AgentScanRunner

**Files:**
- Create: `src/components/sections/AgentScanRunner.tsx`

**Interfaces:**
- Consumes: `Agent` from `@/lib/agents/types` (existing); the SSE contract from Task 10 (`check_started`/`check_completed`/`complete`/`error` events).
- Produces: `AgentScanRunner` component, consumed by `AgentDetail.tsx` (Task 12).

- [ ] **Step 1: Implement the component**

Create `src/components/sections/AgentScanRunner.tsx`:

```tsx
"use client"

import { useState } from "react"
import { Agent } from "@/lib/agents/types"

interface ScanPoint {
  point: string
  result: string
  severity: string
  evidence: string
  recommendation: string
  estado: "Aprobado" | "Fallido" | "Pendiente" | "No aplica"
}

interface CategoryCheckResult {
  category: string
  points: ScanPoint[]
}

interface AgentScanRunnerProps {
  agent: Agent
  userEmail: string
}

const CATEGORIES = [
  { key: "check_headers", label: "Headers HTTP" },
  { key: "check_tls", label: "TLS/SSL" },
  { key: "check_exposed_files", label: "Archivos Expuestos" },
  { key: "check_version_leak", label: "Versiones/CVEs" },
  { key: "check_cookies", label: "Cookies/Auth" },
  { key: "check_dns_email", label: "DNS/Email" },
] as const

const ESTADO_STYLE: Record<string, string> = {
  Aprobado: "bg-green-500/10 text-green-400",
  Fallido: "bg-red-500/10 text-red-400",
  Pendiente: "bg-yellow-500/10 text-yellow-400",
  "No aplica": "bg-gray-500/10 text-gray-400",
}

function initialStatus(): Record<string, "pending" | "running" | "done"> {
  return Object.fromEntries(CATEGORIES.map((c) => [c.key, "pending"])) as Record<
    string,
    "pending" | "running" | "done"
  >
}

export const AgentScanRunner = ({ agent, userEmail }: AgentScanRunnerProps) => {
  const [target, setTarget] = useState("")
  const [authorized, setAuthorized] = useState(false)
  const [status, setStatus] = useState(initialStatus())
  const [running, setRunning] = useState(false)
  const [error, setError] = useState("")
  const [findings, setFindings] = useState<CategoryCheckResult[] | null>(null)
  const [summary, setSummary] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!target.trim() || !authorized || running) return

    setError("")
    setFindings(null)
    setSummary("")
    setStatus(initialStatus())
    setRunning(true)

    try {
      const response = await fetch(`/api/agents/${agent.id}/scan/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, authorized, userEmail }),
      })

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => null)
        setError(data?.error || "No se pudo iniciar la auditoría")
        setRunning(false)
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const chunks = buffer.split("\n\n")
        buffer = chunks.pop() || ""

        for (const chunk of chunks) {
          const eventLine = chunk.split("\n").find((l) => l.startsWith("event: "))
          const dataLine = chunk.split("\n").find((l) => l.startsWith("data: "))
          if (!eventLine || !dataLine) continue

          const eventType = eventLine.replace("event: ", "")
          const data = JSON.parse(dataLine.replace("data: ", ""))

          if (eventType === "check_started") {
            setStatus((prev) => ({ ...prev, [data.category]: "running" }))
          } else if (eventType === "check_completed") {
            setStatus((prev) => ({ ...prev, [data.category]: "done" }))
          } else if (eventType === "complete") {
            setFindings(data.findings)
            setSummary(data.summary)
          } else if (eventType === "error") {
            setError(data.message)
          }
        }
      }
    } catch (err) {
      console.error("Scan stream error:", err)
      setError("Error de conexión durante la auditoría")
    } finally {
      setRunning(false)
    }
  }

  const handleReset = () => {
    setFindings(null)
    setSummary("")
    setTarget("")
    setAuthorized(false)
    setStatus(initialStatus())
  }

  return (
    <div className="rounded-lg border border-gray-700 bg-gradient-to-b from-gray-900 to-gray-950 p-6">
      {!findings && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-2">
              Dominio o URL a auditar
            </label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="ejemplo.com"
              disabled={running}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
            />
          </div>

          <label className="flex items-start gap-3 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={authorized}
              onChange={(e) => setAuthorized(e.target.checked)}
              disabled={running}
              className="mt-1 h-4 w-4 flex-shrink-0 rounded border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500"
            />
            <span>
              Confirmo que soy propietario o tengo autorización para escanear este dominio
            </span>
          </label>

          <button
            type="submit"
            disabled={running || !target.trim() || !authorized}
            className="px-6 py-2 bg-cyan-400 text-gray-900 font-semibold rounded-lg hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {running ? "Auditando..." : "Auditar ahora"}
          </button>
        </form>
      )}

      {running && (
        <div className="mt-6 space-y-2">
          {CATEGORIES.map((c) => (
            <div
              key={c.key}
              className="flex items-center justify-between px-4 py-2 bg-gray-800/60 rounded border border-gray-700"
            >
              <span className="text-gray-300 text-sm">{c.label}</span>
              <span className="text-xs font-semibold">
                {status[c.key] === "done" && <span className="text-green-400">✓ Completado</span>}
                {status[c.key] === "running" && <span className="text-cyan-400">⟳ Corriendo…</span>}
                {status[c.key] === "pending" && <span className="text-gray-500">· Pendiente</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {findings && (
        <div className="space-y-6">
          <div className="text-gray-200 leading-relaxed whitespace-pre-line">{summary}</div>
          {findings.map((cat) => (
            <div key={cat.category}>
              <h3 className="text-lg font-bold text-white mb-3">{cat.category}</h3>
              <div className="space-y-2">
                {cat.points.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-4 px-4 py-3 bg-gray-800/60 rounded border border-gray-700"
                  >
                    <div>
                      <div className="text-sm text-gray-200 font-semibold">{p.point}</div>
                      <div className="text-xs text-gray-400 mt-1">{p.evidence}</div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${ESTADO_STYLE[p.estado]}`}
                    >
                      {p.estado}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={handleReset}
            className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold"
          >
            ← Auditar otro sitio
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no new errors referencing `AgentScanRunner.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/AgentScanRunner.tsx
git commit -m "feat: add AgentScanRunner frontend component"
```

---

### Task 12: Wire the scan type into AgentDetail and AgentCard

**Files:**
- Modify: `src/components/sections/AgentDetail.tsx`
- Modify: `src/components/sections/AgentCard.tsx`

**Interfaces:**
- Consumes: `AgentScanRunner` from `./AgentScanRunner` (Task 11).

- [ ] **Step 1: Add the `"scan"` branch to `AgentDetail.tsx`**

In `src/components/sections/AgentDetail.tsx`, add the import at the top:

```typescript
import { AgentScanRunner } from "./AgentScanRunner"
```

Then, right after the existing `if (agent.type === "link") { ... }` block (which ends around line 103) and before the final chat-oriented `return (...)`, insert:

```typescript
  // Para agentes tipo "scan", renderizar el runner de auditoría en vivo
  if (agent.type === "scan") {
    return (
      <div className="py-20 px-4 bg-gradient-to-b from-gray-900 to-gray-950 min-h-screen">
        <div className="max-w-2xl mx-auto">
          <a href="/agents" className="text-cyan-400 hover:text-cyan-300 mb-4 inline-block">
            ← Volver a Agentes
          </a>

          <div className="flex items-start gap-4 mb-8">
            <div className="text-6xl">{agent.icon}</div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{agent.name}</h1>
              <p className="text-gray-400 mb-4">{agent.fullDescription}</p>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400">
                🛡️ Auditoría en vivo
              </span>
            </div>
          </div>

          {userEmail ? (
            <AgentScanRunner agent={agent} userEmail={userEmail} />
          ) : (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 text-yellow-100">
              Ingresa tu email para iniciar la auditoría
            </div>
          )}
        </div>
      </div>
    )
  }
```

- [ ] **Step 2: Add a `"scan"` case to the type label in `AgentCard.tsx`**

In `src/components/sections/AgentCard.tsx`, change:

```typescript
  const typeLabel = agent.type === "chat" ? "💬 Chat" : agent.type === "form" ? "📋 Form" : "🔗 Link"
```
to:
```typescript
  const typeLabel =
    agent.type === "chat"
      ? "💬 Chat"
      : agent.type === "form"
      ? "📋 Form"
      : agent.type === "scan"
      ? "🛡️ Scan"
      : "🔗 Link"
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no new errors referencing `AgentDetail.tsx` or `AgentCard.tsx`.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/AgentDetail.tsx src/components/sections/AgentCard.tsx
git commit -m "feat: wire the scan agent type into AgentDetail and AgentCard"
```

---

### Task 13: Content entry and reseed

**Files:**
- Modify: `src/content/agents.ts`
- Modify: `prisma/seed.ts`

**Interfaces:**
- Produces: a new `Agent` row with `slug: "auditor-seguridad-ia"`, `type: "scan"`, visible in `/agents` and reachable at `/agents/auditor-seguridad-ia`.

- [ ] **Step 1: Add the entry to `src/content/agents.ts`**

In `src/content/agents.ts`, add this object to the `SEED_AGENTS` array (after the existing "Agent Job" entry, before the closing `]`):

```typescript
  {
    name: "Auditor de Seguridad con IA",
    slug: "auditor-seguridad-ia",
    description: "Un agente de IA audita tu sitio en vivo: headers, TLS, archivos expuestos, DNS y más",
    fullDescription:
      "Agente productivo que ejecuta una auditoría básica de seguridad real contra tu dominio: 28 puntos de control en 6 categorías, corridos en vivo por un agente de IA que interpreta los resultados y te explica qué corregir primero. No es un ejemplo — corre contra tu sitio de verdad, con tu autorización.",
    category: "productivo",
    type: "scan",
    icon: "🛡️",
  },
```

- [ ] **Step 2: Add the same entry to `prisma/seed.ts`**

In `prisma/seed.ts`, add the identical object (matching the existing duplicated-list pattern already used for the other agents) to its `SEED_AGENTS` array, before the closing `]`:

```typescript
  {
    name: "Auditor de Seguridad con IA",
    slug: "auditor-seguridad-ia",
    description: "Un agente de IA audita tu sitio en vivo: headers, TLS, archivos expuestos, DNS y más",
    fullDescription:
      "Agente productivo que ejecuta una auditoría básica de seguridad real contra tu dominio: 28 puntos de control en 6 categorías, corridos en vivo por un agente de IA que interpreta los resultados y te explica qué corregir primero. No es un ejemplo — corre contra tu sitio de verdad, con tu autorización.",
    category: "productivo",
    type: "scan",
    icon: "🛡️",
  },
```

- [ ] **Step 3: Reseed the database**

Run: `npm run seed`
Expected: output includes `Created/updated agent: Auditor de Seguridad con IA`.

(Same pre-existing local `DATABASE_URL` caveat as Task 8 applies here — if this fails locally, it's the known SQLite/postgresql mismatch, not a regression. Production reseeds automatically via `postinstall` on deploy.)

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/content/agents.ts prisma/seed.ts
git commit -m "feat: add Auditor de Seguridad con IA to the agents catalog"
```

---

### Task 14: End-to-end verification

**Files:** none (verification only)

**Interfaces:** none — this task exercises the full stack built in Tasks 1-13.

- [ ] **Step 1: Run the full automated test suite**

Run: `npm run test`
Expected: every test file passes (ssrf-guard, checks, checks-dns, checks-tls).

- [ ] **Step 2: Run a production build**

Run: `npm run build`
Expected: build succeeds, `/agents/auditor-seguridad-ia` appears in the route list.

- [ ] **Step 3: Start the dev server and confirm the agent renders**

Run: `npm run dev`, then in another terminal:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/agents/auditor-seguridad-ia
```

Expected: `200`.

- [ ] **Step 4: Run a real scan against `agentic-sec.vercel.app`**

With `ANTHROPIC_API_KEY` set in the environment, submit the form at `http://localhost:3000/agents/auditor-seguridad-ia` with target `agentic-sec.vercel.app`, the authorization checkbox checked, and a test email. Watch the live progress panel move through all 6 categories, then confirm the findings table renders.

Expected, matching what's already known to be true about that site (per `docs/superpowers/specs/2026-07-14-security-scan-agent-design.md` and the manual audit run earlier):
- All 6 header points **Aprobado** (the site already has CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
- `.env`, `.git/`, backups, admin panel all **Aprobado** (404s).
- Cookies category: all 3 points **No aplica** (the site sets no cookies).
- DNS/Email category: all 3 points **No aplica** (no custom domain/email configured).

If any of these diverge, treat it as a bug in the check functions or orchestrator prompt, not as a surprising true finding — this target's real state is already established.

- [ ] **Step 5: Confirm the `SecurityScanRun` record was persisted**

```bash
npx prisma studio
```

Open the `SecurityScanRun` table and confirm one row exists with `status: "completed"`, a populated `findings` JSON column, and a `summary` string.

- [ ] **Step 6: Stop the dev server**

No commit for this task — it's verification only. If Step 4 surfaces a bug, fix it in the relevant task's file, re-run that task's tests, and commit the fix with a `fix:` message before considering the plan complete.
