"use client"

import { useState } from "react"
import { Agent, CategoryCheckResult } from "@/lib/agents/types"
import { ScanResultsView } from "./ScanResultsView"

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
            <label htmlFor="scan-target" className="block text-gray-300 text-sm font-semibold mb-2">
              Dominio o URL a auditar
            </label>
            <input
              id="scan-target"
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
        <ScanResultsView
          target={target}
          summary={summary}
          findings={findings}
          reportEndpoint={`/api/agents/${agent.id}/scan/report`}
          onReset={handleReset}
          resetLabel="← Auditar otro sitio"
        />
      )}
    </div>
  )
}
