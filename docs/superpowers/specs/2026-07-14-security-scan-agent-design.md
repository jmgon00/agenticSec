# Security Scan Agent Design: AI-Driven Basic Web Audit

**Date:** 2026-07-14
**Author:** Juan Manuel González (with Claude)
**Status:** Approved

---

## 1. Vision & Goals

Turn the manual "Auditoría Básica de Seguridad Web" process (run once by hand against `agentic-sec.vercel.app` as the pilot case) into a self-service AI agent published under `/agents`. A visitor enters a domain they own or are authorized to test, and an AI agent — not a bare script — runs the same 28-point checklist live, narrating progress in real time and producing a findings table plus an executive summary.

This is the first of a planned line of "agentes de IA enfocados en seguridad y nuevas tecnologías" — the product differentiator is that a Claude-orchestrated agent performs the audit (interpreting results, assigning severity, writing the summary), not that a cron job runs curl and dumps output.

**Explicitly out of scope for this iteration (YAGNI):**
- IP/port scanning or any infrastructure-level reconnaissance — stays within the existing "Auditoría Básica" scope (domain/URL → headers, TLS, exposed files, versions, cookies, DNS/email). Port scanning belongs to the separate, more sensitive "Auditoría de Infraestructura & Pentest" service.
- A separate shareable/downloadable report page. V1 renders the findings table + executive summary inline in the agent's own page. A dedicated report URL is a fast-follow, not part of this build.
- User-selectable subset of the 6 categories. The agent always runs the full 28-point checklist, matching what's sold on `/security-services` — a partial scan would misrepresent the product.
- Any use of `npm audit`-style dependency scanning against the *target* — we only have source access to our own repo, not the visitor's. "Versiones/CVEs" for an external target is limited to what's observable from the outside (headers, version fingerprinting).

---

## 2. Architecture Overview

### 2.1 Data model

Extend the existing `Agent.type` union (currently `"chat" | "form" | "link"`) to add `"scan"`.

New Prisma model, separate from `AgentSession` because the shape is structured findings, not a chat transcript:

```prisma
model SecurityScanRun {
  id            String   @id @default(cuid())
  agentId       String
  userEmail     String
  target        String
  authorizedAt  DateTime
  status        String   // "running" | "completed" | "failed"
  findings      Json?    // structured per-point results, populated on completion
  summary       String?  // AI-written executive summary, populated on completion
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

`authorizedAt` + `target` + `userEmail` together form the audit trail proving the visitor attested ownership/authorization before any network check ran.

### 2.2 Check engine (deterministic, Node-native)

`src/lib/agents/scan/checks.ts` — six functions, one per checklist category, implemented with Node's built-in `fetch`, `tls`, and `dns` modules. No shelling out to `curl`/`openssl`/`nslookup` (not guaranteed available in the Vercel Functions runtime; native modules are portable and reliable):

- `checkHeaders(url)` — CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (6 points)
- `checkTLS(host)` — cert validity/chain, protocol version, cipher strength (4 of the 5 TLS checklist points, covered natively via `tls.connect`). The 5th point, SSL Labs grade, is not run live — same external-API unreliability we hit today — and is always reported as `"No evaluable"` in the findings for scan-type runs, with a note pointing to a manual SSL Labs check as follow-up.
- `checkExposedFiles(url)` — `.env`, `.git/HEAD`, common backup paths, directory listing, admin panels (5 points)
- `checkVersionLeak(url)` — framework/version fingerprinting from headers only (4 points, scoped down from today's manual run — see §1)
- `checkCookies(url)` — Secure/HttpOnly/SameSite flags on any `Set-Cookie`, or explicit "no cookies set" (covers 3 of the 5 cookie/auth points; the other 2 — login error messages, rate limiting — require app-specific knowledge we don't have for an arbitrary external target and are marked "no evaluable" for scan-type runs)
- `checkDNSEmail(domain)` — SPF/DKIM/DMARC via `dns.resolveTxt` (3 points)

**SSRF guard — mandatory, not optional.** Before any check touches the network:
- Resolve the target hostname; reject if it resolves to a private, loopback, link-local, multicast, or cloud-metadata range (`169.254.169.254`, `169.254.170.2`, RFC1918, etc.).
- Allow only `http`/`https` on ports 80/443.
- Re-validate the resolved IP on every redirect hop (classic redirect-based SSRF bypass) and cap redirects (max 3).
- Per-check timeout (~8s) and an overall run timeout budget to stay well inside the Vercel function limit.

Without this, the agent is a public SSRF proxy against whatever internal infrastructure a visitor points it at — this is a hard requirement, not a nice-to-have.

### 2.3 Orchestrator (the actual AI agent)

`src/lib/agents/scan/orchestrator.ts` — a Messages API tool-use loop (manual loop, not the beta Tool Runner, to avoid taking on a beta SDK dependency for a small, fixed tool surface of 6 tools).

- **Model:** `claude-sonnet-5`, configurable via env var. Chosen over Opus 4.8 for cost/latency on a public-facing, per-visitor feature; Opus 4.8 is a one-line env change if quality needs to be prioritized over cost later.
- **Thinking:** adaptive (`thinking: {type: "adaptive"}`), effort `medium`.
- Six tools are declared, one per check function in §2.2. System prompt instructs Claude to call each tool exactly once, interpret the returned structured sub-results, assign severity and estado per point (Aprobado/Fallido/Pendiente/No aplica — same vocabulary as the manual report), and finish with a structured final answer (`output_config.format` / `client.messages.parse()`) containing the full findings array plus a short executive summary paragraph in plain-language Spanish, matching the tone of the report we already produced.
- The **execution** of each check is fully deterministic (the tool functions), but the **orchestration** — order, interpretation, severity judgment calls, and the narrative — is genuinely the model's job. This is what makes it "an AI agent runs the audit" rather than a script with an LLM caption bolted on, while still guaranteeing complete, predictable coverage of the sold 28-point checklist.

### 2.4 Streaming endpoint

`POST /api/agents/[agent-id]/scan/stream` — a Route Handler returning a `ReadableStream` (SSE):

1. Validate body: `target`, `authorized: true`, `userEmail`.
2. Rate limit by email, reusing the existing `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX_REQUESTS` pattern already used by `/api/contact` (proposed default: 3 scans/day/email).
3. Resolve + SSRF-check the target *before* calling Claude at all — reject early with a clear message, no tokens spent on a target we're not going to scan.
4. Create the `SecurityScanRun` row (`status: "running"`), start the orchestrator loop.
5. On each `tool_use` from Claude: run the corresponding check function, stream a `check_started` then `check_completed` (with the partial result) SSE event, then return the `tool_result` to Claude so the loop continues.
6. On completion: persist `findings` + `summary` (`status: "completed"`), stream a final `complete` event.
7. On any failure mid-run: stream an `error` event, mark the run `"failed"`, but leave whatever was already streamed/persisted intact — partial progress isn't discarded.

### 2.5 Frontend

New component `src/components/sections/AgentScanRunner.tsx`, rendered by `AgentDetail.tsx` when `agent.type === "scan"` (parallel to the existing `"link"` branch).

- **Form:** target domain/URL input, a required authorization checkbox ("Confirmo que soy propietario o tengo autorización para escanear este dominio"), and email capture reusing the existing `EmailModal` / `localStorage` pattern shared with the other agents.
- **Running state:** opens the stream via `fetch` + a `ReadableStream` reader (not native `EventSource`, since the request is a POST with a body). Renders the live console-style panel already approved — the 6 categories with pending/running/done state updating as events arrive.
- **Completed state:** findings table grouped by category with the same semantic pills (Aprobado/Fallido/Pendiente/No aplica) used in the technical report artifact, plus the agent's executive summary text.

### 2.6 Content entry

New `SEED_AGENTS` entry (both `src/content/agents.ts` and the duplicated `prisma/seed.ts` list, per the existing — if awkward — pattern) with `type: "scan"`, a new slug (e.g. `auditor-seguridad-ia`), icon, and description positioning it as the AI-driven version of the existing Auditoría Básica.

---

## 3. Data Flow (happy path)

1. Visitor opens `/agents/auditor-seguridad-ia`.
2. `AgentDetail` sees `type === "scan"` and renders `AgentScanRunner`.
3. Visitor enters target, checks the authorization box, provides email (if not already in `localStorage`).
4. Client POSTs to the streaming endpoint and opens the SSE reader.
5. Server: rate-limit check → SSRF-validate target → create `SecurityScanRun` → start orchestrator.
6. Orchestrator calls each of the 6 tools in turn; server executes the real check, streams progress, feeds the result back to Claude.
7. Claude returns the final structured findings + summary; server persists and streams `complete`.
8. Client renders the findings table + summary from the final event.

---

## 4. Error Handling

| Failure | Behavior |
|---|---|
| Target resolves to private/loopback/metadata IP | Reject before any Claude call, clear user-facing message, no `SecurityScanRun` created |
| Rate limit exceeded | 429 with a friendly "ya usaste tus auditorías de hoy" message |
| Individual check function throws/times out | That category reports `"Pendiente"` with the error as evidence; loop continues — one failed check doesn't abort the whole run |
| Claude API error mid-loop | Stream an `error` SSE event, mark run `"failed"`, keep whatever categories already completed and were streamed |
| Client disconnects mid-stream | Run continues server-side to completion and is persisted; visitor can't resume the live view but the record exists for support/debugging |

---

## 5. Testing

- Unit tests for each check function (`checks.ts`) against mocked `fetch`/`tls`/`dns` responses — both pass and fail cases per checklist point.
- Unit tests for the SSRF guard specifically: private ranges, loopback, link-local, cloud metadata IPs, redirect-to-private-IP.
- Manual end-to-end run against `agentic-sec.vercel.app` as the first real target (same site audited manually today) — results should match what we already know is true about that site, serving as the acceptance test for the whole pipeline.

---

## 6. Open Items for Implementation Plan

- Exact JSON schema for the structured final output (`output_config.format`) — to be nailed down during planning, shaped to match the findings-table columns already established (Punto, Categoría, Resultado, Severidad, Evidencia, Recomendación, Estado).

**Decided, not deferred:** `SecurityScanRun` rows are persisted in this iteration (needed for the audit trail and rate limiting), but there is **no history/list UI** to browse past runs in V1 — a visitor only sees the result of the run they just triggered, in-page. Browsing past scans is out of scope for this build, consistent with the other V1 scope cuts in §1.
