export interface Agent {
  id: string
  name: string
  slug: string
  description: string
  fullDescription: string
  category: "educativo" | "productivo"
  type: "chat" | "form"
  icon: string
  instructions: string
  inputFormat?: Record<string, unknown>
  maxTokens: number
  temperature: number
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
