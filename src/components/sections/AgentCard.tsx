"use client"

import Link from "next/link"
import { Agent } from "@/lib/agents/types"

interface AgentCardProps {
  agent: Agent
}

export const AgentCard = ({ agent }: AgentCardProps) => {
  const categoryColor = agent.category === "educativo" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"
  const typeLabel = agent.type === "chat" ? "💬 Chat" : agent.type === "form" ? "📋 Form" : "🔗 Link"

  return (
    <Link href={`/agents/${agent.slug}`}>
      <div className="rounded-lg border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 p-6 transition-all duration-300 ease-out hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/20 cursor-pointer">
        {/* Icon */}
        <div className="mb-4 text-5xl">{agent.icon}</div>

        {/* Title */}
        <h3 className="mb-3 text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
          {agent.name}
        </h3>

        {/* Description */}
        <p className="mb-4 line-clamp-2 text-sm text-gray-400">
          {agent.description}
        </p>

        {/* Badges */}
        <div className="flex gap-2 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${categoryColor}`}>
            {agent.category === "educativo" ? "📚 Educativo" : "🔧 Productivo"}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400">
            {typeLabel}
          </span>
        </div>

        {/* CTA */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <span className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold flex items-center gap-2 group/cta">
            Usar Agente
            <span className="group-hover/cta:translate-x-1 transition-transform">→</span>
          </span>
        </div>
      </div>
    </Link>
  )
}
