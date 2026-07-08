"use client"

import { useEffect, useState } from "react"
import { Agent } from "@/lib/agents/types"
import { AgentCard } from "./AgentCard"

type Category = "all" | "educativo" | "productivo"

export const AgentGallery = () => {
  const [agents, setAgents] = useState<Agent[]>([])
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<Category>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch agents on mount
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch("/api/agents")
        const data = await response.json()
        if (data.success) {
          setAgents(data.data)
          setFilteredAgents(data.data)
        }
      } catch (error) {
        console.error("Failed to fetch agents:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAgents()
  }, [])

  // Filter agents when category or search changes
  useEffect(() => {
    let filtered = agents

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((a) => a.category === selectedCategory)
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredAgents(filtered)
  }, [selectedCategory, searchQuery, agents])

  return (
    <div className="py-20 px-4 bg-gradient-to-b from-gray-900 to-gray-950">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-magenta-400 bg-clip-text text-transparent">
            Explora Agentes de IA
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Educativos, productivos y más. Aprende e interactúa con agentes inteligentes.
          </p>
        </div>

        {/* Filters & Search */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Buscar agente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Category Filters */}
          <div className="flex gap-3 flex-wrap">
            {(["all", "educativo", "productivo"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  selectedCategory === cat
                    ? "bg-cyan-400 text-gray-900"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {cat === "all" ? "Todos" : cat === "educativo" ? "📚 Educativos" : "🔧 Productivos"}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="text-center text-gray-400">Cargando agentes...</div>
        ) : filteredAgents.length === 0 ? (
          <div className="text-center text-gray-400">
            No se encontraron agentes. Intenta con otro filtro.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
