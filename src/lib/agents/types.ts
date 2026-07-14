export interface Agent {
  id: string
  name: string
  slug: string
  description: string
  fullDescription: string
  category: "educativo" | "productivo"
  type: "chat" | "form" | "link" | "scan" | "assessment"
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

export interface AssessmentAnswers {
  identidadBuscasteNombre: "si" | "no"
  identidadDatosIndexados: "si" | "no" | "no_se"
  identidadPerfilesViejos: "si" | "no" | "no_se"
  identidadUsuarioRepetido: "si" | "no"

  cuentasMfaEmail: "si" | "no"
  cuentasMfaRedes: "si" | "no" | "parcial"
  cuentasCantidad: "menos_20" | "20_80" | "mas_80" | "no_se"
  cuentasRevisoTerceros: "si" | "no"

  passwordsGestor: "si" | "no"
  passwordsReutiliza: "si" | "no" | "no_se"
  passwordsLargas: "si" | "no" | "no_se"
  passwordsCambioEmail: "si" | "no" | "no_se"

  redesPerfilPublico: "si" | "no" | "mixto"
  redesFotosSensibles: "si" | "no" | "a_veces"
  redesMuestraTrabajo: "si" | "no"
  redesGeolocalizacion: "si" | "no" | "no_se"

  dispositivosBloqueo: "todos" | "algunos" | "ninguno"
  dispositivosCifrado: "si" | "no" | "no_se"
  dispositivosActualizados: "si" | "no" | "no_se"
  dispositivosAntivirus: "si" | "no" | "no_aplica"

  redRouterProtocolo: "wpa3" | "wpa2" | "wep_o_abierta" | "no_se"
  redPasswordDefault: "si" | "no" | "no_se"
  redWpsDesactivado: "si" | "no" | "no_se"
  redIotSeparada: "si" | "no" | "no_tiene_iot"

  ingSocialFechaNacimiento: "si" | "no"
  ingSocialPreguntasSeguridad: "si" | "no" | "no_se"
  ingSocialDatosFamiliares: "si" | "no"
  ingSocialContactosDesconocidos: "si" | "no" | "a_veces"
}
