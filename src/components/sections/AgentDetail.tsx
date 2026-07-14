"use client"

import { useEffect, useState } from "react"
import { Agent, AgentSession } from "@/lib/agents/types"
import { AgentChat } from "./AgentChat"
import { AgentScanRunner } from "./AgentScanRunner"

interface AgentDetailProps {
  agentSlug: string
}

export const AgentDetail = ({ agentSlug }: AgentDetailProps) => {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [userSession, setUserSession] = useState<AgentSession | null>(null)
  const [userEmail, setUserEmail] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const email = localStorage.getItem("agenticsec_user_email") || ""
    setUserEmail(email)

    const fetchAgent = async () => {
      try {
        const response = await fetch(`/api/agents/${agentSlug}`, {
          headers: email ? { "X-User-Email": email } : {},
        })
        const data = await response.json()
        if (data.success) {
          setAgent(data.data.agent)
          setUserSession(data.data.userSession)
        }
      } catch (error) {
        console.error("Failed to fetch agent:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAgent()
  }, [agentSlug])

  if (loading) return <div className="text-center py-20 text-gray-400">Cargando agente...</div>
  if (!agent) return <div className="text-center py-20 text-red-400">Agente no encontrado</div>

  // Para agentes tipo "link", renderizar landing page
  if (agent.type === "link") {
    return (
      <div className="py-20 px-4 bg-gradient-to-b from-gray-900 to-gray-950 min-h-screen">
        <div className="max-w-2xl mx-auto">
          <a href="/agents" className="text-cyan-400 hover:text-cyan-300 mb-8 inline-block">
            ← Volver a Agentes
          </a>

          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-lg p-8 mb-8">
            <div className="flex items-start gap-6 mb-8">
              <div className="text-7xl">{agent.icon}</div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-3">{agent.name}</h1>
                <p className="text-gray-300 text-lg mb-6">{agent.fullDescription}</p>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    agent.category === "educativo"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-purple-500/20 text-purple-400"
                  }`}>
                    {agent.category === "educativo" ? "📚 Educativo" : "🔧 Productivo"}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400">
                    🔗 Externo
                  </span>
                </div>
              </div>
            </div>

            {/* Features */}
            {agent.features && agent.features.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">Características</h2>
                <ul className="space-y-2">
                  {agent.features.map((feature, idx) => (
                    <li key={idx} className="text-gray-300 flex items-center gap-3">
                      <span className="text-cyan-400">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CTA Button */}
            <a
              href={agent.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-magenta-500 hover:from-cyan-400 hover:to-magenta-400 text-white font-semibold px-6 py-3 rounded-lg transition-all hover:shadow-lg hover:shadow-cyan-500/30"
            >
              Ir a {agent.name}
              <span>↗</span>
            </a>
          </div>
        </div>
      </div>
    )
  }

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

  return (
    <div className="py-20 px-4 bg-gradient-to-b from-gray-900 to-gray-950 min-h-screen">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <a href="/agents" className="text-cyan-400 hover:text-cyan-300 mb-4 inline-block">
            ← Volver a Agentes
          </a>

          <div className="flex items-start gap-4 mb-6">
            <div className="text-6xl">{agent.icon}</div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{agent.name}</h1>
              <p className="text-gray-400 mb-4">{agent.fullDescription}</p>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  agent.category === "educativo"
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-purple-500/20 text-purple-400"
                }`}>
                  {agent.category === "educativo" ? "📚 Educativo" : "🔧 Productivo"}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400">
                  {agent.type === "chat" ? "💬 Chat" : "📋 Formulario"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Interactuar</h2>
          {userEmail ? (
            <AgentChat
              agent={agent}
              userEmail={userEmail}
              initialMessages={userSession?.messages || []}
              sessionId={userSession?.id}
            />
          ) : (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 text-yellow-100">
              Ingresa tu email para guardar tu conversación
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
