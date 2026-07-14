### Task 8: Componente `AgentAssessmentRunner` (formulario)

**Files:**
- Create: `src/components/sections/AgentAssessmentRunner.tsx`

**Interfaces:**
- Consumes: `ASSESSMENT_CATEGORIES` de `@/lib/agents/assessment/questions` (Task 3); `ScanResultsView` de `./ScanResultsView` (Task 7); `POST /api/agents/[agent-id]/assessment/run` (Task 5).
- Produces: `export const AgentAssessmentRunner: React.FC<{ agent: Agent; userEmail: string }>` — usado por Task 9 (`AgentDetail.tsx`).

- [ ] **Step 1: Crear `AgentAssessmentRunner.tsx`**

Crear `src/components/sections/AgentAssessmentRunner.tsx`:

```tsx
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
      const response = await fetch(`/api/agents/${agent.id}/assessment/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, userEmail }),
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
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: sin errores.

- [ ] **Step 3: Correr toda la suite (regresión)**

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/AgentAssessmentRunner.tsx
git commit -m "feat: add AgentAssessmentRunner questionnaire component"
```

---

