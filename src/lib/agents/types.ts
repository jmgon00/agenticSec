export interface Agent {
  id: string
  name: string
  slug: string
  description: string
  fullDescription: string
  category: "educativo" | "productivo"
  type: "chat" | "form" | "link" | "scan"
  icon: string
  instructions?: string
  inputFormat?: Record<string, unknown>
  maxTokens?: number
  temperature?: number
  externalUrl?: string
  features?: string[]
  active?: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: string // ISO 8601
  tokens?: number
}

export interface AgentSession {
  id: string
  userEmail: string
  agentId: string
  agent?: Agent
  title?: string
  messages: Message[]
  totalMessages: number
  totalTokens: number
  createdAt: Date
  updatedAt: Date
}

export interface AgentExecutionRequest {
  userEmail: string
  query: string
  sessionId?: string // null for new conversation
}

export interface AgentExecutionResponse {
  success: boolean
  response: string
  sessionId: string
  tokens: number
  timestamp: string
  error?: string
}

export type ScanEstado = "Aprobado" | "Fallido" | "Pendiente" | "No aplica"

export interface ScanPoint {
  point: string
  result: string
  severity: string
  evidence: string
  recommendation: string
  estado: ScanEstado
}

export interface CategoryCheckResult {
  category: string
  points: ScanPoint[]
}
