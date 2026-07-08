"use client"

import { useState } from "react"
import { Agent } from "@/lib/agents/types"

interface AgentFormProps {
  agent: Agent
  userEmail: string
  onSubmit: (formData: Record<string, string>) => Promise<void>
  isLoading?: boolean
}

export const AgentForm = ({
  agent,
  userEmail,
  onSubmit,
  isLoading = false,
}: AgentFormProps) => {
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [result, setResult] = useState<string>("")
  const [error, setError] = useState("")

  const fields = agent.inputFormat as Record<string, any> || {}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setResult("")

    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error processing form")
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {Object.entries(fields).map(([fieldName, fieldConfig]: [string, any]) => (
          <div key={fieldName}>
            <label className="block text-gray-300 font-semibold mb-2">
              {fieldConfig.label}
            </label>

            {fieldConfig.type === "textarea" && (
              <textarea
                value={formData[fieldName] || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    [fieldName]: e.target.value,
                  }))
                }
                placeholder={fieldConfig.placeholder}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 h-32"
              />
            )}

            {fieldConfig.type === "select" && (
              <select
                value={formData[fieldName] || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    [fieldName]: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="">Selecciona...</option>
                {fieldConfig.options?.map((opt: string) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-green-400">
            <p className="font-semibold mb-2">Resultado:</p>
            <div className="whitespace-pre-wrap text-sm">{result}</div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-6 py-3 bg-cyan-400 text-gray-900 font-semibold rounded-lg hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Procesando..." : "Enviar"}
        </button>
      </form>
    </div>
  )
}
