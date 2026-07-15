"use client"

import { useState } from "react"
import { Agent, CategoryCheckResult } from "@/lib/agents/types"
import { ASSESSMENT_CATEGORIES } from "@/lib/agents/assessment/questions"
import { ScanResultsView } from "./ScanResultsView"

interface AgentAssessmentRunnerProps {
  agent: Agent
  userEmail: string
}

function initialAnswers(): Record<string, string> {
  const answers: Record<string, string> = {}
  for (const cat of ASSESSMENT_CATEGORIES) {
    for (const q of cat.questions) {
      answers[q.id] = ""
    }
  }
  return answers
}

export const AgentAssessmentRunner = ({ agent, userEmail }: AgentAssessmentRunnerProps) => {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers())
  const [running, setRunning] = useState(false)
  const [error, setError] = useState("")
  const [findings, setFindings] = useState<CategoryCheckResult[] | null>(null)
  const [summary, setSummary] = useState("")
  const [riskScore, setRiskScore] = useState<number | null>(null)
  const [osintNombre, setOsintNombre] = useState("")
  const [osintTelefono, setOsintTelefono] = useState("")
  const [osintDni, setOsintDni] = useState("")
  const [osintConsent, setOsintConsent] = useState(false)

  const allAnswered = Object.values(answers).every((v) => v !== "")

  const handleAnswer = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allAnswered || running) return

    setError("")
    setRunning(true)
    try {
      const osintSearch =
        osintConsent && osintNombre.trim()
          ? {
              nombreCompleto: osintNombre.trim(),
              telefono: osintTelefono.trim() || undefined,
              dni: osintDni.trim() || undefined,
              consent: true as const,
            }
          : undefined

      const response = await fetch(`/api/agents/${agent.id}/assessment/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, userEmail, osintSearch }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data?.error || "No se pudo generar la evaluación")
        return
      }
      setFindings(data.findings)
      setSummary(data.summary)
      setRiskScore(data.riskScore)
    } catch (err) {
      console.error("Assessment run error:", err)
      setError("Error de conexión al generar la evaluación")
    } finally {
      setRunning(false)
    }
  }

  const handleReset = () => {
    setAnswers(initialAnswers())
    setFindings(null)
    setSummary("")
    setRiskScore(null)
    setOsintNombre("")
    setOsintTelefono("")
    setOsintDni("")
    setOsintConsent(false)
  }

  return (
    <div className="rounded-lg border border-gray-700 bg-gradient-to-b from-gray-900 to-gray-950 p-6">
      {!findings && (
        <form onSubmit={handleSubmit} className="space-y-8">
          {ASSESSMENT_CATEGORIES.map((cat) => (
            <div key={cat.key}>
              <h3 className="text-lg font-bold text-white mb-3">{cat.label}</h3>
              <div className="space-y-4">
                {cat.questions.map((q) => (
                  <div key={q.id}>
                    <label className="block text-gray-300 text-sm font-semibold mb-2">{q.label}</label>
                    <div className="flex flex-wrap gap-2">
                      {q.options.map((opt) => (
                        <label
                          key={opt.value}
                          className={`px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                            answers[q.id] === opt.value
                              ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                              : "border-gray-600 bg-gray-800 text-gray-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            value={opt.value}
                            checked={answers[q.id] === opt.value}
                            onChange={() => handleAnswer(q.id, opt.value)}
                            disabled={running}
                            className="sr-only"
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {cat.key === "identidad" && (
                <div className="mt-6 p-4 border border-cyan-400/30 bg-cyan-400/5 rounded-lg space-y-3">
                  <div>
                    <div className="text-sm font-semibold text-cyan-300">
                      Opcional: dejá que busquemos tu exposición pública por vos
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Completá tu nombre (y opcionalmente teléfono/DNI) para que un agente de IA busque
                      en internet qué información pública existe sobre vos, en vez de que lo hagas manualmente.
                    </p>
                  </div>
                  <input
                    type="text"
                    value={osintNombre}
                    onChange={(e) => setOsintNombre(e.target.value)}
                    placeholder="Nombre completo"
                    disabled={running}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
                  />
                  <input
                    type="text"
                    value={osintTelefono}
                    onChange={(e) => setOsintTelefono(e.target.value)}
                    placeholder="Teléfono (opcional)"
                    disabled={running}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
                  />
                  <input
                    type="text"
                    value={osintDni}
                    onChange={(e) => setOsintDni(e.target.value)}
                    placeholder="DNI (opcional)"
                    disabled={running}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
                  />
                  <label className="flex items-start gap-3 text-xs text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={osintConsent}
                      onChange={(e) => setOsintConsent(e.target.checked)}
                      disabled={running}
                      className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span>
                      Confirmo que estos son mis propios datos, autorizo la búsqueda pública en internet, y
                      entiendo que se envían a un servicio de búsqueda de terceros para generar el resultado.
                      No se guardan mi nombre, teléfono ni DNI.
                    </span>
                  </label>
                </div>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={running || !allAnswered}
            className="px-6 py-2 bg-cyan-400 text-gray-900 font-semibold rounded-lg hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {running ? "Generando evaluación..." : "Generar evaluación"}
          </button>
        </form>
      )}

      {error && (
        <div className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {findings && riskScore !== null && (
        <div className="space-y-6">
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-cyan-400">{riskScore}/100</div>
            <div className="text-gray-400 text-sm mt-1">Puntaje de seguridad personal</div>
          </div>
          <ScanResultsView
            target="Evaluación de Seguridad Personal"
            summary={summary}
            findings={findings}
            reportEndpoint={`/api/agents/${agent.id}/assessment/report`}
            onReset={handleReset}
            resetLabel="← Hacer otra evaluación"
          />
        </div>
      )}
    </div>
  )
}
