"use client"

import { useState } from "react"
import { CategoryCheckResult } from "@/lib/agents/types"

interface ScanResultsViewProps {
  target: string
  summary: string
  findings: CategoryCheckResult[]
  reportEndpoint: string
  onReset: () => void
  resetLabel: string
}

const ESTADO_STYLE: Record<string, string> = {
  Aprobado: "bg-green-500/10 text-green-400",
  Fallido: "bg-red-500/10 text-red-400",
  Pendiente: "bg-yellow-500/10 text-yellow-400",
  "No aplica": "bg-gray-500/10 text-gray-400",
}

export const ScanResultsView = ({
  target,
  summary,
  findings,
  reportEndpoint,
  onReset,
  resetLabel,
}: ScanResultsViewProps) => {
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "generating" | "error">("idle")

  const handleDownloadReport = async () => {
    setDownloadStatus("generating")
    try {
      const response = await fetch(reportEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, summary, findings }),
      })

      if (!response.ok) {
        setDownloadStatus("error")
        return
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const cleanTarget = target.replace(/^https?:\/\//, "").replace(/[^a-zA-Z0-9.-]/g, "-")
      const dateStr = new Date().toISOString().slice(0, 10)
      const link = document.createElement("a")
      link.href = url
      link.download = `reporte-seguridad-${cleanTarget}-${dateStr}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setDownloadStatus("idle")
    } catch (err) {
      console.error("Report download error:", err)
      setDownloadStatus("error")
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-gray-200 leading-relaxed whitespace-pre-line">{summary}</div>

      <div>
        <button
          onClick={handleDownloadReport}
          disabled={downloadStatus === "generating"}
          className="px-4 py-2 bg-gray-800 border border-cyan-400 text-cyan-400 font-semibold rounded-lg hover:bg-cyan-400 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {downloadStatus === "generating" ? "Generando PDF..." : "Descargar reporte (PDF)"}
        </button>
        {downloadStatus === "error" && (
          <p className="mt-2 text-sm text-red-400">
            No se pudo generar el PDF. Intentá de nuevo.
          </p>
        )}
      </div>

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

      <button onClick={onReset} className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold">
        {resetLabel}
      </button>
    </div>
  )
}
