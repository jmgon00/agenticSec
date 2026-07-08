"use client"

import { useEffect, useState } from "react"
import { Agent, AgentSession } from "@/lib/agents/types"
import { AgentChat } from "./AgentChat"

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
